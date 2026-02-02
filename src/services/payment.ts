import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { PaymentLink, PaymentProvider } from '../types';

/**
 * Mock do provedor de pagamento para desenvolvimento
 * Substitua por Asaas, Mercado Pago, Efí, etc. em produção
 */
class MockPaymentProvider implements PaymentProvider {
  async generatePix(amount: number, _description: string, _expirationMinutes: number = 30): Promise<{
    code: string;
    qrCodeBase64?: string;
    transactionId: string;
  }> {
    // Gera um código PIX fake para teste
    const transactionId = `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pixCode = `00020126580014BR.GOV.BCB.PIX0136${transactionId}5204000053039865404${amount.toFixed(2)}5802BR5913AGENDAI SAAS6008BRASILIA62070503***6304`;
    
    return {
      code: pixCode,
      qrCodeBase64: undefined, // Em produção, gerar QR Code real
      transactionId
    };
  }

  async generateBoleto(amount: number, _description: string, _dueDate: string, _customer: {
    name: string;
    cpfCnpj: string;
    email: string;
  }): Promise<{
    url: string;
    barCode: string;
    transactionId: string;
  }> {
    const transactionId = `boleto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const barCode = `23793.38128 60000.000003 00000.000400 1 ${amount.toFixed(2).replace('.', '')}`;
    
    return {
      url: `https://pagamento.agendai.com/boleto/${transactionId}`,
      barCode,
      transactionId
    };
  }

  async checkPaymentStatus(_transactionId: string): Promise<{
    status: 'pending' | 'paid' | 'expired' | 'cancelled';
    paidAt?: string;
  }> {
    // Em produção, consultar API do provedor
    return { status: 'pending' };
  }
}

/**
 * Serviço de Pagamentos do AgendAí
 * Gerencia geração de PIX, boletos e verificação de pagamentos
 */
export class PaymentService {
  private provider: PaymentProvider;

  constructor(provider?: PaymentProvider) {
    // Usa mock por padrão, substitua pelo provedor real em produção
    this.provider = provider || new MockPaymentProvider();
  }

  /**
   * Gera link de pagamento PIX para uma fatura
   */
  async generatePixForInvoice(
    tenantId: string,
    invoiceId: string,
    amount: number,
    description: string
  ): Promise<PaymentLink> {
    const expirationMinutes = 60 * 24; // 24 horas
    const pix = await this.provider.generatePix(amount, description, expirationMinutes);
    
    const paymentLink: PaymentLink = {
      id: `${invoiceId}_pix`,
      invoiceId,
      tenantId,
      type: 'pix',
      code: pix.code,
      qrCodeBase64: pix.qrCodeBase64,
      expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString(),
      amount,
      status: 'active',
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'paymentLinks', paymentLink.id), paymentLink);
    
    return paymentLink;
  }

  /**
   * Gera boleto para uma fatura
   */
  async generateBoletoForInvoice(
    tenantId: string,
    invoiceId: string,
    amount: number,
    description: string,
    dueDate: string,
    customer: { name: string; cpfCnpj: string; email: string }
  ): Promise<PaymentLink> {
    const boleto = await this.provider.generateBoleto(amount, description, dueDate, customer);
    
    const paymentLink: PaymentLink = {
      id: `${invoiceId}_boleto`,
      invoiceId,
      tenantId,
      type: 'boleto',
      code: boleto.barCode,
      url: boleto.url,
      expiresAt: dueDate,
      amount,
      status: 'active',
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'paymentLinks', paymentLink.id), paymentLink);
    
    return paymentLink;
  }

  /**
   * Obtém links de pagamento de uma fatura
   */
  async getPaymentLinksForInvoice(invoiceId: string): Promise<PaymentLink[]> {
    const q = query(collection(db, 'paymentLinks'), where('invoiceId', '==', invoiceId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentLink));
  }

  /**
   * Atualiza status do link de pagamento
   */
  async updatePaymentLinkStatus(linkId: string, status: PaymentLink['status']): Promise<void> {
    await updateDoc(doc(db, 'paymentLinks', linkId), {
      status,
      updatedAt: serverTimestamp()
    });
  }
}

export default PaymentService;
