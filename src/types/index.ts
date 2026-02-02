export interface Tenant {
  id: string;
  subdomain: string;
  companyName: string;
  cnpj: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  plan: 'free' | 'basic' | 'pro';
  status: 'active' | 'suspended';
  createdAt: any;
  settings: {
    consultationDuration: number;
    intervalBetweenConsultations: number;
    minAdvanceHours: number;
    maxAdvanceDays: number;
    maxCancelHours: number;
    businessHoursStart: string;
    businessHoursEnd: string;
    termsOfUse?: string;
    cancellationPolicy?: string;
    whatsappEnabled: boolean;
  };
}

export interface Professional {
  id: string;
  uid: string;
  name: string;
  email: string;
  crm: string;
  crmState: string;
  specialtyId: string;
  photo?: string;
  bio?: string;
  phone: string;
  consultationDuration: number;
  intervalBetweenConsultations: number;
  allowRecurrence: boolean;
  recurrenceIntervalDays?: number;
  recurrenceAutoCount?: number;
  isActive: boolean;
  createdAt: any;
}

export interface Specialty {
  id: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  requiresAnamnesis?: boolean; // Se requer anamnese antes do agendamento
}

// ==================== ANAMNESE DINÂMICA ====================

export interface AnamnesisQuestion {
  id: string;
  specialtyId: string;
  label: string; // Texto da pergunta
  type: 'text' | 'textarea' | 'boolean' | 'select' | 'number';
  required: boolean;
  order: number;
  options?: string[]; // Para tipo 'select'
  placeholder?: string;
  helpText?: string;
  isActive: boolean;
  createdAt: any;
}

export interface AnamnesisResponse {
  id: string;
  tenantId: string;
  appointmentId: string;
  patientId: string;
  specialtyId: string;
  questionId: string;
  questionLabel: string; // Cache para exibição
  questionType: string;
  answer: string | boolean | number;
  createdAt: any;
}

export interface AnamnesisFormData {
  specialtyId: string;
  questions: AnamnesisQuestion[];
  responses: Record<string, string | boolean | number>; // questionId -> answer
}

export interface Patient {
  id: string;
  cpf: string;
  name: string;
  phone: string;
  email: string;
  birthDate?: string;
  createdAt: any;
}

export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  cancellationReason?: string;
  cancelledBy?: 'patient' | 'professional' | 'admin';
  cancelledAt?: any;
  createdAt: any;
}

export interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface AvailabilityException {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isBlocked: boolean;
  reason?: string;
}

// Tipos para o módulo financeiro
export interface Invoice {
  id: string;
  tenantId: string;
  referenceMonth: string; // formato: YYYY-MM
  professionalsCount: number;
  pricePerProfessional: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAt?: any;
  paymentMethod?: string;
  paymentId?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface BillingConfig {
  pricePerProfessional: number;
  currency: string;
  dueDayOfMonth: number;
  gracePeriodDays: number;
}

// ==================== MASTER ADMIN ====================

export interface MasterAdmin {
  id: string;
  uid: string;
  email: string;
  name: string;
  isMasterAdmin: true;
  createdAt: any;
}

export interface TenantWithBilling extends Tenant {
  professionalsCount: number;
  currentMonthAmount: number;
  overdueAmount: number;
  lastPaymentDate?: string;
  subscriptionStatus: 'active' | 'pending' | 'overdue' | 'blocked';
  billingEmail?: string;
  dueDay: number;
}

export interface PaymentLink {
  id: string;
  invoiceId: string;
  tenantId: string;
  type: 'pix' | 'boleto';
  code?: string; // PIX copia e cola
  url?: string; // URL do boleto
  qrCodeBase64?: string;
  expiresAt: string;
  amount: number;
  status: 'active' | 'expired' | 'paid';
  createdAt: any;
}

// Interface genérica para provedores de pagamento
export interface PaymentProvider {
  generatePix(amount: number, description: string, expirationMinutes?: number): Promise<{
    code: string;
    qrCodeBase64?: string;
    transactionId: string;
  }>;
  generateBoleto(amount: number, description: string, dueDate: string, customer: {
    name: string;
    cpfCnpj: string;
    email: string;
  }): Promise<{
    url: string;
    barCode: string;
    transactionId: string;
  }>;
  checkPaymentStatus(transactionId: string): Promise<{
    status: 'pending' | 'paid' | 'expired' | 'cancelled';
    paidAt?: string;
  }>;
}

// Status de assinatura da clínica
export type SubscriptionStatus = 'active' | 'pending' | 'overdue' | 'blocked';

// ==================== PRONTUÁRIO ELETRÔNICO ====================

export interface MedicalRecord {
  id: string;
  tenantId: string;
  appointmentId: string;
  patientId: string;
  professionalId: string;
  
  // Dados do paciente (cache para exibição)
  patientName: string;
  patientCpf: string;
  patientBirthDate?: string;
  patientAge?: number;
  
  // Data da consulta
  consultationDate: string;
  consultationTime: string;
  
  // Campos clínicos
  chiefComplaint: string; // Queixa Principal
  historyOfPresentIllness: string; // História da Doença Atual (HDA)
  physicalExamination: string; // Exame Físico/Observações
  diagnosis: string; // Hipótese Diagnóstica
  treatment: string; // Conduta/Prescrição
  
  // Campos adicionais
  vitalSigns?: {
    bloodPressure?: string; // Pressão Arterial
    heartRate?: number; // Frequência Cardíaca
    temperature?: number; // Temperatura
    respiratoryRate?: number; // Frequência Respiratória
    oxygenSaturation?: number; // Saturação de O2
    weight?: number; // Peso
    height?: number; // Altura
  };
  
  // Metadados
  status: 'draft' | 'in_progress' | 'completed' | 'signed';
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
  signedAt?: any;
  
  // Assinatura digital (futuro)
  signature?: string;
}

export interface MedicalRecordHistory {
  id: string;
  medicalRecordId: string;
  changedBy: string;
  changedAt: any;
  changes: Record<string, { old: any; new: any }>;
}

// Para listagem de atendimentos anteriores
export interface PatientHistory {
  patientId: string;
  patientName: string;
  patientCpf: string;
  records: MedicalRecord[];
}
