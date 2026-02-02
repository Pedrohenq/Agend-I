/**
 * Componente Form Builder de Anamnese
 * Permite ao admin criar e gerenciar perguntas de triagem por especialidade
 */

import { useState, useEffect } from 'react';
import { 
  Plus, Trash2, GripVertical, Save, ArrowLeft, 
  Type, AlignLeft, ToggleLeft, List, Hash,
  HelpCircle, ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import { AnamnesisQuestion } from '../types';
import { AnamnesisService } from '../services/anamnesis';

interface Props {
  tenantId: string;
  specialtyId: string;
  specialtyName: string;
  onBack: () => void;
}

const questionTypes = [
  { value: 'text', label: 'Texto Curto', icon: Type },
  { value: 'textarea', label: 'Texto Longo', icon: AlignLeft },
  { value: 'boolean', label: 'Sim/Não', icon: ToggleLeft },
  { value: 'select', label: 'Múltipla Escolha', icon: List },
  { value: 'number', label: 'Numérico', icon: Hash }
];

export function AnamnesisFormBuilder({ tenantId, specialtyId, specialtyName, onBack }: Props) {
  const [questions, setQuestions] = useState<AnamnesisQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<AnamnesisQuestion>>({
    label: '',
    type: 'text',
    required: true,
    placeholder: '',
    helpText: '',
    options: []
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [optionInput, setOptionInput] = useState('');

  const service = new AnamnesisService(tenantId);

  useEffect(() => {
    loadQuestions();
  }, [specialtyId]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await service.getQuestionsBySpecialty(specialtyId);
      setQuestions(data);
    } catch (error) {
      console.error('Erro ao carregar perguntas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.label?.trim()) return;

    setSaving(true);
    try {
      await service.addQuestion({
        specialtyId,
        label: newQuestion.label,
        type: newQuestion.type as any || 'text',
        required: newQuestion.required ?? true,
        order: questions.length + 1,
        placeholder: newQuestion.placeholder,
        helpText: newQuestion.helpText,
        options: newQuestion.options,
        isActive: true
      });

      setNewQuestion({
        label: '',
        type: 'text',
        required: true,
        placeholder: '',
        helpText: '',
        options: []
      });
      setShowAddForm(false);
      loadQuestions();
    } catch (error) {
      console.error('Erro ao adicionar pergunta:', error);
      alert('Erro ao adicionar pergunta');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuestion = async (question: AnamnesisQuestion) => {
    setSaving(true);
    try {
      await service.updateQuestion(question.id, question);
      setEditingQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error('Erro ao atualizar pergunta:', error);
      alert('Erro ao atualizar pergunta');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Deseja realmente excluir esta pergunta?')) return;

    try {
      await service.deleteQuestionPermanently(questionId);
      loadQuestions();
    } catch (error) {
      console.error('Erro ao excluir pergunta:', error);
      alert('Erro ao excluir pergunta');
    }
  };

  const moveQuestion = async (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    setQuestions(newQuestions);

    // Salvar nova ordem
    try {
      await service.reorderQuestions(newQuestions.map(q => q.id));
    } catch (error) {
      console.error('Erro ao reordenar:', error);
      loadQuestions(); // Recarregar em caso de erro
    }
  };

  const addOption = () => {
    if (!optionInput.trim()) return;
    setNewQuestion({
      ...newQuestion,
      options: [...(newQuestion.options || []), optionInput.trim()]
    });
    setOptionInput('');
  };

  const removeOption = (index: number) => {
    setNewQuestion({
      ...newQuestion,
      options: (newQuestion.options || []).filter((_, i) => i !== index)
    });
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = questionTypes.find(t => t.value === type);
    return typeInfo ? typeInfo.icon : Type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Anamnese: {specialtyName}
            </h2>
            <p className="text-gray-600">
              Configure as perguntas de triagem para esta especialidade
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Ocultar' : 'Visualizar'}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nova Pergunta
          </button>
        </div>
      </div>

      {/* Formulário de nova pergunta */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Adicionar Pergunta</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Texto da Pergunta *</label>
              <input
                type="text"
                value={newQuestion.label || ''}
                onChange={(e) => setNewQuestion({ ...newQuestion, label: e.target.value })}
                placeholder="Ex: Você possui alguma alergia a medicamentos?"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Resposta</label>
              <select
                value={newQuestion.type || 'text'}
                onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {questionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newQuestion.required ?? true}
                  onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Resposta Obrigatória</span>
              </label>
            </div>

            {newQuestion.type === 'select' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Opções de Resposta</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addOption()}
                    placeholder="Digite uma opção e pressione Enter"
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addOption}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(newQuestion.options || []).map((opt, idx) => (
                    <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-white border rounded-full text-sm">
                      {opt}
                      <button onClick={() => removeOption(idx)} className="text-red-500 hover:text-red-700">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Placeholder (opcional)</label>
              <input
                type="text"
                value={newQuestion.placeholder || ''}
                onChange={(e) => setNewQuestion({ ...newQuestion, placeholder: e.target.value })}
                placeholder="Texto que aparece no campo vazio"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Texto de Ajuda (opcional)</label>
              <input
                type="text"
                value={newQuestion.helpText || ''}
                onChange={(e) => setNewQuestion({ ...newQuestion, helpText: e.target.value })}
                placeholder="Instrução adicional para o paciente"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddQuestion}
              disabled={saving || !newQuestion.label?.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Pergunta'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de perguntas */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhuma pergunta cadastrada
            </h3>
            <p className="text-gray-500 mb-4">
              Adicione perguntas de triagem para esta especialidade
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Adicionar Primeira Pergunta
            </button>
          </div>
        ) : (
          questions.map((question, index) => {
            const TypeIcon = getTypeIcon(question.type);
            const isEditing = editingQuestion === question.id;

            return (
              <div
                key={question.id}
                className={`bg-white border rounded-xl p-4 ${isEditing ? 'border-blue-500 shadow-lg' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Handle de reordenação */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button
                      onClick={() => moveQuestion(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <button
                      onClick={() => moveQuestion(index, 'down')}
                      disabled={index === questions.length - 1}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Número da pergunta */}
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={question.label}
                          onChange={(e) => {
                            const updated = questions.map(q => 
                              q.id === question.id ? { ...q, label: e.target.value } : q
                            );
                            setQuestions(updated);
                          }}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                        <div className="flex gap-4">
                          <select
                            value={question.type}
                            onChange={(e) => {
                              const updated = questions.map(q => 
                                q.id === question.id ? { ...q, type: e.target.value as any } : q
                              );
                              setQuestions(updated);
                            }}
                            className="px-3 py-2 border rounded-lg"
                          >
                            {questionTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={question.required}
                              onChange={(e) => {
                                const updated = questions.map(q => 
                                  q.id === question.id ? { ...q, required: e.target.checked } : q
                                );
                                setQuestions(updated);
                              }}
                              className="w-4 h-4"
                            />
                            Obrigatória
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingQuestion(null)}
                            className="px-3 py-1 border rounded-lg text-sm"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleUpdateQuestion(question)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-gray-900">{question.label}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <TypeIcon className="w-4 h-4" />
                            {questionTypes.find(t => t.value === question.type)?.label}
                          </span>
                          {question.required && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                              Obrigatória
                            </span>
                          )}
                          {question.helpText && (
                            <span className="text-gray-400">• {question.helpText}</span>
                          )}
                        </div>
                        {question.type === 'select' && question.options && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {question.options.map((opt, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Ações */}
                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingQuestion(question.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Preview do formulário */}
      {showPreview && questions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Pré-visualização do Formulário
          </h3>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 border">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-xl mx-auto">
              <h4 className="text-lg font-semibold text-center mb-4">
                Anamnese - {specialtyName}
              </h4>
              <p className="text-sm text-gray-600 text-center mb-6">
                Para prosseguir com sua consulta, precisamos que responda as perguntas abaixo.
              </p>
              
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="space-y-1">
                    <label className="block text-sm font-medium">
                      {idx + 1}. {q.label}
                      {q.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {q.helpText && (
                      <p className="text-xs text-gray-500">{q.helpText}</p>
                    )}
                    {q.type === 'text' && (
                      <input
                        type="text"
                        placeholder={q.placeholder || 'Digite sua resposta'}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        disabled
                      />
                    )}
                    {q.type === 'textarea' && (
                      <textarea
                        placeholder={q.placeholder || 'Digite sua resposta'}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        rows={3}
                        disabled
                      />
                    )}
                    {q.type === 'boolean' && (
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" name={`preview-${q.id}`} disabled />
                          <span className="text-sm">Sim</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name={`preview-${q.id}`} disabled />
                          <span className="text-sm">Não</span>
                        </label>
                      </div>
                    )}
                    {q.type === 'select' && (
                      <select className="w-full px-3 py-2 border rounded-lg text-sm" disabled>
                        <option>Selecione uma opção</option>
                        {(q.options || []).map((opt, i) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {q.type === 'number' && (
                      <input
                        type="number"
                        placeholder={q.placeholder || '0'}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        disabled
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                className="w-full mt-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                disabled
              >
                Confirmar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnamnesisFormBuilder;
