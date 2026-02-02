/**
 * Modal de Detalhes do Agendamento
 * Exibe informações do paciente, anamnese e ações disponíveis
 */

import { useEffect, useState } from 'react';
import { X, User, Phone, Mail, Calendar, Clock, FileText, ClipboardList, CheckCircle, Video, AlertCircle, Stethoscope } from 'lucide-react';
import { AnamnesisService } from '../services/anamnesis';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    patientId: string;
    patientName: string;
    patientPhone?: string;
    patientEmail?: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: string;
    professionalId?: string;
  };
  tenantId: string;
  onTeleconsulta?: () => void;
  onConfirm?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  onNoShow?: () => void;
  onViewProntuario?: () => void;
}

interface AnamnesisResponse {
  questionId: string;
  questionLabel: string;
  questionType: 'text' | 'boolean' | 'number' | 'select';
  answer: string | boolean | number;
  required: boolean;
}

export function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  tenantId,
  onTeleconsulta,
  onConfirm,
  onComplete,
  onCancel,
  onNoShow,
  onViewProntuario
}: AppointmentDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [anamnesisResponses, setAnamnesisResponses] = useState<Record<string, AnamnesisResponse>>({});
  const [hasAnamnesis, setHasAnamnesis] = useState(false);

  useEffect(() => {
    if (isOpen && appointment) {
      loadData();
    }
  }, [isOpen, appointment]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar dados do paciente
      const patientDoc = await getDoc(doc(db, `tenants/${tenantId}/patients`, appointment.patientId));
      if (patientDoc.exists()) {
        setPatient({ id: patientDoc.id, ...patientDoc.data() });
      }

      // Carregar anamnese
      const anamnesisService = new AnamnesisService(tenantId);
      const responses = await anamnesisService.getResponses(appointment.id);
      
      if (responses && Object.keys(responses).length > 0) {
        setAnamnesisResponses(responses);
        setHasAnamnesis(true);
      } else {
        setAnamnesisResponses({});
        setHasAnamnesis(false);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-300';
      case 'no_show': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'no_show': return 'Não Compareceu';
      default: return status;
    }
  };

  const formatAnswer = (response: AnamnesisResponse) => {
    if (response.questionType === 'boolean') {
      return response.answer === true || response.answer === 'true' ? 'Sim' : 'Não';
    }
    return String(response.answer);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T12:00:00');
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-6 h-6" />
            <h2 className="text-xl font-bold">Detalhes da Consulta</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(appointment.status)}`}>
                  {getStatusLabel(appointment.status)}
                </span>
                {appointment.status === 'scheduled' && (
                  <span className="text-sm text-yellow-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Aguardando confirmação
                  </span>
                )}
              </div>

              {/* Data e Hora */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Data e Horário
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Data</p>
                    <p className="font-medium capitalize">{formatDate(appointment.appointmentDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Horário</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {appointment.startTime} - {appointment.endTime}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dados do Paciente */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Dados do Paciente
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nome</p>
                    <p className="font-medium text-lg">{appointment.patientName || patient?.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(patient?.cpf) && (
                      <div>
                        <p className="text-sm text-gray-500">CPF</p>
                        <p className="font-medium">{patient.cpf}</p>
                      </div>
                    )}
                    {(patient?.birthDate) && (
                      <div>
                        <p className="text-sm text-gray-500">Data de Nascimento</p>
                        <p className="font-medium">{patient.birthDate}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(appointment.patientPhone || patient?.phone) && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{appointment.patientPhone || patient?.phone}</span>
                      </div>
                    )}
                    {(appointment.patientEmail || patient?.email) && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{appointment.patientEmail || patient?.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Anamnese */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                  Anamnese / Triagem
                </h3>
                
                {hasAnamnesis ? (
                  <div className="space-y-4">
                    {Object.values(anamnesisResponses).map((response, index) => (
                      <div 
                        key={response.questionId || index} 
                        className="bg-white rounded-lg p-4 border border-blue-100"
                      >
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {response.questionLabel}
                          {response.required && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        <p className={`text-base ${
                          response.questionType === 'boolean' 
                            ? (response.answer === true || response.answer === 'true' 
                                ? 'text-green-600 font-medium' 
                                : 'text-red-600 font-medium')
                            : 'text-gray-800'
                        }`}>
                          {formatAnswer(response)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/50 rounded-lg p-6 text-center">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">
                      Nenhuma anamnese foi preenchida para esta consulta.
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      A especialidade pode não exigir triagem prévia.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer com Ações */}
        <div className="border-t px-6 py-4 bg-gray-50">
          {appointment.status === 'completed' ? (
            <div className="flex gap-3">
              {onViewProntuario && (
                <button
                  onClick={onViewProntuario}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Ver Prontuário
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Fechar
              </button>
            </div>
          ) : appointment.status === 'cancelled' || appointment.status === 'no_show' ? (
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Fechar
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                {onTeleconsulta && (
                  <button
                    onClick={onTeleconsulta}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-semibold flex items-center justify-center gap-2"
                  >
                    <Video className="w-5 h-5" />
                    Iniciar Teleconsulta
                  </button>
                )}
                {appointment.status === 'scheduled' && onConfirm && (
                  <button
                    onClick={onConfirm}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Confirmar
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {onComplete && (
                  <button
                    onClick={onComplete}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
                  >
                    Concluir Consulta
                  </button>
                )}
                {onNoShow && (
                  <button
                    onClick={onNoShow}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 font-medium"
                  >
                    Paciente Faltou
                  </button>
                )}
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg hover:bg-red-200 font-medium"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppointmentDetailsModal;
