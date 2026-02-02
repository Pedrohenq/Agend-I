import { db } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { MedicalRecord } from '../types';

/**
 * Serviço de Prontuário Eletrônico do Paciente (PEP)
 * Gerencia os atendimentos médicos com auto-save e histórico
 */
export class MedicalRecordService {
  private tenantId: string;
  private autoSaveTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly AUTOSAVE_DELAY = 2000; // 2 segundos de debounce

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Cria ou obtém um prontuário para um agendamento
   */
  async getOrCreateRecord(
    appointmentId: string,
    patientId: string,
    professionalId: string
  ): Promise<MedicalRecord> {
    try {
      console.log('[MedicalRecord] Criando/obtendo prontuário:', { appointmentId, patientId, professionalId });
      
      if (!appointmentId || !patientId || !professionalId) {
        throw new Error('Dados incompletos para criar prontuário');
      }

      const recordId = `${appointmentId}`;
      const recordRef = doc(db, `tenants/${this.tenantId}/medicalRecords`, recordId);
      
      const existingRecord = await getDoc(recordRef);
      
      if (existingRecord.exists()) {
        console.log('[MedicalRecord] Prontuário existente encontrado');
        return { id: existingRecord.id, ...existingRecord.data() } as MedicalRecord;
      }

      console.log('[MedicalRecord] Criando novo prontuário...');

      // Buscar dados do paciente
      let patientData: any = null;
      try {
        const patientDoc = await getDoc(doc(db, `tenants/${this.tenantId}/patients`, patientId));
        patientData = patientDoc.exists() ? patientDoc.data() : null;
        console.log('[MedicalRecord] Dados do paciente:', patientData?.name);
      } catch (e) {
        console.warn('[MedicalRecord] Erro ao buscar paciente:', e);
      }

      // Buscar dados do agendamento
      let appointmentData: any = null;
      try {
        const appointmentDoc = await getDoc(doc(db, `tenants/${this.tenantId}/appointments`, appointmentId));
        appointmentData = appointmentDoc.exists() ? appointmentDoc.data() : null;
        console.log('[MedicalRecord] Dados do agendamento:', appointmentData?.appointmentDate);
      } catch (e) {
        console.warn('[MedicalRecord] Erro ao buscar agendamento:', e);
      }

      // Calcular idade
      let patientAge: number | undefined;
      if (patientData?.birthDate) {
        try {
          const birthDate = new Date(patientData.birthDate);
          const today = new Date();
          patientAge = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            patientAge--;
          }
        } catch (e) {
          console.warn('[MedicalRecord] Erro ao calcular idade:', e);
        }
      }

      // Criar novo prontuário
      const newRecord: Omit<MedicalRecord, 'id'> = {
        tenantId: this.tenantId,
        appointmentId,
        patientId,
        professionalId,
        patientName: patientData?.name || 'Paciente',
        patientCpf: patientData?.cpf || '',
        patientBirthDate: patientData?.birthDate,
        patientAge,
        consultationDate: appointmentData?.appointmentDate || new Date().toISOString().split('T')[0],
        consultationTime: appointmentData?.startTime || '',
        chiefComplaint: '',
        historyOfPresentIllness: '',
        physicalExamination: '',
        diagnosis: '',
        treatment: '',
        vitalSigns: {},
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(recordRef, newRecord);
      console.log('[MedicalRecord] Prontuário criado com sucesso');
      
      return { id: recordId, ...newRecord } as MedicalRecord;
    } catch (error) {
      console.error('[MedicalRecord] Erro ao criar/obter prontuário:', error);
      throw error;
    }
  }

  /**
   * Obtém um prontuário pelo ID
   */
  async getRecord(recordId: string): Promise<MedicalRecord | null> {
    const recordRef = doc(db, `tenants/${this.tenantId}/medicalRecords`, recordId);
    const recordDoc = await getDoc(recordRef);
    
    if (!recordDoc.exists()) {
      return null;
    }
    
    return { id: recordDoc.id, ...recordDoc.data() } as MedicalRecord;
  }

  /**
   * Atualiza o prontuário (chamado pelo auto-save)
   */
  async updateRecord(recordId: string, data: Partial<MedicalRecord>): Promise<void> {
    const recordRef = doc(db, `tenants/${this.tenantId}/medicalRecords`, recordId);
    
    // Verificar se o prontuário não está finalizado
    const existingRecord = await getDoc(recordRef);
    if (existingRecord.exists()) {
      const currentData = existingRecord.data();
      if (currentData.status === 'completed' || currentData.status === 'signed') {
        throw new Error('Prontuário já finalizado. Não é possível editar.');
      }
    }

    await updateDoc(recordRef, {
      ...data,
      status: 'in_progress',
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Auto-save com debounce de 2 segundos
   * Só salva após o usuário parar de digitar
   */
  autoSave(recordId: string, data: Partial<MedicalRecord>, onSaved?: () => void): void {
    // Cancelar timeout anterior se existir
    const existingTimeout = this.autoSaveTimeouts.get(recordId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Criar novo timeout
    const timeout = setTimeout(async () => {
      try {
        await this.updateRecord(recordId, data);
        console.log('[MedicalRecord] Auto-save realizado com sucesso');
        if (onSaved) onSaved();
      } catch (error) {
        console.error('[MedicalRecord] Erro no auto-save:', error);
      }
      this.autoSaveTimeouts.delete(recordId);
    }, this.AUTOSAVE_DELAY);

    this.autoSaveTimeouts.set(recordId, timeout);
  }

  /**
   * Cancela todos os auto-saves pendentes
   */
  cancelAllAutoSaves(): void {
    this.autoSaveTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.autoSaveTimeouts.clear();
  }

  /**
   * Finaliza o prontuário (trava edição)
   */
  async completeRecord(recordId: string): Promise<void> {
    const recordRef = doc(db, `tenants/${this.tenantId}/medicalRecords`, recordId);
    
    await updateDoc(recordRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Assina digitalmente o prontuário (futuro - integração com certificado digital)
   */
  async signRecord(recordId: string, signature?: string): Promise<void> {
    const recordRef = doc(db, `tenants/${this.tenantId}/medicalRecords`, recordId);
    
    // Verificar se está completo
    const record = await getDoc(recordRef);
    if (!record.exists()) {
      throw new Error('Prontuário não encontrado');
    }
    
    const data = record.data();
    if (data.status !== 'completed') {
      throw new Error('Prontuário precisa ser finalizado antes de assinar');
    }

    await updateDoc(recordRef, {
      status: 'signed',
      signedAt: serverTimestamp(),
      signature: signature || `Assinado eletronicamente em ${new Date().toLocaleString('pt-BR')}`,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Lista prontuários de um profissional
   */
  async getRecordsByProfessional(professionalId: string): Promise<MedicalRecord[]> {
    try {
      const recordsRef = collection(db, `tenants/${this.tenantId}/medicalRecords`);
      const q = query(
        recordsRef,
        where('professionalId', '==', professionalId)
      );
      
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalRecord));
      
      // Ordenar no cliente para evitar necessidade de índice composto
      return records.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('[MedicalRecord] Erro ao buscar prontuários:', error);
      return [];
    }
  }

  /**
   * Lista prontuários de um paciente (histórico)
   */
  async getPatientHistory(patientId: string): Promise<MedicalRecord[]> {
    try {
      const recordsRef = collection(db, `tenants/${this.tenantId}/medicalRecords`);
      const q = query(
        recordsRef,
        where('patientId', '==', patientId)
      );
      
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalRecord));
      
      // Ordenar no cliente para evitar necessidade de índice composto
      return records.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('[MedicalRecord] Erro ao buscar histórico:', error);
      return [];
    }
  }

  /**
   * Busca prontuário por CPF do paciente
   */
  async getRecordsByPatientCpf(cpf: string): Promise<MedicalRecord[]> {
    // Primeiro, buscar o paciente pelo CPF
    const patientsRef = collection(db, `tenants/${this.tenantId}/patients`);
    const patientQuery = query(patientsRef, where('cpf', '==', cpf));
    const patientSnapshot = await getDocs(patientQuery);
    
    if (patientSnapshot.empty) {
      return [];
    }
    
    const patientId = patientSnapshot.docs[0].id;
    return this.getPatientHistory(patientId);
  }

  /**
   * Obtém estatísticas de atendimentos
   */
  async getStats(professionalId: string): Promise<{
    total: number;
    draft: number;
    inProgress: number;
    completed: number;
    today: number;
  }> {
    const records = await this.getRecordsByProfessional(professionalId);
    const today = new Date().toISOString().split('T')[0];
    
    return {
      total: records.length,
      draft: records.filter(r => r.status === 'draft').length,
      inProgress: records.filter(r => r.status === 'in_progress').length,
      completed: records.filter(r => r.status === 'completed' || r.status === 'signed').length,
      today: records.filter(r => r.consultationDate === today).length
    };
  }
}

// Singleton para fácil acesso
let medicalRecordService: MedicalRecordService | null = null;

export function getMedicalRecordService(tenantId: string): MedicalRecordService {
  if (!medicalRecordService || medicalRecordService['tenantId'] !== tenantId) {
    medicalRecordService = new MedicalRecordService(tenantId);
  }
  return medicalRecordService;
}
