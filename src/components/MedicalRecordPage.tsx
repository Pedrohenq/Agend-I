import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, FileText, Calendar, User, Stethoscope } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import MedicalRecordForm from './MedicalRecordForm';

/**
 * Página de edição de prontuário pós-consulta
 * Permite ao profissional continuar preenchendo/revisando o prontuário após a teleconsulta
 */
export default function MedicalRecordPage() {
  const { tenantId, appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [professional, setProfessional] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storedProfessionalId = sessionStorage.getItem('professionalId');

  useEffect(() => {
    // Verificar se está logado como profissional
    if (!storedProfessionalId) {
      navigate('/profissional/login');
      return;
    }

    loadData();
  }, [tenantId, appointmentId]);

  const loadData = async () => {
    if (!tenantId || !appointmentId) {
      setError('Dados incompletos');
      setLoading(false);
      return;
    }

    try {
      // Carregar agendamento
      const appointmentDoc = await getDoc(doc(db, `tenants/${tenantId}/appointments`, appointmentId));
      if (!appointmentDoc.exists()) {
        setError('Agendamento não encontrado');
        setLoading(false);
        return;
      }

      const appointmentDocData = appointmentDoc.data();
      const appointmentData = { 
        id: appointmentDoc.id, 
        professionalId: appointmentDocData.professionalId as string,
        patientId: appointmentDocData.patientId as string,
        ...appointmentDocData 
      };
      setAppointment(appointmentData);

      // Verificar se o profissional logado é o dono do agendamento
      if (appointmentData.professionalId !== storedProfessionalId) {
        setError('Você não tem permissão para acessar este prontuário');
        setLoading(false);
        return;
      }

      // Carregar profissional
      const profDoc = await getDoc(doc(db, `tenants/${tenantId}/professionals`, appointmentData.professionalId));
      if (profDoc.exists()) {
        setProfessional({ id: profDoc.id, ...profDoc.data() });
      }

      // Carregar paciente
      const patientDoc = await getDoc(doc(db, `tenants/${tenantId}/patients`, appointmentData.patientId));
      if (patientDoc.exists()) {
        setPatient({ id: patientDoc.id, ...patientDoc.data() });
      }

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados do prontuário');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando prontuário...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erro</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/profissional/agenda"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar para Agenda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/profissional/agenda"
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Prontuário Eletrônico</h1>
                  <p className="text-sm text-gray-600">Edição pós-consulta</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Info Bar */}
      {appointment && (
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{patient?.name || 'Paciente'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(appointment.appointmentDate + 'T12:00:00').toLocaleDateString('pt-BR')} às {appointment.startTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                <span>{professional?.name || 'Profissional'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prontuário Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {appointment && patient && (
          <MedicalRecordForm
            tenantId={tenantId!}
            appointmentId={appointmentId!}
            patientId={appointment.patientId}
            professionalId={appointment.professionalId}
            isCompact={false}
          />
        )}
      </div>
    </div>
  );
}
