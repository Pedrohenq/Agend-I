/**
 * Componente de Formulário de Anamnese para Pacientes
 * Exibido durante o fluxo de agendamento quando a especialidade requer anamnese
 */

import { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { AnamnesisQuestion } from '../types';
import { AnamnesisService } from '../services/anamnesis';

interface Props {
  tenantId: string;
  specialtyId: string;
  specialtyName: string;
  onComplete: (responses: Record<string, string | boolean | number>) => void;
  onCancel: () => void;
}

export function AnamnesisForm({ tenantId, specialtyId, specialtyName, onComplete, onCancel }: Props) {
  const [questions, setQuestions] = useState<AnamnesisQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, string | boolean | number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const service = new AnamnesisService(tenantId);

  useEffect(() => {
    loadQuestions();
  }, [specialtyId]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await service.getQuestionsBySpecialty(specialtyId);
      setQuestions(data);
      
      // Inicializar respostas
      const initialResponses: Record<string, string | boolean | number> = {};
      data.forEach(q => {
        if (q.type === 'boolean') {
          // Não inicializa boolean para forçar escolha
        } else if (q.type === 'number') {
          initialResponses[q.id] = '';
        } else {
          initialResponses[q.id] = '';
        }
      });
      setResponses(initialResponses);
    } catch (error) {
      console.error('Erro ao carregar perguntas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (questionId: string, value: string | boolean | number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    // Limpar erro ao preencher
    if (errors[questionId]) {
      setErrors(prev => {
        const { [questionId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    questions.forEach(q => {
      if (q.required) {
        const answer = responses[q.id];
        if (answer === undefined || answer === null || answer === '') {
          newErrors[q.id] = 'Esta pergunta é obrigatória';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      // Scroll para o primeiro erro
      const firstErrorId = Object.keys(errors)[0];
      const element = document.getElementById(`question-${firstErrorId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    onComplete(responses);
  };

  const getProgress = () => {
    const requiredQuestions = questions.filter(q => q.required);
    const answeredRequired = requiredQuestions.filter(q => {
      const answer = responses[q.id];
      return answer !== undefined && answer !== null && answer !== '';
    });
    return requiredQuestions.length > 0 
      ? Math.round((answeredRequired.length / requiredQuestions.length) * 100)
      : 100;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Carregando formulário de triagem...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    // Se não há perguntas, prosseguir automaticamente
    onComplete({});
    return null;
  }

  const progress = getProgress();
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Anamnese - {specialtyName}
        </h2>
        <p className="text-gray-600">
          Para prosseguir com sua consulta, precisamos que responda as perguntas de triagem abaixo.
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progresso</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              progress === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Mensagem de erro geral */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Por favor, responda todas as perguntas obrigatórias</p>
            <p className="text-sm text-red-600">
              {Object.keys(errors).length} pergunta(s) ainda precisam ser respondidas
            </p>
          </div>
        </div>
      )}

      {/* Formulário */}
      <div className="space-y-6 bg-white rounded-xl border p-6">
        {questions.map((question, index) => (
          <div 
            key={question.id} 
            id={`question-${question.id}`}
            className={`space-y-2 ${errors[question.id] ? 'pb-4 border-l-4 border-red-500 pl-4 -ml-4' : ''}`}
          >
            <label className="block">
              <span className="text-gray-900 font-medium">
                {index + 1}. {question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>

            {question.helpText && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Info className="w-4 h-4" />
                {question.helpText}
              </p>
            )}

            {/* Campo de texto curto */}
            {question.type === 'text' && (
              <input
                type="text"
                value={responses[question.id] as string || ''}
                onChange={(e) => handleChange(question.id, e.target.value)}
                placeholder={question.placeholder || 'Digite sua resposta'}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors[question.id] ? 'border-red-500' : ''
                }`}
              />
            )}

            {/* Campo de texto longo */}
            {question.type === 'textarea' && (
              <textarea
                value={responses[question.id] as string || ''}
                onChange={(e) => handleChange(question.id, e.target.value)}
                placeholder={question.placeholder || 'Digite sua resposta'}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors[question.id] ? 'border-red-500' : ''
                }`}
              />
            )}

            {/* Campo booleano (Sim/Não) */}
            {question.type === 'boolean' && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleChange(question.id, true)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition font-medium ${
                    responses[question.id] === true
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle className={`w-5 h-5 inline mr-2 ${
                    responses[question.id] === true ? 'text-green-500' : 'text-gray-400'
                  }`} />
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => handleChange(question.id, false)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition font-medium ${
                    responses[question.id] === false
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Não
                </button>
              </div>
            )}

            {/* Campo numérico */}
            {question.type === 'number' && (
              <input
                type="number"
                value={responses[question.id] as string || ''}
                onChange={(e) => handleChange(question.id, e.target.value ? Number(e.target.value) : '')}
                placeholder={question.placeholder || '0'}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors[question.id] ? 'border-red-500' : ''
                }`}
              />
            )}

            {/* Campo de seleção */}
            {question.type === 'select' && (
              <select
                value={responses[question.id] as string || ''}
                onChange={(e) => handleChange(question.id, e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors[question.id] ? 'border-red-500' : ''
                }`}
              >
                <option value="">Selecione uma opção</option>
                {(question.options || []).map((opt, idx) => (
                  <option key={idx} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {/* Mensagem de erro */}
            {errors[question.id] && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[question.id]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Botões de ação */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={onCancel}
          className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
        >
          Voltar
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`flex-1 py-3 rounded-lg font-medium transition ${
            progress === 100
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50`}
        >
          {submitting ? 'Processando...' : progress === 100 ? 'Confirmar e Continuar' : 'Continuar'}
        </button>
      </div>

      {/* Aviso de privacidade */}
      <p className="text-xs text-gray-500 text-center mt-4">
        Suas respostas são confidenciais e serão compartilhadas apenas com o profissional de saúde que realizará seu atendimento.
      </p>
    </div>
  );
}

export default AnamnesisForm;
