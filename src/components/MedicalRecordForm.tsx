import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Lock,
  Heart,
  Activity,
  Thermometer,
  Wind,
  Scale,
  Ruler,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react';
import { MedicalRecord } from '../types';
import { getMedicalRecordService } from '../services/medicalRecord';

interface MedicalRecordFormProps {
  tenantId: string;
  appointmentId: string;
  patientId: string;
  professionalId: string;
  isCompact?: boolean; // Para modo split-screen
  onRecordLoaded?: (record: MedicalRecord) => void;
  onSaveStatusChange?: (status: 'saving' | 'saved' | 'error') => void;
}

export default function MedicalRecordForm({
  tenantId,
  appointmentId,
  patientId,
  professionalId,
  isCompact = false,
  onRecordLoaded,
  onSaveStatusChange
}: MedicalRecordFormProps) {
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showVitalSigns, setShowVitalSigns] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [patientHistory, setPatientHistory] = useState<MedicalRecord[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const service = getMedicalRecordService(tenantId);

  // Carregar ou criar prontuário
  useEffect(() => {
    loadRecord();
    return () => {
      service.cancelAllAutoSaves();
    };
  }, [appointmentId, patientId, professionalId]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      console.log('[MedicalRecordForm] Carregando prontuário:', { tenantId, appointmentId, patientId, professionalId });
      
      // Validar parâmetros
      if (!tenantId || !appointmentId || !patientId || !professionalId) {
        console.error('[MedicalRecordForm] Parâmetros inválidos:', { tenantId, appointmentId, patientId, professionalId });
        setLoading(false);
        return;
      }

      const loadedRecord = await service.getOrCreateRecord(
        appointmentId,
        patientId,
        professionalId
      );
      
      if (loadedRecord) {
        console.log('[MedicalRecordForm] Prontuário carregado:', loadedRecord.id);
        setRecord(loadedRecord);
        setIsReadOnly(loadedRecord.status === 'completed' || loadedRecord.status === 'signed');
        
        if (onRecordLoaded) {
          onRecordLoaded(loadedRecord);
        }

        // Carregar histórico do paciente (não bloquear se falhar)
        try {
          const history = await service.getPatientHistory(patientId);
          setPatientHistory(history.filter(r => r.id !== loadedRecord.id));
        } catch (historyError) {
          console.warn('[MedicalRecordForm] Erro ao carregar histórico:', historyError);
        }
      }
    } catch (error) {
      console.error('[MedicalRecordForm] Erro ao carregar prontuário:', error);
      setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-save com debounce
  const handleChange = useCallback((field: keyof MedicalRecord, value: any) => {
    if (isReadOnly) return;

    setRecord(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      
      setSaveStatus('saving');
      if (onSaveStatusChange) onSaveStatusChange('saving');

      service.autoSave(prev.id, { [field]: value }, () => {
        setSaveStatus('saved');
        if (onSaveStatusChange) onSaveStatusChange('saved');
        
        // Resetar status após 2 segundos
        setTimeout(() => setSaveStatus('idle'), 2000);
      });

      return updated;
    });
  }, [isReadOnly, service, onSaveStatusChange]);

  // Atualizar sinais vitais
  const handleVitalSignChange = useCallback((field: string, value: any) => {
    if (isReadOnly) return;

    setRecord(prev => {
      if (!prev) return prev;
      const updatedVitalSigns = { ...(prev.vitalSigns || {}), [field]: value };
      const updated = { ...prev, vitalSigns: updatedVitalSigns };
      
      setSaveStatus('saving');
      service.autoSave(prev.id, { vitalSigns: updatedVitalSigns }, () => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      });

      return updated;
    });
  }, [isReadOnly, service]);

  // Finalizar prontuário
  const handleComplete = async () => {
    if (!record) return;
    
    if (!confirm('Deseja finalizar este prontuário? Após finalizado, não será possível editar.')) {
      return;
    }

    try {
      await service.completeRecord(record.id);
      setRecord(prev => prev ? { ...prev, status: 'completed' } : null);
      setIsReadOnly(true);
      alert('Prontuário finalizado com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar:', error);
      alert('Erro ao finalizar prontuário');
    }
  };

  // Formatação de CPF
  const formatCpf = (cpf: string) => {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  if (loading) {
    return (
      <div className={`bg-white ${isCompact ? 'h-full' : 'rounded-lg shadow-lg'} p-6 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando prontuário...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className={`bg-white ${isCompact ? 'h-full' : 'rounded-lg shadow-lg'} p-6`}>
        <div className="text-center text-red-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Erro ao carregar prontuário</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white ${isCompact ? 'h-full overflow-y-auto' : 'rounded-lg shadow-lg'}`}>
      {/* Header com status de salvamento */}
      <div className={`sticky top-0 bg-white z-10 border-b ${isCompact ? 'px-4 py-3' : 'px-6 py-4'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className={`font-bold ${isCompact ? 'text-lg' : 'text-xl'}`}>
              Prontuário Eletrônico
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status de salvamento */}
            {saveStatus === 'saving' && (
              <span className="flex items-center text-yellow-600 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                Salvando...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center text-green-600 text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Salvo
              </span>
            )}
            
            {/* Status do prontuário */}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              record.status === 'draft' ? 'bg-gray-100 text-gray-600' :
              record.status === 'in_progress' ? 'bg-yellow-100 text-yellow-600' :
              record.status === 'completed' ? 'bg-green-100 text-green-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {record.status === 'draft' ? 'Rascunho' :
               record.status === 'in_progress' ? 'Em preenchimento' :
               record.status === 'completed' ? 'Finalizado' : 'Assinado'}
            </span>
          </div>
        </div>

        {isReadOnly && (
          <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-sm">
            <Lock className="w-4 h-4 mr-2" />
            Este prontuário está finalizado e não pode ser editado.
          </div>
        )}
      </div>

      <div className={`${isCompact ? 'px-4 py-3' : 'p-6'} space-y-4`}>
        {/* Cabeçalho do Paciente - ReadOnly */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Paciente</label>
              <div className="flex items-center mt-1">
                <User className="w-4 h-4 text-blue-600 mr-2" />
                <span className="font-semibold text-gray-800">{record.patientName}</span>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">CPF</label>
              <p className="font-mono text-gray-800 mt-1">{formatCpf(record.patientCpf)}</p>
            </div>
            
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Idade</label>
              <p className="text-gray-800 mt-1">
                {record.patientAge ? `${record.patientAge} anos` : 'Não informada'}
              </p>
            </div>
            
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Data da Consulta</label>
              <div className="flex items-center mt-1">
                <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-gray-800">
                  {new Date(record.consultationDate).toLocaleDateString('pt-BR')}
                </span>
                {record.consultationTime && (
                  <>
                    <Clock className="w-4 h-4 text-blue-600 ml-3 mr-2" />
                    <span className="text-gray-800">{record.consultationTime}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Botão para ver histórico */}
          {patientHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="mt-3 flex items-center text-blue-600 hover:text-blue-700 text-sm"
            >
              <History className="w-4 h-4 mr-1" />
              Ver {patientHistory.length} atendimento(s) anterior(es)
              {showHistory ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </button>
          )}
          
          {/* Histórico expandido */}
          {showHistory && patientHistory.length > 0 && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {patientHistory.slice(0, 5).map((hist) => (
                <div key={hist.id} className="bg-white p-3 rounded border text-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">
                      {new Date(hist.consultationDate).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      hist.status === 'completed' || hist.status === 'signed' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {hist.status === 'completed' || hist.status === 'signed' ? 'Finalizado' : 'Rascunho'}
                    </span>
                  </div>
                  {hist.chiefComplaint && (
                    <p className="text-gray-600 mt-1 truncate">
                      <strong>QP:</strong> {hist.chiefComplaint}
                    </p>
                  )}
                  {hist.diagnosis && (
                    <p className="text-gray-600 truncate">
                      <strong>HD:</strong> {hist.diagnosis}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sinais Vitais (Colapsável) */}
        <div className="border rounded-lg">
          <button
            onClick={() => setShowVitalSigns(!showVitalSigns)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <Activity className="w-5 h-5 text-red-500 mr-2" />
              <span className="font-medium">Sinais Vitais</span>
            </div>
            {showVitalSigns ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {showVitalSigns && (
            <div className="p-4 border-t grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center text-sm text-gray-600 mb-1">
                  <Heart className="w-4 h-4 mr-1 text-red-500" />
                  Pressão Arterial
                </label>
                <input
                  type="text"
                  placeholder="120/80 mmHg"
                  value={record.vitalSigns?.bloodPressure || ''}
                  onChange={(e) => handleVitalSignChange('bloodPressure', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm text-gray-600 mb-1">
                  <Activity className="w-4 h-4 mr-1 text-red-500" />
                  Freq. Cardíaca
                </label>
                <input
                  type="number"
                  placeholder="bpm"
                  value={record.vitalSigns?.heartRate || ''}
                  onChange={(e) => handleVitalSignChange('heartRate', parseInt(e.target.value))}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm text-gray-600 mb-1">
                  <Thermometer className="w-4 h-4 mr-1 text-orange-500" />
                  Temperatura
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="°C"
                  value={record.vitalSigns?.temperature || ''}
                  onChange={(e) => handleVitalSignChange('temperature', parseFloat(e.target.value))}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm text-gray-600 mb-1">
                  <Wind className="w-4 h-4 mr-1 text-blue-500" />
                  Freq. Respiratória
                </label>
                <input
                  type="number"
                  placeholder="irpm"
                  value={record.vitalSigns?.respiratoryRate || ''}
                  onChange={(e) => handleVitalSignChange('respiratoryRate', parseInt(e.target.value))}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm text-gray-600 mb-1">
                  <Activity className="w-4 h-4 mr-1 text-blue-500" />
                  Saturação O₂
                </label>
                <input
                  type="number"
                  placeholder="%"
                  value={record.vitalSigns?.oxygenSaturation || ''}
                  onChange={(e) => handleVitalSignChange('oxygenSaturation', parseInt(e.target.value))}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm text-gray-600 mb-1">
                  <Scale className="w-4 h-4 mr-1 text-purple-500" />
                  Peso
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="kg"
                  value={record.vitalSigns?.weight || ''}
                  onChange={(e) => handleVitalSignChange('weight', parseFloat(e.target.value))}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm text-gray-600 mb-1">
                  <Ruler className="w-4 h-4 mr-1 text-purple-500" />
                  Altura
                </label>
                <input
                  type="number"
                  placeholder="cm"
                  value={record.vitalSigns?.height || ''}
                  onChange={(e) => handleVitalSignChange('height', parseInt(e.target.value))}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Campos Clínicos */}
        <div className="space-y-4">
          {/* Queixa Principal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Queixa Principal (QP)
            </label>
            <input
              type="text"
              placeholder="Motivo da consulta..."
              value={record.chiefComplaint}
              onChange={(e) => handleChange('chiefComplaint', e.target.value)}
              disabled={isReadOnly}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* História da Doença Atual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              História da Doença Atual (HDA)
            </label>
            <textarea
              placeholder="Descreva a evolução dos sintomas, início, duração, fatores de melhora/piora..."
              value={record.historyOfPresentIllness}
              onChange={(e) => handleChange('historyOfPresentIllness', e.target.value)}
              disabled={isReadOnly}
              rows={isCompact ? 3 : 4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100"
            />
          </div>

          {/* Exame Físico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exame Físico / Observações
            </label>
            <textarea
              placeholder="Achados do exame físico e observações relevantes..."
              value={record.physicalExamination}
              onChange={(e) => handleChange('physicalExamination', e.target.value)}
              disabled={isReadOnly}
              rows={isCompact ? 3 : 4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100"
            />
          </div>

          {/* Hipótese Diagnóstica */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hipótese Diagnóstica (HD)
            </label>
            <textarea
              placeholder="CID, diagnóstico provável..."
              value={record.diagnosis}
              onChange={(e) => handleChange('diagnosis', e.target.value)}
              disabled={isReadOnly}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100"
            />
          </div>

          {/* Conduta/Prescrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conduta / Prescrição
            </label>
            <textarea
              placeholder="Medicamentos, orientações, encaminhamentos, retorno..."
              value={record.treatment}
              onChange={(e) => handleChange('treatment', e.target.value)}
              disabled={isReadOnly}
              rows={isCompact ? 4 : 5}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Botão Finalizar */}
        {!isReadOnly && (
          <div className="pt-4 border-t">
            <button
              onClick={handleComplete}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center font-medium"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Finalizar Atendimento
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Após finalizar, o prontuário será travado para edição.
            </p>
          </div>
        )}

        {/* Rodapé com assinatura */}
        {record.status === 'signed' && record.signature && (
          <div className="pt-4 border-t text-center text-sm text-gray-600">
            <Lock className="w-4 h-4 inline mr-1" />
            {record.signature}
          </div>
        )}
      </div>
    </div>
  );
}
