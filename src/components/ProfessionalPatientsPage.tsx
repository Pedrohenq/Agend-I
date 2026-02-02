import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Calendar, 
  Phone, 
  Mail, 
  FileText, 
  Activity,
  ChevronLeft,
  Eye,
  Clock,
  AlertCircle,
  Stethoscope,
  ChevronRight,
  User
} from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Patient {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  birthDate?: string;
  createdAt: any;
  lastAppointment?: {
    date: string;
    time: string;
    status: string;
  };
  appointmentsCount: number;
  completedCount: number;
}

export default function ProfessionalPatientsPage() {
  const navigate = useNavigate();
  const [tenantId] = useState(sessionStorage.getItem('tenantId') || '');
  const [professionalId] = useState(sessionStorage.getItem('professionalId') || '');
  const [professional, setProfessional] = useState<any>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!tenantId || !professionalId) {
      navigate('/profissional/login');
      return;
    }
    loadData();
  }, [tenantId, professionalId]);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, patients]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar profissional
      const profDoc = await getDocs(
        query(collection(db, `tenants/${tenantId}/professionals`), where('__name__', '==', professionalId))
      );
      if (!profDoc.empty) {
        setProfessional({ id: profDoc.docs[0].id, ...profDoc.docs[0].data() });
      }

      // Carregar todos os agendamentos do profissional
      const appointmentsSnapshot = await getDocs(
        query(
          collection(db, `tenants/${tenantId}/appointments`),
          where('professionalId', '==', professionalId)
        )
      );

      // Mapear pacientes únicos
      const patientIds = new Set<string>();
      const appointmentsByPatient: Record<string, any[]> = {};

      appointmentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const patientId = data.patientId;
        patientIds.add(patientId);
        
        if (!appointmentsByPatient[patientId]) {
          appointmentsByPatient[patientId] = [];
        }
        appointmentsByPatient[patientId].push({
          id: doc.id,
          ...data
        });
      });

      // Carregar dados dos pacientes
      const patientsData: Patient[] = [];
      
      for (const patientId of Array.from(patientIds)) {
        try {
          const patientSnapshot = await getDocs(
            query(collection(db, `tenants/${tenantId}/patients`), where('__name__', '==', patientId))
          );
          
          if (!patientSnapshot.empty) {
            const patientDoc = patientSnapshot.docs[0];
            const patientData = patientDoc.data();
            const appointments = appointmentsByPatient[patientId] || [];
            
            // Ordenar por data
            appointments.sort((a, b) => {
              const dateA = new Date(a.appointmentDate + 'T' + a.startTime);
              const dateB = new Date(b.appointmentDate + 'T' + b.startTime);
              return dateB.getTime() - dateA.getTime();
            });

            const lastAppointment = appointments[0];
            const completedCount = appointments.filter(a => a.status === 'completed').length;

            patientsData.push({
              id: patientDoc.id,
              name: patientData.name || 'Sem nome',
              cpf: patientData.cpf || '',
              phone: patientData.phone || '',
              email: patientData.email || '',
              birthDate: patientData.birthDate,
              createdAt: patientData.createdAt,
              lastAppointment: lastAppointment ? {
                date: lastAppointment.appointmentDate,
                time: lastAppointment.startTime,
                status: lastAppointment.status
              } : undefined,
              appointmentsCount: appointments.length,
              completedCount
            });
          }
        } catch (err) {
          console.warn('Erro ao carregar paciente:', patientId, err);
        }
      }

      // Ordenar por último atendimento
      patientsData.sort((a, b) => {
        if (!a.lastAppointment) return 1;
        if (!b.lastAppointment) return -1;
        const dateA = new Date(a.lastAppointment.date + 'T' + a.lastAppointment.time);
        const dateB = new Date(b.lastAppointment.date + 'T' + b.lastAppointment.time);
        return dateB.getTime() - dateA.getTime();
      });

      setPatients(patientsData);
      setFilteredPatients(patientsData);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = patients.filter(patient => 
      patient.name.toLowerCase().includes(term) ||
      patient.cpf.includes(term) ||
      patient.phone.includes(term) ||
      patient.email.toLowerCase().includes(term)
    );

    setFilteredPatients(filtered);
  };

  const openPatientDetails = async (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
    setLoadingDetails(true);

    try {
      // Carregar todos os agendamentos do paciente
      const appointmentsSnapshot = await getDocs(
        query(
          collection(db, `tenants/${tenantId}/appointments`),
          where('patientId', '==', patient.id),
          where('professionalId', '==', professionalId)
        )
      );

      const appointments = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const dateA = new Date(a.appointmentDate + 'T' + a.startTime);
        const dateB = new Date(b.appointmentDate + 'T' + b.startTime);
        return dateB.getTime() - dateA.getTime();
      });

      setPatientAppointments(appointments);

      // Carregar prontuários
      const recordsSnapshot = await getDocs(
        query(
          collection(db, `tenants/${tenantId}/medicalRecords`),
          where('patientId', '==', patient.id),
          where('professionalId', '==', professionalId)
        )
      );

      const records = recordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const dateA = new Date(a.consultationDate);
        const dateB = new Date(b.consultationDate);
        return dateB.getTime() - dateA.getTime();
      });

      setPatientRecords(records);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const formatCpf = (cpf: string) => {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'no_show': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'no_show': return 'Faltou';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profissional/agenda')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Meus Pacientes</h1>
                  {professional && (
                    <p className="text-sm text-gray-600">{professional.name}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Pacientes</p>
                <p className="text-3xl font-bold text-gray-800">{patients.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Consultas Realizadas</p>
                <p className="text-3xl font-bold text-gray-800">
                  {patients.reduce((sum, p) => sum + p.completedCount, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Atendimentos</p>
                <p className="text-3xl font-bold text-gray-800">
                  {patients.reduce((sum, p) => sum + p.appointmentsCount, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            {filteredPatients.length} paciente(s) encontrado(s)
            {searchTerm && ` para "${searchTerm}"`}
          </p>
        </div>

        {/* Patients List */}
        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente atendido'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Tente ajustar os termos da busca' 
                : 'Quando você atender pacientes, eles aparecerão aqui'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPatients.map((patient) => {
              const age = calculateAge(patient.birthDate);
              
              return (
                <div
                  key={patient.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openPatientDetails(patient)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-7 h-7 text-blue-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-800 truncate">
                              {patient.name}
                            </h3>
                            {patient.lastAppointment && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.lastAppointment.status)}`}>
                                {getStatusLabel(patient.lastAppointment.status)}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span>CPF: {formatCpf(patient.cpf)}</span>
                            </div>
                            
                            {patient.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{patient.phone}</span>
                              </div>
                            )}
                            
                            {patient.email && (
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="truncate">{patient.email}</span>
                              </div>
                            )}
                            
                            {age !== null && (
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>{age} anos</span>
                              </div>
                            )}
                          </div>

                          {patient.lastAppointment && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-4 text-gray-500">
                                  <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    Última consulta: {format(new Date(patient.lastAppointment.date), "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                                  <span className="flex items-center">
                                    <Activity className="w-4 h-4 mr-1" />
                                    {patient.completedCount} consulta(s) realizada(s)
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPatientDetails(patient);
                        }}
                        className="ml-4 p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      {showDetailsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedPatient.name}</h2>
                <p className="text-gray-600">CPF: {formatCpf(selectedPatient.cpf)}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Patient Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">Informações do Paciente</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Telefone</p>
                        <p className="font-medium">{selectedPatient.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="font-medium truncate">{selectedPatient.email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Data de Nascimento</p>
                        <p className="font-medium">
                          {selectedPatient.birthDate 
                            ? format(new Date(selectedPatient.birthDate), "dd/MM/yyyy")
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Idade</p>
                        <p className="font-medium">
                          {calculateAge(selectedPatient.birthDate) 
                            ? `${calculateAge(selectedPatient.birthDate)} anos`
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedPatient.appointmentsCount}</p>
                      <p className="text-sm text-gray-600">Total de Consultas</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedPatient.completedCount}</p>
                      <p className="text-sm text-gray-600">Concluídas</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">{patientRecords.length}</p>
                      <p className="text-sm text-gray-600">Prontuários</p>
                    </div>
                  </div>

                  {/* Appointments History */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                      Histórico de Consultas
                    </h3>
                    {patientAppointments.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Nenhuma consulta registrada</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {patientAppointments.map((apt: any) => (
                          <div key={apt.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {format(new Date(apt.appointmentDate + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </p>
                                <p className="text-sm text-gray-600">Horário: {apt.startTime} - {apt.endTime}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(apt.status)}`}>
                                {getStatusLabel(apt.status)}
                              </span>
                            </div>
                            {apt.status === 'completed' && (
                              <button
                                onClick={() => navigate(`/prontuario/${tenantId}/${apt.id}`)}
                                className="mt-2 text-blue-600 hover:text-blue-700 text-sm flex items-center"
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                Ver Prontuário
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Medical Records */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                      <Stethoscope className="w-5 h-5 mr-2 text-green-600" />
                      Prontuários Médicos
                    </h3>
                    {patientRecords.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Nenhum prontuário preenchido</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {patientRecords.map((record: any) => (
                          <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium">
                                {format(new Date(record.consultationDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                record.status === 'completed' || record.status === 'signed'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {record.status === 'completed' || record.status === 'signed' ? 'Finalizado' : 'Em preenchimento'}
                              </span>
                            </div>
                            
                            {record.chiefComplaint && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>QP:</strong> {record.chiefComplaint}
                              </p>
                            )}
                            
                            {record.diagnosis && (
                              <p className="text-sm text-gray-600 mb-2">
                                <strong>HD:</strong> {record.diagnosis}
                              </p>
                            )}
                            
                            <button
                              onClick={() => navigate(`/prontuario/${tenantId}/${record.appointmentId}`)}
                              className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalhes Completos
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
