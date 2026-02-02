/**
 * Serviço de Anamnese Dinâmica
 * Gerencia perguntas de triagem por especialidade e respostas dos pacientes
 */

import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { AnamnesisQuestion } from '../types';

export class AnamnesisService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  // ==================== GESTÃO DE PERGUNTAS (ADMIN) ====================

  /**
   * Busca todas as perguntas de uma especialidade
   */
  async getQuestionsBySpecialty(specialtyId: string): Promise<AnamnesisQuestion[]> {
    try {
      const questionsRef = collection(db, `tenants/${this.tenantId}/anamnesisQuestions`);
      const q = query(questionsRef, where('specialtyId', '==', specialtyId));
      const snapshot = await getDocs(q);
      
      const questions = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as AnamnesisQuestion))
        .filter(q => q.isActive !== false)
        .sort((a, b) => a.order - b.order);
      
      console.log(`[Anamnesis] ${questions.length} perguntas encontradas para especialidade ${specialtyId}`);
      return questions;
    } catch (error) {
      console.error('[Anamnesis] Erro ao buscar perguntas:', error);
      throw error;
    }
  }

  /**
   * Adiciona uma nova pergunta à especialidade
   */
  async addQuestion(question: Omit<AnamnesisQuestion, 'id' | 'createdAt'>): Promise<string> {
    try {
      // Buscar última ordem
      const questions = await this.getQuestionsBySpecialty(question.specialtyId);
      const maxOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order)) : 0;

      const docRef = await addDoc(collection(db, `tenants/${this.tenantId}/anamnesisQuestions`), {
        ...question,
        order: question.order || maxOrder + 1,
        isActive: true,
        createdAt: serverTimestamp()
      });

      console.log('[Anamnesis] Pergunta criada:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[Anamnesis] Erro ao criar pergunta:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma pergunta existente
   */
  async updateQuestion(questionId: string, updates: Partial<AnamnesisQuestion>): Promise<void> {
    try {
      const { id, createdAt, ...updateData } = updates as any;
      await updateDoc(doc(db, `tenants/${this.tenantId}/anamnesisQuestions`, questionId), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      console.log('[Anamnesis] Pergunta atualizada:', questionId);
    } catch (error) {
      console.error('[Anamnesis] Erro ao atualizar pergunta:', error);
      throw error;
    }
  }

  /**
   * Remove uma pergunta (soft delete)
   */
  async deleteQuestion(questionId: string): Promise<void> {
    try {
      await updateDoc(doc(db, `tenants/${this.tenantId}/anamnesisQuestions`, questionId), {
        isActive: false,
        deletedAt: serverTimestamp()
      });
      console.log('[Anamnesis] Pergunta desativada:', questionId);
    } catch (error) {
      console.error('[Anamnesis] Erro ao desativar pergunta:', error);
      throw error;
    }
  }

  /**
   * Remove permanentemente uma pergunta
   */
  async deleteQuestionPermanently(questionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, `tenants/${this.tenantId}/anamnesisQuestions`, questionId));
      console.log('[Anamnesis] Pergunta excluída permanentemente:', questionId);
    } catch (error) {
      console.error('[Anamnesis] Erro ao excluir pergunta:', error);
      throw error;
    }
  }

  /**
   * Reordena as perguntas
   */
  async reorderQuestions(questionIds: string[]): Promise<void> {
    try {
      const batch: Promise<void>[] = [];
      
      questionIds.forEach((id, index) => {
        batch.push(
          updateDoc(doc(db, `tenants/${this.tenantId}/anamnesisQuestions`, id), {
            order: index + 1
          })
        );
      });

      await Promise.all(batch);
      console.log('[Anamnesis] Perguntas reordenadas');
    } catch (error) {
      console.error('[Anamnesis] Erro ao reordenar perguntas:', error);
      throw error;
    }
  }

  // ==================== GESTÃO DE RESPOSTAS (PACIENTE) ====================

  /**
   * Salva as respostas do paciente
   */
  async saveResponses(
    appointmentId: string,
    patientId: string,
    specialtyId: string,
    responses: Record<string, string | boolean | number>,
    questions: AnamnesisQuestion[]
  ): Promise<void> {
    try {
      // Criar um documento com todas as respostas
      const responsesRef = doc(db, `tenants/${this.tenantId}/anamnesisResponses`, appointmentId);
      
      // Mapear respostas com labels das perguntas
      const formattedResponses: Record<string, any> = {};
      
      for (const [questionId, answer] of Object.entries(responses)) {
        const question = questions.find(q => q.id === questionId);
        if (question) {
          formattedResponses[questionId] = {
            questionId,
            questionLabel: question.label,
            questionType: question.type,
            answer,
            required: question.required
          };
        }
      }

      await setDoc(responsesRef, {
        tenantId: this.tenantId,
        appointmentId,
        patientId,
        specialtyId,
        responses: formattedResponses,
        createdAt: serverTimestamp()
      });

      console.log('[Anamnesis] Respostas salvas para agendamento:', appointmentId);
    } catch (error) {
      console.error('[Anamnesis] Erro ao salvar respostas:', error);
      throw error;
    }
  }

  /**
   * Busca as respostas de um agendamento
   */
  async getResponses(appointmentId: string): Promise<Record<string, any> | null> {
    try {
      const docRef = doc(db, `tenants/${this.tenantId}/anamnesisResponses`, appointmentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('[Anamnesis] Respostas encontradas para agendamento:', appointmentId);
        return data.responses || {};
      }

      console.log('[Anamnesis] Nenhuma resposta encontrada para agendamento:', appointmentId);
      return null;
    } catch (error) {
      console.error('[Anamnesis] Erro ao buscar respostas:', error);
      throw error;
    }
  }

  /**
   * Verifica se uma especialidade requer anamnese
   */
  async checkIfRequiresAnamnesis(specialtyId: string): Promise<boolean> {
    try {
      const specDoc = await getDoc(doc(db, `tenants/${this.tenantId}/specialties`, specialtyId));
      
      if (specDoc.exists()) {
        const data = specDoc.data();
        return data.requiresAnamnesis === true;
      }
      
      return false;
    } catch (error) {
      console.error('[Anamnesis] Erro ao verificar especialidade:', error);
      return false;
    }
  }

  /**
   * Ativa/desativa anamnese para uma especialidade
   */
  async toggleAnamnesisForSpecialty(specialtyId: string, requires: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, `tenants/${this.tenantId}/specialties`, specialtyId), {
        requiresAnamnesis: requires
      });
      console.log(`[Anamnesis] Anamnese ${requires ? 'ativada' : 'desativada'} para especialidade:`, specialtyId);
    } catch (error) {
      console.error('[Anamnesis] Erro ao atualizar especialidade:', error);
      throw error;
    }
  }

  // ==================== VALIDAÇÃO ====================

  /**
   * Valida se todas as perguntas obrigatórias foram respondidas
   */
  validateResponses(
    questions: AnamnesisQuestion[],
    responses: Record<string, string | boolean | number>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const question of questions) {
      if (question.required) {
        const answer = responses[question.id];
        
        if (answer === undefined || answer === null || answer === '') {
          errors.push(`A pergunta "${question.label}" é obrigatória.`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default AnamnesisService;
