import { db, auth } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Tenant, Invoice, TenantWithBilling, MasterAdmin } from '../types';
import { BillingService } from './billing';
import { PaymentService } from './payment';

const DAYS_TO_BLOCK = 5; // Dias de atraso para bloquear

/**
 * Serviço do Master Admin
 * Gerencia todas as clínicas/tenants do sistema
 */
export class MasterAdminService {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Verifica se usuário é Master Admin
   */
  async isMasterAdmin(uid: string): Promise<boolean> {
    try {
      const masterDoc = await getDoc(doc(db, 'masterAdmins', uid));
      return masterDoc.exists() && masterDoc.data()?.isMasterAdmin === true;
    } catch {
      return false;
    }
  }

  /**
   * Cria um Master Admin
   */
  async createMasterAdmin(uid: string, email: string, name: string): Promise<void> {
    const masterAdmin: MasterAdmin = {
      id: uid,
      uid,
      email,
      name,
      isMasterAdmin: true,
      createdAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'masterAdmins', uid), masterAdmin);
  }

  /**
   * Obtém todas as clínicas com informações de faturamento
   */
  async getAllTenantsWithBilling(): Promise<TenantWithBilling[]> {
    const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
    const results: TenantWithBilling[] = [];

    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantData = tenantDoc.data() as Tenant;
      const tenantId = tenantDoc.id;

      // Contar profissionais ativos
      const professionalsSnapshot = await getDocs(
        collection(db, `tenants/${tenantId}/professionals`)
      );
      const professionalsCount = professionalsSnapshot.docs.filter(
        d => d.data().isActive === true
      ).length;

      // Calcular valor do mês atual
      const currentMonthAmount = professionalsCount * 39.90;

      // Buscar faturas vencidas
      const invoicesSnapshot = await getDocs(
        collection(db, `tenants/${tenantId}/invoices`)
      );
      
      let overdueAmount = 0;
      let lastPaymentDate: string | undefined;
      let hasOverdue = false;
      let hasPending = false;
      
      invoicesSnapshot.docs.forEach(invDoc => {
        const inv = invDoc.data() as Invoice;
        if (inv.status === 'overdue') {
          overdueAmount += inv.totalAmount;
          hasOverdue = true;
        }
        if (inv.status === 'pending') {
          hasPending = true;
        }
        if (inv.status === 'paid' && inv.paidAt) {
          const paidDate = inv.paidAt.toDate?.() || new Date(inv.paidAt);
          if (!lastPaymentDate || paidDate > new Date(lastPaymentDate)) {
            lastPaymentDate = paidDate.toISOString().split('T')[0];
          }
        }
      });

      // Determinar status da assinatura
      let subscriptionStatus: TenantWithBilling['subscriptionStatus'] = 'active';
      if (tenantData.status === 'suspended') {
        subscriptionStatus = 'blocked';
      } else if (hasOverdue) {
        subscriptionStatus = 'overdue';
      } else if (hasPending) {
        subscriptionStatus = 'pending';
      }

      results.push({
        ...tenantData,
        id: tenantId,
        professionalsCount,
        currentMonthAmount: Math.round(currentMonthAmount * 100) / 100,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        lastPaymentDate,
        subscriptionStatus,
        billingEmail: tenantData.settings?.termsOfUse || undefined, // placeholder
        dueDay: 10 // dia de vencimento padrão
      });
    }

    // Ordenar por nome da empresa
    results.sort((a, b) => a.companyName.localeCompare(b.companyName));

    return results;
  }

  /**
   * Obtém resumo geral do sistema
   */
  async getSystemSummary(): Promise<{
    totalTenants: number;
    activeTenants: number;
    blockedTenants: number;
    totalProfessionals: number;
    monthlyRevenue: number;
    overdueTotal: number;
    pendingInvoices: number;
  }> {
    const tenants = await this.getAllTenantsWithBilling();
    
    return {
      totalTenants: tenants.length,
      activeTenants: tenants.filter(t => t.subscriptionStatus === 'active').length,
      blockedTenants: tenants.filter(t => t.subscriptionStatus === 'blocked').length,
      totalProfessionals: tenants.reduce((sum, t) => sum + t.professionalsCount, 0),
      monthlyRevenue: tenants.reduce((sum, t) => sum + t.currentMonthAmount, 0),
      overdueTotal: tenants.reduce((sum, t) => sum + t.overdueAmount, 0),
      pendingInvoices: tenants.filter(t => 
        t.subscriptionStatus === 'pending' || t.subscriptionStatus === 'overdue'
      ).length
    };
  }

  /**
   * Bloqueia acesso de uma clínica
   */
  async blockTenant(tenantId: string, reason: string = 'Inadimplência'): Promise<void> {
    await updateDoc(doc(db, 'tenants', tenantId), {
      status: 'suspended',
      suspendedAt: serverTimestamp(),
      suspensionReason: reason
    });
    console.log(`[MasterAdmin] Tenant bloqueado: ${tenantId}`);
  }

  /**
   * Desbloqueia acesso de uma clínica
   */
  async unblockTenant(tenantId: string): Promise<void> {
    await updateDoc(doc(db, 'tenants', tenantId), {
      status: 'active',
      reactivatedAt: serverTimestamp(),
      suspensionReason: null
    });
    console.log(`[MasterAdmin] Tenant desbloqueado: ${tenantId}`);
  }

  /**
   * Envia email de reset de senha para admin da clínica
   */
  async resetAdminPassword(tenantId: string, adminEmail: string): Promise<void> {
    console.log(`[MasterAdmin] Enviando reset de senha para admin do tenant ${tenantId}`);
    await sendPasswordResetEmail(auth, adminEmail);
    console.log(`[MasterAdmin] Email de reset enviado para: ${adminEmail}`);
  }

  /**
   * Obtém admins de uma clínica
   */
  async getTenantAdmins(tenantId: string): Promise<{ id: string; email: string; name: string }[]> {
    const adminsSnapshot = await getDocs(collection(db, `tenants/${tenantId}/admins`));
    return adminsSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      name: doc.data().name
    }));
  }

  /**
   * Gera PIX para uma fatura
   */
  async generatePixForInvoice(tenantId: string, invoiceId: string): Promise<string> {
    const invoiceDoc = await getDoc(doc(db, `tenants/${tenantId}/invoices`, invoiceId));
    if (!invoiceDoc.exists()) {
      throw new Error('Fatura não encontrada');
    }
    
    const invoice = invoiceDoc.data() as Invoice;
    const paymentLink = await this.paymentService.generatePixForInvoice(
      tenantId,
      invoiceId,
      invoice.totalAmount,
      `AgendAí - Fatura ${invoice.referenceMonth}`
    );
    
    // Atualiza a fatura com o link do PIX
    await updateDoc(doc(db, `tenants/${tenantId}/invoices`, invoiceId), {
      paymentLink: paymentLink.code,
      paymentLinkType: 'pix',
      updatedAt: serverTimestamp()
    });
    
    return paymentLink.code || '';
  }

  /**
   * Gera boleto para uma fatura
   */
  async generateBoletoForInvoice(
    tenantId: string, 
    invoiceId: string,
    customer: { name: string; cpfCnpj: string; email: string }
  ): Promise<string> {
    console.log(`[MasterAdmin] Gerando boleto para tenant ${tenantId}`);
    const invoiceDoc = await getDoc(doc(db, `tenants/${tenantId}/invoices`, invoiceId));
    if (!invoiceDoc.exists()) {
      throw new Error('Fatura não encontrada');
    }
    
    const invoice = invoiceDoc.data() as Invoice;
    const paymentLink = await this.paymentService.generateBoletoForInvoice(
      tenantId,
      invoiceId,
      invoice.totalAmount,
      `AgendAí - Fatura ${invoice.referenceMonth}`,
      invoice.dueDate,
      customer
    );
    
    // Atualiza a fatura com o link do boleto
    await updateDoc(doc(db, `tenants/${tenantId}/invoices`, invoiceId), {
      paymentLink: paymentLink.url,
      paymentLinkType: 'boleto',
      paymentBarCode: paymentLink.code,
      updatedAt: serverTimestamp()
    });
    
    return paymentLink.url || '';
  }

  /**
   * Marca fatura como paga (manual)
   */
  async markInvoiceAsPaid(
    tenantId: string, 
    invoiceId: string,
    paymentMethod: string = 'manual'
  ): Promise<void> {
    // Buscar fatura para obter o valor correto
    const invoiceDoc = await getDoc(doc(db, `tenants/${tenantId}/invoices`, invoiceId));
    const invoice = invoiceDoc.data() as Invoice;
    
    const billing = new BillingService(tenantId);
    await billing.processPayment(invoiceId, {
      paymentId: `manual_${Date.now()}`,
      paymentMethod,
      amount: invoice?.totalAmount || 0
    });
  }

  /**
   * Obtém faturas de uma clínica
   */
  async getTenantInvoices(tenantId: string): Promise<Invoice[]> {
    const billing = new BillingService(tenantId);
    return billing.getAllInvoices();
  }

  /**
   * Gera fatura manualmente para uma clínica
   */
  async generateInvoiceForTenant(tenantId: string, referenceMonth?: string): Promise<Invoice> {
    const billing = new BillingService(tenantId);
    return billing.generateInvoice(referenceMonth);
  }

  /**
   * Deleta uma clínica (use com cuidado!)
   */
  async deleteTenant(tenantId: string): Promise<void> {
    // Deletar subcoleções primeiro
    const subcollections = ['professionals', 'patients', 'appointments', 'specialties', 'admins', 'invoices'];
    
    for (const subcol of subcollections) {
      const snapshot = await getDocs(collection(db, `tenants/${tenantId}/${subcol}`));
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
    }
    
    // Deletar tenant
    await deleteDoc(doc(db, 'tenants', tenantId));
    console.log(`[MasterAdmin] Tenant deletado: ${tenantId}`);
  }

  /**
   * Verifica e bloqueia clínicas inadimplentes automaticamente
   */
  async checkAndBlockOverdueTenants(): Promise<{ checked: number; blocked: number }> {
    let checked = 0;
    let blocked = 0;
    const today = new Date();

    const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
    
    for (const tenantDoc of tenantsSnapshot.docs) {
      checked++;
      const tenantData = tenantDoc.data();
      
      // Pular se já está bloqueado
      if (tenantData.status === 'suspended') continue;

      // Verificar faturas vencidas
      const invoicesSnapshot = await getDocs(
        collection(db, `tenants/${tenantDoc.id}/invoices`)
      );

      for (const invDoc of invoicesSnapshot.docs) {
        const inv = invDoc.data() as Invoice;
        
        if (inv.status === 'pending' || inv.status === 'overdue') {
          const dueDate = new Date(inv.dueDate);
          const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Atualizar para overdue se passou do vencimento
          if (inv.status === 'pending' && diffDays > 0) {
            await updateDoc(invDoc.ref, { 
              status: 'overdue',
              updatedAt: serverTimestamp()
            });
          }
          
          // Bloquear se passou do período de tolerância
          if (diffDays >= DAYS_TO_BLOCK) {
            await this.blockTenant(tenantDoc.id, `Fatura ${inv.referenceMonth} vencida há ${diffDays} dias`);
            blocked++;
            break; // Não precisa verificar outras faturas
          }
        }
      }
    }

    console.log(`[MasterAdmin] Verificação de inadimplentes: ${checked} verificados, ${blocked} bloqueados`);
    return { checked, blocked };
  }
}

/**
 * Script de fechamento mensal
 * Deve ser executado no dia 01 de cada mês
 */
export async function runMonthlyBillingClosure(): Promise<{
  tenantsProcessed: number;
  invoicesGenerated: number;
  totalAmount: number;
  errors: string[];
}> {
  console.log('[Cron] Iniciando fechamento mensal...');
  
  const results = {
    tenantsProcessed: 0,
    invoicesGenerated: 0,
    totalAmount: 0,
    errors: [] as string[]
  };

  try {
    const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
    
    for (const tenantDoc of tenantsSnapshot.docs) {
      results.tenantsProcessed++;
      
      try {
        const billing = new BillingService(tenantDoc.id);
        const invoice = await billing.generateInvoice();
        
        results.invoicesGenerated++;
        results.totalAmount += invoice.totalAmount;
        
        console.log(`[Cron] Fatura gerada para ${tenantDoc.id}: R$ ${invoice.totalAmount}`);
      } catch (error) {
        const errorMsg = `Erro ao gerar fatura para ${tenantDoc.id}: ${error}`;
        results.errors.push(errorMsg);
        console.error(`[Cron] ${errorMsg}`);
      }
    }

    // Verificar e bloquear inadimplentes
    const masterService = new MasterAdminService();
    await masterService.checkAndBlockOverdueTenants();

  } catch (error) {
    console.error('[Cron] Erro no fechamento mensal:', error);
  }

  console.log(`[Cron] Fechamento concluído: ${results.invoicesGenerated} faturas, R$ ${results.totalAmount.toFixed(2)}`);
  return results;
}

export default MasterAdminService;
