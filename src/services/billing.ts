import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Invoice, BillingConfig } from '../types';

// Configuração padrão de cobrança
const DEFAULT_BILLING_CONFIG: BillingConfig = {
  pricePerProfessional: 39.90,
  currency: 'BRL',
  dueDayOfMonth: 10,
  gracePeriodDays: 5
};

/**
 * Serviço de Faturamento do AgendAí
 * Gerencia cobranças baseadas no número de profissionais ativos
 */
export class BillingService {
  private tenantId: string;
  private config: BillingConfig;

  constructor(tenantId: string, config?: Partial<BillingConfig>) {
    this.tenantId = tenantId;
    this.config = { ...DEFAULT_BILLING_CONFIG, ...config };
  }

  /**
   * Conta o número de profissionais ativos no tenant
   */
  async countActiveProfessionals(): Promise<number> {
    try {
      const professionalsRef = collection(db, `tenants/${this.tenantId}/professionals`);
      const snapshot = await getDocs(professionalsRef);
      
      let activeCount = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.isActive === true) {
          activeCount++;
        }
      });
      
      return activeCount;
    } catch (error) {
      console.error('[Billing] Erro ao contar profissionais:', error);
      throw error;
    }
  }

  /**
   * Obtém lista de profissionais ativos com detalhes
   */
  async getActiveProfessionals(): Promise<{ id: string; name: string; email: string; createdAt: any }[]> {
    try {
      const professionalsRef = collection(db, `tenants/${this.tenantId}/professionals`);
      const snapshot = await getDocs(professionalsRef);
      
      const professionals: { id: string; name: string; email: string; createdAt: any }[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.isActive === true) {
          professionals.push({
            id: doc.id,
            name: data.name,
            email: data.email,
            createdAt: data.createdAt
          });
        }
      });
      
      return professionals;
    } catch (error) {
      console.error('[Billing] Erro ao listar profissionais:', error);
      throw error;
    }
  }

  /**
   * Calcula o valor total da mensalidade atual
   */
  async calculateCurrentBill(): Promise<{
    professionalsCount: number;
    pricePerProfessional: number;
    totalAmount: number;
    currency: string;
  }> {
    const count = await this.countActiveProfessionals();
    const total = count * this.config.pricePerProfessional;
    
    return {
      professionalsCount: count,
      pricePerProfessional: this.config.pricePerProfessional,
      totalAmount: Math.round(total * 100) / 100, // Arredonda para 2 casas decimais
      currency: this.config.currency
    };
  }

  /**
   * Gera uma nova fatura para o mês de referência
   */
  async generateInvoice(referenceMonth?: string): Promise<Invoice> {
    const month = referenceMonth || this.getCurrentReferenceMonth();
    
    // Verifica se já existe fatura para este mês
    const existingInvoice = await this.getInvoiceByMonth(month);
    if (existingInvoice) {
      console.log('[Billing] Fatura já existe para', month);
      return existingInvoice;
    }
    
    const bill = await this.calculateCurrentBill();
    const dueDate = this.calculateDueDate(month);
    
    const invoiceId = `${this.tenantId}_${month}`;
    const invoice: Invoice = {
      id: invoiceId,
      tenantId: this.tenantId,
      referenceMonth: month,
      professionalsCount: bill.professionalsCount,
      pricePerProfessional: bill.pricePerProfessional,
      totalAmount: bill.totalAmount,
      status: 'pending',
      dueDate: dueDate,
      createdAt: serverTimestamp()
    };
    
    await setDoc(doc(db, `tenants/${this.tenantId}/invoices`, invoiceId), invoice);
    console.log('[Billing] Fatura gerada:', invoiceId);
    
    return invoice;
  }

  /**
   * Obtém fatura por mês de referência
   */
  async getInvoiceByMonth(referenceMonth: string): Promise<Invoice | null> {
    const invoiceId = `${this.tenantId}_${referenceMonth}`;
    const invoiceDoc = await getDoc(doc(db, `tenants/${this.tenantId}/invoices`, invoiceId));
    
    if (invoiceDoc.exists()) {
      return { id: invoiceDoc.id, ...invoiceDoc.data() } as Invoice;
    }
    return null;
  }

  /**
   * Obtém todas as faturas do tenant
   */
  async getAllInvoices(): Promise<Invoice[]> {
    try {
      const invoicesRef = collection(db, `tenants/${this.tenantId}/invoices`);
      const snapshot = await getDocs(invoicesRef);
      
      const invoices: Invoice[] = [];
      snapshot.forEach(doc => {
        invoices.push({ id: doc.id, ...doc.data() } as Invoice);
      });
      
      // Ordena por mês de referência (mais recente primeiro)
      invoices.sort((a, b) => b.referenceMonth.localeCompare(a.referenceMonth));
      
      return invoices;
    } catch (error) {
      console.error('[Billing] Erro ao listar faturas:', error);
      throw error;
    }
  }

  /**
   * Atualiza status de faturas vencidas
   */
  async updateOverdueInvoices(): Promise<number> {
    const invoices = await this.getAllInvoices();
    const today = new Date().toISOString().split('T')[0];
    let updatedCount = 0;
    
    for (const invoice of invoices) {
      if (invoice.status === 'pending' && invoice.dueDate < today) {
        await updateDoc(doc(db, `tenants/${this.tenantId}/invoices`, invoice.id), {
          status: 'overdue',
          updatedAt: serverTimestamp()
        });
        updatedCount++;
      }
    }
    
    return updatedCount;
  }

  /**
   * Processa confirmação de pagamento (webhook)
   */
  async processPayment(
    invoiceId: string, 
    paymentData: { 
      paymentId: string; 
      paymentMethod: string; 
      amount: number;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const invoiceDoc = await getDoc(doc(db, `tenants/${this.tenantId}/invoices`, invoiceId));
      
      if (!invoiceDoc.exists()) {
        return { success: false, message: 'Fatura não encontrada' };
      }
      
      const invoice = invoiceDoc.data() as Invoice;
      
      // Valida o valor pago
      if (paymentData.amount < invoice.totalAmount) {
        return { success: false, message: 'Valor pago inferior ao valor da fatura' };
      }
      
      // Atualiza a fatura
      await updateDoc(doc(db, `tenants/${this.tenantId}/invoices`, invoiceId), {
        status: 'paid',
        paidAt: serverTimestamp(),
        paymentId: paymentData.paymentId,
        paymentMethod: paymentData.paymentMethod,
        updatedAt: serverTimestamp()
      });
      
      // Atualiza status do tenant para ativo (caso esteja suspenso)
      await updateDoc(doc(db, 'tenants', this.tenantId), {
        status: 'active'
      });
      
      console.log('[Billing] Pagamento processado:', invoiceId);
      return { success: true, message: 'Pagamento confirmado com sucesso' };
      
    } catch (error) {
      console.error('[Billing] Erro ao processar pagamento:', error);
      return { success: false, message: 'Erro ao processar pagamento' };
    }
  }

  /**
   * Verifica se o tenant está em dia com pagamentos
   */
  async checkPaymentStatus(): Promise<{
    isActive: boolean;
    hasOverdue: boolean;
    overdueAmount: number;
    overdueCount: number;
  }> {
    const invoices = await this.getAllInvoices();
    await this.updateOverdueInvoices();
    
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    // Obtém status do tenant
    const tenantDoc = await getDoc(doc(db, 'tenants', this.tenantId));
    const tenantStatus = tenantDoc.exists() ? tenantDoc.data().status : 'suspended';
    
    return {
      isActive: tenantStatus === 'active',
      hasOverdue: overdueInvoices.length > 0,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      overdueCount: overdueInvoices.length
    };
  }

  /**
   * Suspende tenant por falta de pagamento
   */
  async suspendTenant(reason: string = 'Falta de pagamento'): Promise<void> {
    await updateDoc(doc(db, 'tenants', this.tenantId), {
      status: 'suspended',
      suspendedAt: serverTimestamp(),
      suspensionReason: reason
    });
    console.log('[Billing] Tenant suspenso:', this.tenantId);
  }

  /**
   * Reativa tenant após pagamento
   */
  async reactivateTenant(): Promise<void> {
    await updateDoc(doc(db, 'tenants', this.tenantId), {
      status: 'active',
      reactivatedAt: serverTimestamp()
    });
    console.log('[Billing] Tenant reativado:', this.tenantId);
  }

  // ===== Métodos Auxiliares =====

  private getCurrentReferenceMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private calculateDueDate(referenceMonth: string): string {
    const [year, month] = referenceMonth.split('-').map(Number);
    // Vencimento é no mês seguinte ao mês de referência
    const dueDate = new Date(year, month, this.config.dueDayOfMonth);
    return dueDate.toISOString().split('T')[0];
  }

  /**
   * Formata valor para moeda brasileira
   */
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formata mês de referência para exibição
   */
  static formatReferenceMonth(referenceMonth: string): string {
    const [year, month] = referenceMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  /**
   * Retorna cor do status para UI
   */
  static getStatusColor(status: Invoice['status']): { bg: string; text: string; label: string } {
    switch (status) {
      case 'paid':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Pago' };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' };
      case 'overdue':
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'Atrasado' };
      case 'cancelled':
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelado' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    }
  }
}

// Pagamentos são processados manualmente pelo método processPayment da classe BillingService

/**
 * Gera faturas para todos os tenants ativos
 * Esta função pode ser executada por um cron job mensal
 */
export async function generateMonthlyInvoices(): Promise<{ generated: number; errors: number }> {
  let generated = 0;
  let errors = 0;
  
  try {
    const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
    
    for (const tenantDoc of tenantsSnapshot.docs) {
      try {
        const billing = new BillingService(tenantDoc.id);
        await billing.generateInvoice();
        generated++;
      } catch (error) {
        console.error(`[Billing] Erro ao gerar fatura para ${tenantDoc.id}:`, error);
        errors++;
      }
    }
  } catch (error) {
    console.error('[Billing] Erro ao gerar faturas mensais:', error);
  }
  
  return { generated, errors };
}

export default BillingService;
