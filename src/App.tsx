import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, UserPlus, Settings, LogOut, Home as HomeIcon, Clock, Menu, 
         CheckCircle, Shield, Activity, Stethoscope, 
         Phone, Mail, Copy, Eye, Video, ChevronLeft, AlertCircle, RefreshCw, X, UserX, Filter,
         CreditCard, DollarSign, Receipt, TrendingUp, FileText, Building, Lock, Unlock, 
         Key, Trash2, Search, MoreVertical, Crown, BarChart3, ClipboardList } from 'lucide-react';
import { AnamnesisFormBuilder } from './components/AnamnesisFormBuilder';
import { AnamnesisForm } from './components/AnamnesisForm';
import { AnamnesisService } from './services/anamnesis';
import { BillingService } from './services/billing';
import { MasterAdminService, runMonthlyBillingClosure } from './services/masterAdmin';
import { Invoice, TenantWithBilling } from './types';
import TeleconsultaSplitScreen from './components/TeleconsultaSplitScreen';
import MedicalRecordPage from './components/MedicalRecordPage';
import AppointmentDetailsModal from './components/AppointmentDetailsModal';
import { auth, db } from './config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, 
         addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { format, addMinutes, parse, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ProfessionalPatientsPage from './components/ProfessionalPatientsPage';

// ============= PÁGINA INICIAL =============
function HomePage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text">
                AgendAí
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/login')}
                className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg transition"
              >
                Login Admin
              </button>
              <button
                onClick={() => navigate('/profissional/login')}
                className="text-gray-700 hover:text-green-600 px-4 py-2 rounded-lg transition"
              >
                Login Profissional
              </button>
              <button
                onClick={() => navigate('/cadastro')}
                className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition"
              >
                Criar Conta
              </button>
            </nav>
            <button className="md:hidden p-2">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Sistema Completo de <br />
            <span className="bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text">
              Agendamento Médico
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Gerencie sua clínica com eficiência. Agendamento online, gestão de profissionais, 
            teleconsulta e muito mais em uma única plataforma.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/cadastro')}
              className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:shadow-xl transition"
            >
              Começar Agora
            </button>
            <button
              onClick={() => navigate('/admin/login')}
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition"
            >
              Já tenho conta
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Recursos Completos</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Agendamento Online</h3>
              <p className="text-gray-600">Pacientes agendam consultas 24/7 pelo link personalizado da sua clínica</p>
            </div>
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestão de Profissionais</h3>
              <p className="text-gray-600">Controle completo da equipe médica, horários e disponibilidade</p>
            </div>
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Dominio Personalizado</h3>
              <p className="text-gray-600">Cada clínica tem seu próprio ambiente isolado e personalizado</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Pronto para modernizar sua clínica?</h2>
          <p className="text-xl mb-8 opacity-90">Comece agora gratuitamente e veja a diferença</p>
          <button
            onClick={() => navigate('/cadastro')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:shadow-xl transition"
          >
            Criar Conta
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Activity className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold">AgendAí</span>
          </div>
          <p className="text-gray-400">Sistema de Agendamento Médico © 2026</p>
        </div>
      </footer>
    </div>
  );
}

// ============= CADASTRO DE TENANT =============
function TenantRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    primaryColor: '#0066CC',
    secondaryColor: '#00A86B'
  });

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.companyName || !formData.subdomain) {
        setError('Preencha todos os campos obrigatórios');
        return false;
      }
      if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
        setError('Subdomínio deve conter apenas letras minúsculas, números e hífens');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.adminName || !formData.adminEmail || !formData.adminPassword) {
        setError('Preencha todos os campos obrigatórios');
        return false;
      }
      if (formData.adminPassword.length < 6) {
        setError('Senha deve ter no mínimo 6 caracteres');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Verificar se subdomínio já existe
      const tenantDoc = await getDoc(doc(db, 'tenants', formData.subdomain));
      if (tenantDoc.exists()) {
        setError('Este subdomínio já está em uso');
        setLoading(false);
        return;
      }

      // Criar usuário admin
      const { user } = await createUserWithEmailAndPassword(
        auth,
        formData.adminEmail,
        formData.adminPassword
      );

      // Criar tenant
      const tenantRef = doc(db, 'tenants', formData.subdomain);
      await setDoc(tenantRef, {
        subdomain: formData.subdomain,
        companyName: formData.companyName,
        cnpj: formData.cnpj,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        plan: 'free',
        status: 'active',
        createdAt: serverTimestamp(),
        settings: {
          consultationDuration: 30,
          intervalBetweenConsultations: 15,
          minAdvanceHours: 2,
          maxAdvanceDays: 30,
          maxCancelHours: 2,
          businessHoursStart: '08:00',
          businessHoursEnd: '18:00',
          whatsappEnabled: false
        }
      });

      // Criar admin
      await setDoc(doc(db, `tenants/${formData.subdomain}/admins`, user.uid), {
        uid: user.uid,
        email: formData.adminEmail,
        name: formData.adminName,
        role: 'super_admin',
        createdAt: serverTimestamp()
      });

      alert('Conta criada com sucesso!');
      navigate('/admin/login');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso');
      } else {
        setError('Erro ao criar conta: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Voltar
        </Link>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Activity className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Criar Conta AgendAí</h1>
            <p className="text-gray-600 mt-2">Configure sua clínica em minutos</p>
          </div>
          
          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Informações da Clínica</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Clínica *</label>
                <input
                  type="text"
                  placeholder="Ex: Clínica São Lucas"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subdomínio *</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="minha-clinica"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    className="flex-1 px-4 py-3 border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="bg-gray-100 px-4 py-3 border border-l-0 rounded-r-lg text-gray-500">
                    .agendai.com
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Este será o identificador único da sua clínica</p>
              </div>
              <button
                onClick={handleNext}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Próximo
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Dados do Administrador</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.adminName}
                  onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="admin@clinica.com"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Voltar
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Personalização</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor Primária</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                    className="w-16 h-12 rounded-lg cursor-pointer border"
                  />
                  <span className="text-gray-600">{formData.primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor Secundária</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                    className="w-16 h-12 rounded-lg cursor-pointer border"
                  />
                  <span className="text-gray-600">{formData.secondaryColor}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mt-6">
                <h3 className="font-semibold mb-2">Resumo</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Clínica:</strong> {formData.companyName}</p>
                  <p><strong>Subdomínio:</strong> {formData.subdomain}</p>
                  <p><strong>Administrador:</strong> {formData.adminName}</p>
                  <p><strong>Email:</strong> {formData.adminEmail}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg hover:shadow-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Criando...' : 'Criar Conta'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============= LOGIN ADMIN =============
function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
      let userTenant = null;

      for (const tenantDoc of tenantsSnapshot.docs) {
        const adminDoc = await getDoc(doc(db, `tenants/${tenantDoc.id}/admins`, user.uid));
        if (adminDoc.exists()) {
          userTenant = tenantDoc.id;
          sessionStorage.setItem('tenantId', tenantDoc.id);
          sessionStorage.setItem('userRole', 'admin');
          sessionStorage.setItem('userId', user.uid);
          break;
        }
      }

      if (userTenant) {
        navigate('/admin/dashboard');
      } else {
        await signOut(auth);
        throw new Error('Acesso não autorizado');
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-credential') {
        setError('Email ou senha incorretos');
      } else {
        setError(error.message || 'Erro ao fazer login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border border-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 border border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 border border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center text-white/80 hover:text-white mb-8 transition">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar ao site
          </Link>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">AgendAí</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mt-12">
            Gerencie sua clínica<br />
            com eficiência
          </h1>
          <p className="text-white/80 mt-4 text-lg max-w-md">
            Acesse o painel administrativo e tenha controle total sobre agendamentos, 
            profissionais e configurações da sua clínica.
          </p>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 bg-white/30 backdrop-blur rounded-full border-2 border-white/50 flex items-center justify-center text-white text-sm font-medium">A</div>
              <div className="w-10 h-10 bg-white/30 backdrop-blur rounded-full border-2 border-white/50 flex items-center justify-center text-white text-sm font-medium">B</div>
              <div className="w-10 h-10 bg-white/30 backdrop-blur rounded-full border-2 border-white/50 flex items-center justify-center text-white text-sm font-medium">C</div>
            </div>
            <p className="text-white/80 text-sm">+500 clínicas já usam</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">99%</p>
              <p className="text-white/70 text-xs">Uptime</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-white/70 text-xs">Suporte</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-white/70 text-xs">Seguro</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
            <Activity className="w-10 h-10 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text">
              AgendAí
            </span>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Bem-vindo de volta!</h2>
              <p className="text-gray-500 mt-1">Acesse o portal administrativo</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm flex items-center">
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 font-semibold text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ChevronLeft className="w-5 h-5 rotate-180" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-center text-gray-500 text-sm mb-4">Ou acesse como</p>
              <div className="grid grid-cols-2 gap-3">
                <Link 
                  to="/profissional/login" 
                  className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition text-sm font-medium"
                >
                  <Stethoscope className="w-4 h-4 text-green-600" />
                  Profissional
                </Link>
                <Link 
                  to="/cadastro" 
                  className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Criar Conta
                </Link>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-6">
            <p className="text-gray-400 text-sm">
              © 2026 AgendAí
            </p>
            <button
              onClick={() => navigate('/master/login')}
              className="text-gray-400 hover:text-purple-500 text-xs flex items-center gap-1 transition"
            >
              <Crown className="w-3 h-3" />
              Master
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= LOGIN PROFISSIONAL =============
function ProfessionalLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
      let professionalFound = false;

      for (const tenantDoc of tenantsSnapshot.docs) {
        const profDoc = await getDoc(doc(db, `tenants/${tenantDoc.id}/professionals`, user.uid));
        if (profDoc.exists()) {
          const profData = profDoc.data();
          if (!profData.isActive) {
            throw new Error('Sua conta está inativa. Entre em contato com a administração.');
          }
          sessionStorage.setItem('tenantId', tenantDoc.id);
          sessionStorage.setItem('userRole', 'professional');
          sessionStorage.setItem('userId', user.uid);
          sessionStorage.setItem('professionalId', user.uid);
          professionalFound = true;
          break;
        }
      }

      if (professionalFound) {
        navigate('/profissional/agenda');
      } else {
        await signOut(auth);
        throw new Error('Profissional não encontrado');
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-credential') {
        setError('Email ou senha incorretos');
      } else {
        setError(error.message || 'Erro ao fazer login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-teal-600 to-blue-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 border border-white rounded-full"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 border border-white rounded-full"></div>
          <div className="absolute top-1/3 left-1/3 w-40 h-40 border border-white rounded-full"></div>
        </div>
        
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center text-white/80 hover:text-white mb-8 transition">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar ao site
          </Link>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">AgendAí</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mt-12">
            Sua agenda<br />
            sempre organizada
          </h1>
          <p className="text-white/80 mt-4 text-lg max-w-md">
            Acompanhe seus agendamentos, gerencie pacientes e realize teleconsultas 
            de forma simples e prática.
          </p>
        </div>
        
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Próxima consulta</p>
                <p className="text-white/70 text-sm">Maria Silva - 14:00</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">Cardiologia</span>
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">Retorno</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <Video className="w-6 h-6 text-white mx-auto mb-2" />
              <p className="text-white/70 text-xs">Teleconsulta</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-white mx-auto mb-2" />
              <p className="text-white/70 text-xs">Pacientes</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-white mx-auto mb-2" />
              <p className="text-white/70 text-xs">Horários</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
            <Stethoscope className="w-10 h-10 text-green-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 text-transparent bg-clip-text">
              AgendAí
            </span>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Portal do Profissional</h2>
              <p className="text-gray-500 mt-1">Acesse sua agenda de consultas</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm flex items-center">
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-50 font-semibold text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Entrando...
                  </>
                ) : (
                  <>
                    Acessar Agenda
                    <ChevronLeft className="w-5 h-5 rotate-180" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-center text-gray-500 text-sm mb-4">Não é profissional?</p>
              <div className="grid grid-cols-2 gap-3">
                <Link 
                  to="/admin/login" 
                  className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition text-sm font-medium"
                >
                  <Shield className="w-4 h-4 text-blue-600" />
                  Admin
                </Link>
                <Link 
                  to="/cadastro" 
                  className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4 text-green-600" />
                  Criar Conta
                </Link>
              </div>
            </div>
          </div>
          
          <p className="text-center text-gray-400 text-sm mt-6">
            © 2026 AgendAí. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============= ADMIN SIDEBAR =============
function AdminSidebar({ activePage }: { activePage: string }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-40">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <Activity className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text">
            AgendAí Admin
          </span>
        </div>
        
        <nav className="space-y-2">
          <Link 
            to="/admin/dashboard" 
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
              activePage === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <HomeIcon className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/admin/especialidades" 
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
              activePage === 'specialties' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>Especialidades</span>
          </Link>
          <Link 
            to="/admin/profissionais" 
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
              activePage === 'professionals' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Profissionais</span>
          </Link>
          <Link 
            to="/admin/agendamentos" 
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
              activePage === 'appointments' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Agendamentos</span>
          </Link>
          <Link 
            to="/admin/configuracoes" 
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
              activePage === 'settings' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Configurações</span>
          </Link>
          <Link 
            to="/admin/financeiro" 
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
              activePage === 'billing' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span>Financeiro</span>
          </Link>
          <button 
            onClick={handleLogout} 
            className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 rounded-lg w-full text-left text-red-600 transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

// ============= DASHBOARD ADMIN COMPLETO =============
function AdminDashboard() {
  const navigate = useNavigate();
  const [tenantId] = useState(sessionStorage.getItem('tenantId') || '');
  const [, setTenant] = useState<any>(null);
  const [metrics, setMetrics] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    activePatients: 0,
    activeProfessionals: 0
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!tenantId) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) return;

    try {
      const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
      if (tenantDoc.exists()) {
        setTenant({ id: tenantDoc.id, ...tenantDoc.data() });
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      
      const appointmentsSnapshot = await getDocs(collection(db, `tenants/${tenantId}/appointments`));
      const todayAppointments = appointmentsSnapshot.docs.filter(doc => 
        doc.data().appointmentDate === today
      );
      
      const patientsSnapshot = await getDocs(collection(db, `tenants/${tenantId}/patients`));
      const professionalsSnapshot = await getDocs(collection(db, `tenants/${tenantId}/professionals`));
      const activeProfessionals = professionalsSnapshot.docs.filter(doc => doc.data().isActive);

      setMetrics({
        totalAppointments: appointmentsSnapshot.size,
        todayAppointments: todayAppointments.length,
        activePatients: patientsSnapshot.size,
        activeProfessionals: activeProfessionals.length
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const copyLink = () => {
    // Gerar URL correta para HashRouter
    const href = window.location.href;
    const hashIndex = href.indexOf('#');
    const baseUrl = hashIndex > -1 ? href.substring(0, hashIndex) : href;
    const link = `${baseUrl}#/clinica/${tenantId}/agendar`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activePage="dashboard" />

      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Bem-vindo ao painel administrativo</p>
        </div>
        
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{metrics.totalAppointments}</span>
            </div>
            <p className="text-gray-600">Total de Agendamentos</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{metrics.todayAppointments}</span>
            </div>
            <p className="text-gray-600">Agendamentos Hoje</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{metrics.activePatients}</span>
            </div>
            <p className="text-gray-600">Pacientes Cadastrados</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{metrics.activeProfessionals}</span>
            </div>
            <p className="text-gray-600">Profissionais Ativos</p>
          </div>
        </div>

        {/* Link de Agendamento */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Copy className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Link de Agendamento</h2>
              </div>
              <p className="text-green-100 mb-4">
                Compartilhe este link com seus pacientes para que eles possam agendar consultas online:
              </p>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <p className="text-white font-mono text-sm md:text-base break-all">
                  {(() => {
                    const href = window.location.href;
                    const hashIndex = href.indexOf('#');
                    const baseUrl = hashIndex > -1 ? href.substring(0, hashIndex) : href;
                    return `${baseUrl}#/clinica/${tenantId}/agendar`;
                  })()}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={copyLink}
                className={`${copied ? 'bg-green-700' : 'bg-white'} ${copied ? 'text-white' : 'text-green-600'} px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2`}
              >
                {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </button>
              <button
                onClick={() => window.open(`/#/clinica/${tenantId}/agendar`, '_blank')}
                className="bg-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition flex items-center gap-2 border border-white/50"
              >
                <Eye className="w-5 h-5" />
                Visualizar
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/especialidades" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition border border-gray-100 group">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Gerenciar Especialidades</h3>
            <p className="text-gray-600 text-sm">Adicione e gerencie as especialidades médicas</p>
          </Link>
          
          <Link to="/admin/profissionais" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition border border-gray-100 group">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Gerenciar Profissionais</h3>
            <p className="text-gray-600 text-sm">Cadastre e gerencie os profissionais</p>
          </Link>
          
          <Link to="/admin/configuracoes" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition border border-gray-100 group">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Configurações</h3>
            <p className="text-gray-600 text-sm">Configure os parâmetros do sistema</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============= GESTÃO DE ESPECIALIDADES =============
function SpecialtiesPage() {
  const navigate = useNavigate();
  const [tenantId] = useState(sessionStorage.getItem('tenantId') || '');
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAnamnesisBuilder, setShowAnamnesisBuilder] = useState(false);
  const [selectedSpecialtyForAnamnesis, setSelectedSpecialtyForAnamnesis] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🏥',
    requiresAnamnesis: false
  });

  const icons = ['🏥', '❤️', '🧠', '👁️', '🦴', '🫀', '🫁', '🦷', '👶', '🩺', '💊', '🔬'];

  useEffect(() => {
    if (!tenantId) {
      navigate('/admin/login');
      return;
    }
    loadSpecialties();
  }, [tenantId]);

  const loadSpecialties = async () => {
    if (!tenantId) return;
    try {
      const snapshot = await getDocs(
        query(collection(db, `tenants/${tenantId}/specialties`), orderBy('displayOrder'))
      );
      setSpecialties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Erro ao carregar especialidades:', error);
    }
  };

  const handleSave = async () => {
    if (!tenantId || !formData.name) return;
    setLoading(true);
    
    try {
      if (editingSpecialty) {
        await updateDoc(doc(db, `tenants/${tenantId}/specialties`, editingSpecialty.id), {
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          requiresAnamnesis: formData.requiresAnamnesis
        });
      } else {
        await addDoc(collection(db, `tenants/${tenantId}/specialties`), {
          ...formData,
          displayOrder: specialties.length,
          isActive: true,
          requiresAnamnesis: formData.requiresAnamnesis,
          createdAt: serverTimestamp()
        });
      }
      
      setShowModal(false);
      setEditingSpecialty(null);
      setFormData({ name: '', description: '', icon: '🏥', requiresAnamnesis: false });
      loadSpecialties();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta especialidade?')) return;
    try {
      await deleteDoc(doc(db, `tenants/${tenantId}/specialties`, id));
      loadSpecialties();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const toggleActive = async (specialty: any) => {
    try {
      await updateDoc(doc(db, `tenants/${tenantId}/specialties`, specialty.id), {
        isActive: !specialty.isActive
      });
      loadSpecialties();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activePage="specialties" />

      <div className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Especialidades</h1>
            <p className="text-gray-600 mt-1">Gerencie as especialidades da clínica</p>
          </div>
          <button
            onClick={() => {
              setEditingSpecialty(null);
              setFormData({ name: '', description: '', icon: '🏥', requiresAnamnesis: false });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
          >
            <UserPlus className="w-5 h-5" />
            Nova Especialidade
          </button>
        </div>

        {specialties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma especialidade cadastrada</h3>
            <p className="text-gray-500 mb-6">Comece adicionando sua primeira especialidade</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Adicionar Especialidade
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialties.map((specialty) => (
              <div key={specialty.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-5xl">{specialty.icon}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      specialty.isActive 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {specialty.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{specialty.name}</h3>
                  <p className="text-gray-600 text-sm">{specialty.description || 'Sem descrição'}</p>
                  {specialty.requiresAnamnesis && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        <ClipboardList className="w-3 h-3" />
                        Anamnese Ativada
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 px-6 py-4 space-y-2">
                  {specialty.requiresAnamnesis && (
                    <button
                      onClick={() => {
                        setSelectedSpecialtyForAnamnesis(specialty);
                        setShowAnamnesisBuilder(true);
                      }}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Gerenciar Perguntas
                    </button>
                  )}
                </div>
                <div className="bg-gray-50 px-6 pb-4 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingSpecialty(specialty);
                      setFormData({
                        name: specialty.name,
                        description: specialty.description || '',
                        icon: specialty.icon,
                        requiresAnamnesis: specialty.requiresAnamnesis || false
                      });
                      setShowModal(true);
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActive(specialty)}
                    className={`flex-1 py-2 rounded-lg font-medium ${
                      specialty.isActive 
                        ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {specialty.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleDelete(specialty.id)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">
              {editingSpecialty ? 'Editar' : 'Nova'} Especialidade
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  placeholder="Ex: Cardiologia"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  placeholder="Breve descrição da especialidade"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ícone</label>
                <div className="flex flex-wrap gap-2">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({...formData, icon})}
                      className={`w-12 h-12 text-2xl rounded-lg border-2 transition ${
                        formData.icon === icon 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Anamnese Toggle */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-medium text-gray-800">Requer Anamnese</span>
                      <p className="text-sm text-gray-500">Exigir preenchimento de questionário antes do agendamento</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.requiresAnamnesis}
                    onChange={(e) => setFormData({...formData, requiresAnamnesis: e.target.checked})}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSpecialty(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !formData.name}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Anamnese Builder */}
      {showAnamnesisBuilder && selectedSpecialtyForAnamnesis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <AnamnesisFormBuilder
                tenantId={tenantId}
                specialtyId={selectedSpecialtyForAnamnesis.id}
                specialtyName={selectedSpecialtyForAnamnesis.name}
                onBack={() => {
                  setShowAnamnesisBuilder(false);
                  setSelectedSpecialtyForAnamnesis(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============= GESTÃO DE PROFISSIONAIS =============
function ProfessionalsPage() {
  const navigate = useNavigate();
  const [tenantId] = useState(sessionStorage.getItem('tenantId') || '');
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    crm: '',
    crmState: '',
    specialtyId: '',
    phone: '',
    bio: '',
    consultationDuration: 30,
    intervalBetweenConsultations: 15
  });

  useEffect(() => {
    if (!tenantId) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) return;
    
    try {
      const specSnapshot = await getDocs(collection(db, `tenants/${tenantId}/specialties`));
      const specsData = specSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSpecialties(specsData);
      
      const profSnapshot = await getDocs(collection(db, `tenants/${tenantId}/professionals`));
      const profsData: any[] = profSnapshot.docs.map(docSnap => {
        const data = docSnap.data() as any;
        const specialty = specsData.find((s: any) => s.id === data.specialtyId) as any;
        return {
          id: docSnap.id,
          ...data,
          specialtyName: specialty?.name || 'N/A'
        };
      });
      
      setProfessionals(profsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    setLoading(true);

    try {
      if (editingProfessional) {
        await updateDoc(doc(db, `tenants/${tenantId}/professionals`, editingProfessional.id), {
          name: formData.name,
          crm: formData.crm,
          crmState: formData.crmState,
          specialtyId: formData.specialtyId,
          phone: formData.phone,
          bio: formData.bio,
          consultationDuration: formData.consultationDuration,
          intervalBetweenConsultations: formData.intervalBetweenConsultations
        });
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        await setDoc(doc(db, `tenants/${tenantId}/professionals`, user.uid), {
          uid: user.uid,
          name: formData.name,
          email: formData.email,
          crm: formData.crm,
          crmState: formData.crmState,
          specialtyId: formData.specialtyId,
          phone: formData.phone,
          bio: formData.bio,
          consultationDuration: formData.consultationDuration,
          intervalBetweenConsultations: formData.intervalBetweenConsultations,
          isActive: true,
          createdAt: serverTimestamp()
        });
      }

      setShowModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Erro:', error);
      alert('Erro ao salvar profissional: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      crm: '',
      crmState: '',
      specialtyId: '',
      phone: '',
      bio: '',
      consultationDuration: 30,
      intervalBetweenConsultations: 15
    });
    setEditingProfessional(null);
  };

  const toggleActive = async (prof: any) => {
    try {
      await updateDoc(doc(db, `tenants/${tenantId}/professionals`, prof.id), {
        isActive: !prof.isActive
      });
      loadData();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activePage="professionals" />

      <div className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Profissionais</h1>
            <p className="text-gray-600 mt-1">Gerencie os profissionais da clínica</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
          >
            <UserPlus className="w-5 h-5" />
            Novo Profissional
          </button>
        </div>

        {professionals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum profissional cadastrado</h3>
            <p className="text-gray-500 mb-6">Cadastre profissionais para começar a receber agendamentos</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Adicionar Profissional
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.map((prof) => (
              <div key={prof.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-blue-500 to-green-500"></div>
                <div className="p-6 -mt-12">
                  <div className="flex items-start justify-between">
                    <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center text-3xl">
                      👨‍⚕️
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      prof.isActive 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {prof.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mt-4">{prof.name}</h3>
                  <p className="text-blue-600 font-medium">{prof.specialtyName}</p>
                  <p className="text-sm text-gray-500 mt-1">CRM: {prof.crm}/{prof.crmState}</p>
                  
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {prof.email}
                    </p>
                    {prof.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {prof.phone}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Consulta: {prof.consultationDuration}min
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProfessional(prof);
                        setFormData({
                          name: prof.name,
                          email: prof.email,
                          password: '',
                          crm: prof.crm,
                          crmState: prof.crmState,
                          specialtyId: prof.specialtyId,
                          phone: prof.phone || '',
                          bio: prof.bio || '',
                          consultationDuration: prof.consultationDuration,
                          intervalBetweenConsultations: prof.intervalBetweenConsultations
                        });
                        setShowModal(true);
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActive(prof)}
                      className={`flex-1 py-2 rounded-lg font-medium ${
                        prof.isActive 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                    >
                      {prof.isActive ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/profissionais/${prof.id}/disponibilidade`)}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Gerenciar Disponibilidade
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingProfessional ? 'Editar' : 'Novo'} Profissional
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Dr. João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {!editingProfessional && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      placeholder="medico@clinica.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CRM *</label>
                <input
                  type="text"
                  placeholder="123456"
                  value={formData.crm}
                  onChange={(e) => setFormData({...formData, crm: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF) *</label>
                <input
                  type="text"
                  placeholder="SP"
                  maxLength={2}
                  value={formData.crmState}
                  onChange={(e) => setFormData({...formData, crmState: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade *</label>
                <select
                  value={formData.specialtyId}
                  onChange={(e) => setFormData({...formData, specialtyId: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione a Especialidade</option>
                  {specialties.filter(s => s.isActive).map(spec => (
                    <option key={spec.id} value={spec.id}>{spec.icon} {spec.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Sobre</label>
                <textarea
                  placeholder="Breve descrição sobre o profissional..."
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração da Consulta (min)</label>
                <input
                  type="number"
                  value={formData.consultationDuration}
                  onChange={(e) => setFormData({...formData, consultationDuration: parseInt(e.target.value) || 30})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo entre Consultas (min)</label>
                <input
                  type="number"
                  value={formData.intervalBetweenConsultations}
                  onChange={(e) => setFormData({...formData, intervalBetweenConsultations: parseInt(e.target.value) || 15})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============= DISPONIBILIDADE DO PROFISSIONAL =============
function AvailabilityPage() {
  const { professionalId } = useParams();
  const navigate = useNavigate();
  const [tenantId] = useState(sessionStorage.getItem('tenantId') || '');
  const [userRole] = useState(sessionStorage.getItem('userRole') || '');
  const [userId] = useState(sessionStorage.getItem('userId') || '');
  const [professional, setProfessional] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '18:00'
  });

  const effectiveProfessionalId = professionalId || userId;

  const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' }
  ];

  useEffect(() => {
    if (!tenantId || !effectiveProfessionalId) {
      navigate(userRole === 'admin' ? '/admin/profissionais' : '/profissional/agenda');
      return;
    }
    loadData();
  }, [effectiveProfessionalId, tenantId]);

  const loadData = async () => {
    if (!tenantId || !effectiveProfessionalId) return;

    try {
      const profDoc = await getDoc(doc(db, `tenants/${tenantId}/professionals`, effectiveProfessionalId));
      if (profDoc.exists()) {
        setProfessional({ id: profDoc.id, ...profDoc.data() });
      }

      const availSnapshot = await getDocs(
        collection(db, `tenants/${tenantId}/professionals/${effectiveProfessionalId}/availability`)
      );
      setAvailability(availSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSave = async () => {
    if (!tenantId || !effectiveProfessionalId) return;
    setLoading(true);

    try {
      if (formData.id) {
        await updateDoc(
          doc(db, `tenants/${tenantId}/professionals/${effectiveProfessionalId}/availability`, formData.id),
          {
            dayOfWeek: formData.dayOfWeek,
            startTime: formData.startTime,
            endTime: formData.endTime,
            isActive: true
          }
        );
      } else {
        await addDoc(
          collection(db, `tenants/${tenantId}/professionals/${effectiveProfessionalId}/availability`),
          {
            dayOfWeek: formData.dayOfWeek,
            startTime: formData.startTime,
            endTime: formData.endTime,
            isActive: true
          }
        );
      }
      
      setShowModal(false);
      setFormData({ dayOfWeek: 1, startTime: '08:00', endTime: '18:00' });
      loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este horário?')) return;
    try {
      await deleteDoc(
        doc(db, `tenants/${tenantId}/professionals/${effectiveProfessionalId}/availability`, id)
      );
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold">Disponibilidade</h1>
                {professional && <p className="text-sm text-gray-600">{professional.name}</p>}
              </div>
            </div>
            <button
              onClick={() => navigate(userRole === 'admin' ? '/admin/profissionais' : '/profissional/agenda')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Voltar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Horários de Atendimento</h2>
            <button
              onClick={() => {
                setFormData({ dayOfWeek: 1, startTime: '08:00', endTime: '18:00' });
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Adicionar Horário
            </button>
          </div>
          
          <div className="space-y-3">
            {daysOfWeek.map((day) => {
              const dayAvailability = availability.filter(a => a.dayOfWeek === day.value);
              
              return (
                <div key={day.value} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{day.label}</span>
                    <div className="flex items-center gap-2">
                      {dayAvailability.length > 0 ? (
                        dayAvailability.map(avail => (
                          <div key={avail.id} className="flex items-center gap-2">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                              {avail.startTime} - {avail.endTime}
                            </span>
                            <button
                              onClick={() => {
                                setFormData({
                                  id: avail.id,
                                  dayOfWeek: avail.dayOfWeek,
                                  startTime: avail.startTime,
                                  endTime: avail.endTime
                                });
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 p-1"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(avail.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              🗑️
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">Sem horário definido</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">
              {formData.id ? 'Editar' : 'Adicionar'} Horário
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dia da Semana</label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({...formData, dayOfWeek: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {daysOfWeek.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============= CONFIGURAÇÕES =============
function SettingsPage() {
  const navigate = useNavigate();
  const [tenantId] = useState(sessionStorage.getItem('tenantId') || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    companyName: '',
    primaryColor: '#0066CC',
    secondaryColor: '#00A86B',
    consultationDuration: 30,
    intervalBetweenConsultations: 15,
    minAdvanceHours: 2,
    maxAdvanceDays: 30,
    maxCancelHours: 2,
    businessHoursStart: '08:00',
    businessHoursEnd: '18:00'
  });

  useEffect(() => {
    if (!tenantId) {
      navigate('/admin/login');
      return;
    }
    loadSettings();
  }, [tenantId]);

  const loadSettings = async () => {
    if (!tenantId) return;
    try {
      const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
      if (tenantDoc.exists()) {
        const data = tenantDoc.data();
        setSettings({
          companyName: data.companyName || '',
          primaryColor: data.primaryColor || '#0066CC',
          secondaryColor: data.secondaryColor || '#00A86B',
          consultationDuration: data.settings?.consultationDuration || 30,
          intervalBetweenConsultations: data.settings?.intervalBetweenConsultations || 15,
          minAdvanceHours: data.settings?.minAdvanceHours || 2,
          maxAdvanceDays: data.settings?.maxAdvanceDays || 30,
          maxCancelHours: data.settings?.maxCancelHours || 2,
          businessHoursStart: data.settings?.businessHoursStart || '08:00',
          businessHoursEnd: data.settings?.businessHoursEnd || '18:00'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'tenants', tenantId), {
        companyName: settings.companyName,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        settings: {
          consultationDuration: settings.consultationDuration,
          intervalBetweenConsultations: settings.intervalBetweenConsultations,
          minAdvanceHours: settings.minAdvanceHours,
          maxAdvanceDays: settings.maxAdvanceDays,
          maxCancelHours: settings.maxCancelHours,
          businessHoursStart: settings.businessHoursStart,
          businessHoursEnd: settings.businessHoursEnd
        }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activePage="settings" />

      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
          <p className="text-gray-600 mt-1">Configure os parâmetros da sua clínica</p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Informações Gerais */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Informações Gerais</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Clínica</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Primária</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <span className="text-gray-600">{settings.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Secundária</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <span className="text-gray-600">{settings.secondaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Horários de Funcionamento */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Horários de Funcionamento</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abertura</label>
                <input
                  type="time"
                  value={settings.businessHoursStart}
                  onChange={(e) => setSettings({...settings, businessHoursStart: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fechamento</label>
                <input
                  type="time"
                  value={settings.businessHoursEnd}
                  onChange={(e) => setSettings({...settings, businessHoursEnd: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Configurações de Agendamento */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Regras de Agendamento</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração Padrão (min)</label>
                <input
                  type="number"
                  value={settings.consultationDuration}
                  onChange={(e) => setSettings({...settings, consultationDuration: parseInt(e.target.value) || 30})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo entre Consultas (min)</label>
                <input
                  type="number"
                  value={settings.intervalBetweenConsultations}
                  onChange={(e) => setSettings({...settings, intervalBetweenConsultations: parseInt(e.target.value) || 15})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Antecedência Mínima (horas)</label>
                <input
                  type="number"
                  value={settings.minAdvanceHours}
                  onChange={(e) => setSettings({...settings, minAdvanceHours: parseInt(e.target.value) || 2})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de Dias para Agendar</label>
                <input
                  type="number"
                  value={settings.maxAdvanceDays}
                  onChange={(e) => setSettings({...settings, maxAdvanceDays: parseInt(e.target.value) || 30})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Configurações salvas com sucesso!
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= PÁGINA DE AGENDAMENTO DO PACIENTE =============
function PublicBookingPage() {
  const { tenantId } = useParams();
  const [tenant, setTenant] = useState<any>(null);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [showMyAppointments, setShowMyAppointments] = useState(false);
  const [searchCpf, setSearchCpf] = useState('');
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [searchingAppointments, setSearchingAppointments] = useState(false);
  
  // Estados para Anamnese
  const [showAnamnesis, setShowAnamnesis] = useState(false);
  const [anamnesisResponses, setAnamnesisResponses] = useState<Record<string, any>>({});
  const anamnesisService = tenantId ? new AnamnesisService(tenantId) : null;
  
  const [booking, setBooking] = useState({
    specialtyId: '',
    professionalId: '',
    date: '',
    time: '',
    patientName: '',
    patientCpf: '',
    patientPhone: '',
    patientEmail: ''
  });

  useEffect(() => {
    if (tenantId) {
      loadTenantData();
    }
  }, [tenantId]);

  const loadTenantData = async () => {
    try {
      const tenantDoc = await getDoc(doc(db, 'tenants', tenantId!));
      if (!tenantDoc.exists()) {
        setLoading(false);
        return;
      }
      setTenant({ id: tenantDoc.id, ...tenantDoc.data() });

      const specsSnapshot = await getDocs(
        query(collection(db, `tenants/${tenantId}/specialties`), where('isActive', '==', true))
      );
      setSpecialties(specsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const profsSnapshot = await getDocs(
        query(collection(db, `tenants/${tenantId}/professionals`), where('isActive', '==', true))
      );
      const profsData: any[] = [];
      for (const profDoc of profsSnapshot.docs) {
        const data = profDoc.data();
        const spec = specsSnapshot.docs.find(s => s.id === data.specialtyId);
        const specData = spec?.data();
        profsData.push({
          id: profDoc.id,
          ...data,
          specialtyName: specData?.name || 'N/A'
        });
      }
      setProfessionals(profsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchMyAppointments = async () => {
    if (!searchCpf.trim()) {
      alert('Digite seu CPF para consultar');
      return;
    }
    
    setSearchingAppointments(true);
    try {
      // Buscar paciente pelo CPF
      const patientsQuery = query(
        collection(db, `tenants/${tenantId}/patients`),
        where('cpf', '==', searchCpf.trim())
      );
      const patientsSnapshot = await getDocs(patientsQuery);
      
      if (patientsSnapshot.empty) {
        setMyAppointments([]);
        setSearchingAppointments(false);
        return;
      }
      
      const patientId = patientsSnapshot.docs[0].id;
      
      // Buscar agendamentos do paciente
      const appointmentsSnapshot = await getDocs(
        query(
          collection(db, `tenants/${tenantId}/appointments`),
          where('patientId', '==', patientId)
        )
      );
      
      const appointmentsData: any[] = appointmentsSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const prof = professionals.find(p => p.id === data.professionalId);
        return {
          id: docSnap.id,
          appointmentDate: data.appointmentDate,
          startTime: data.startTime,
          endTime: data.endTime,
          status: data.status,
          professionalName: prof?.name || 'N/A',
          specialtyName: prof?.specialtyName || 'N/A'
        };
      });
      
      // Ordenar por data
      appointmentsData.sort((a: any, b: any) => {
        const dateA = new Date(a.appointmentDate + 'T' + a.startTime);
        const dateB = new Date(b.appointmentDate + 'T' + b.startTime);
        return dateB.getTime() - dateA.getTime();
      });
      
      setMyAppointments(appointmentsData);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setSearchingAppointments(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    
    try {
      await updateDoc(doc(db, `tenants/${tenantId}/appointments`, appointmentId), {
        status: 'cancelled',
        cancelledBy: 'patient',
        cancelledAt: serverTimestamp()
      });
      
      // Recarregar agendamentos
      searchMyAppointments();
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      alert('Erro ao cancelar agendamento');
    }
  };

  const loadAvailableSlots = async () => {
    if (!booking.professionalId || !booking.date) return;

    try {
      const professional = professionals.find(p => p.id === booking.professionalId);
      if (!professional) return;

      const selectedDate = new Date(booking.date + 'T12:00:00');
      const dayOfWeek = selectedDate.getDay();

      // Carregar disponibilidade do profissional
      const availSnapshot = await getDocs(
        query(
          collection(db, `tenants/${tenantId}/professionals/${booking.professionalId}/availability`),
          where('dayOfWeek', '==', dayOfWeek),
          where('isActive', '==', true)
        )
      );

      if (availSnapshot.empty) {
        setAvailableSlots([]);
        return;
      }

      // Carregar agendamentos existentes
      const appointmentsSnapshot = await getDocs(
        query(
          collection(db, `tenants/${tenantId}/appointments`),
          where('professionalId', '==', booking.professionalId),
          where('appointmentDate', '==', booking.date),
          where('status', 'in', ['scheduled', 'confirmed'])
        )
      );

      const bookedSlots = appointmentsSnapshot.docs.map(doc => doc.data().startTime);

      // Gerar slots disponíveis
      const slots: string[] = [];
      const duration = professional.consultationDuration || 30;
      const interval = professional.intervalBetweenConsultations || 15;

      availSnapshot.docs.forEach(availDoc => {
        const avail = availDoc.data();
        let currentTime = parse(avail.startTime, 'HH:mm', new Date());
        const endTime = parse(avail.endTime, 'HH:mm', new Date());

        while (isBefore(currentTime, endTime)) {
          const timeStr = format(currentTime, 'HH:mm');
          if (!bookedSlots.includes(timeStr)) {
            slots.push(timeStr);
          }
          currentTime = addMinutes(currentTime, duration + interval);
        }
      });

      setAvailableSlots(slots.sort());
    } catch (error) {
      console.error('Erro ao carregar slots:', error);
    }
  };

  useEffect(() => {
    if (booking.professionalId && booking.date) {
      loadAvailableSlots();
    }
  }, [booking.professionalId, booking.date]);

  // Verificar se precisa de anamnese antes de prosseguir para confirmação
  const checkAnamnesisRequirement = async () => {
    const professional = professionals.find(p => p.id === booking.professionalId);
    if (!professional) return false;
    
    const specialty = specialties.find(s => s.id === professional.specialtyId);
    return specialty?.requiresAnamnesis === true;
  };

  // Chamado quando o usuário completa o step 2 (data/hora) e vai para o step 3
  const handleDateTimeNext = async () => {
    const requiresAnamnesis = await checkAnamnesisRequirement();
    
    if (requiresAnamnesis && Object.keys(anamnesisResponses).length === 0) {
      // Precisa preencher anamnese
      setShowAnamnesis(true);
    } else {
      setStep(3);
    }
  };

  // Chamado quando a anamnese é concluída
  const handleAnamnesisComplete = (responses: Record<string, any>) => {
    setAnamnesisResponses(responses);
    setShowAnamnesis(false);
    setStep(3);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const professional = professionals.find(p => p.id === booking.professionalId);
      const duration = professional?.consultationDuration || 30;
      const startTime = parse(booking.time, 'HH:mm', new Date());
      const endTime = addMinutes(startTime, duration);

      // Criar ou buscar paciente
      const patientsQuery = query(
        collection(db, `tenants/${tenantId}/patients`),
        where('cpf', '==', booking.patientCpf)
      );
      const patientsSnapshot = await getDocs(patientsQuery);
      
      let patientId: string;
      if (patientsSnapshot.empty) {
        const patientRef = await addDoc(collection(db, `tenants/${tenantId}/patients`), {
          name: booking.patientName,
          cpf: booking.patientCpf,
          phone: booking.patientPhone,
          email: booking.patientEmail,
          createdAt: serverTimestamp()
        });
        patientId = patientRef.id;
      } else {
        patientId = patientsSnapshot.docs[0].id;
      }

      // Criar agendamento
      const appointmentRef = await addDoc(collection(db, `tenants/${tenantId}/appointments`), {
        patientId,
        professionalId: booking.professionalId,
        appointmentDate: booking.date,
        startTime: booking.time,
        endTime: format(endTime, 'HH:mm'),
        status: 'scheduled',
        createdAt: serverTimestamp()
      });

      // Salvar respostas da anamnese se houver
      if (Object.keys(anamnesisResponses).length > 0 && anamnesisService) {
        const anamnesisQuestions = await anamnesisService.getQuestionsBySpecialty(professional?.specialtyId);
        await anamnesisService.saveResponses(
          appointmentRef.id,
          patientId,
          professional?.specialtyId,
          anamnesisResponses,
          anamnesisQuestions
        );
      }

      setSuccess(true);
    } catch (error) {
      console.error('Erro ao agendar:', error);
      alert('Erro ao realizar agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Clínica não encontrada</h1>
          <p className="text-gray-600">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Agendamento Confirmado!</h1>
          <p className="text-gray-600 mb-6">
            Sua consulta foi agendada com sucesso. Você receberá uma confirmação por email.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-600"><strong>Data:</strong> {booking.date}</p>
            <p className="text-sm text-gray-600"><strong>Horário:</strong> {booking.time}</p>
            <p className="text-sm text-gray-600">
              <strong>Profissional:</strong> {professionals.find(p => p.id === booking.professionalId)?.name}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredProfessionals = booking.specialtyId 
    ? professionals.filter(p => p.specialtyId === booking.specialtyId)
    : professionals;

  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), tenant.settings?.maxAdvanceDays || 30), 'yyyy-MM-dd');

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
      case 'no_show': return 'Não Compareceu';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8" style={{ color: tenant.primaryColor }} />
              <span className="text-xl font-bold">{tenant.companyName}</span>
            </div>
            <button
              onClick={() => {
                setShowMyAppointments(!showMyAppointments);
                if (!showMyAppointments) {
                  setMyAppointments([]);
                  setSearchCpf('');
                }
              }}
              className="text-sm font-medium px-4 py-2 rounded-lg transition"
              style={{ 
                backgroundColor: showMyAppointments ? tenant.primaryColor : 'transparent',
                color: showMyAppointments ? 'white' : tenant.primaryColor,
                border: `1px solid ${tenant.primaryColor}`
              }}
            >
              {showMyAppointments ? 'Novo Agendamento' : 'Meus Agendamentos'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {showMyAppointments ? (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h1 className="text-2xl font-bold text-center mb-2">Meus Agendamentos</h1>
            <p className="text-gray-600 text-center mb-6">Digite seu CPF para consultar suas consultas</p>
            
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Digite seu CPF"
                value={searchCpf}
                onChange={(e) => setSearchCpf(e.target.value)}
                className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={searchMyAppointments}
                disabled={searchingAppointments}
                className="px-6 py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: tenant.primaryColor }}
              >
                {searchingAppointments ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            
            {myAppointments.length > 0 ? (
              <div className="space-y-4">
                {myAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>
                        <p className="font-semibold text-lg">{appointment.professionalName}</p>
                        <p className="text-gray-600">{appointment.specialtyName}</p>
                        <p className="text-gray-600 mt-2">
                          📅 {format(new Date(appointment.appointmentDate + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-gray-600">🕐 {appointment.startTime} - {appointment.endTime}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                          <>
                            <Link
                              to={`/teleconsulta/${tenantId}/${appointment.id}`}
                              className="bg-purple-600 text-white hover:bg-purple-700 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1"
                            >
                              <Video className="w-4 h-4" />
                              Entrar na Consulta
                            </Link>
                            <button
                              onClick={() => cancelAppointment(appointment.id)}
                              className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg text-sm font-medium"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchCpf && !searchingAppointments ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum agendamento encontrado para este CPF</p>
              </div>
            ) : null}
          </div>
        ) : (
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Agende sua Consulta</h1>
          <p className="text-gray-600 text-center mb-8">Escolha o profissional e horário de sua preferência</p>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s <= step ? 'text-white' : 'bg-gray-200 text-gray-400'
                }`} style={{ backgroundColor: s <= step ? tenant.primaryColor : undefined }}>
                  {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 mx-2`} style={{ backgroundColor: s < step ? tenant.primaryColor : '#e5e7eb' }} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade</label>
                <select
                  value={booking.specialtyId}
                  onChange={(e) => setBooking({...booking, specialtyId: e.target.value, professionalId: ''})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as especialidades</option>
                  {specialties.map(spec => (
                    <option key={spec.id} value={spec.id}>{spec.icon} {spec.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profissional *</label>
                <div className="space-y-3">
                  {filteredProfessionals.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhum profissional disponível</p>
                  ) : (
                    filteredProfessionals.map(prof => (
                      <button
                        key={prof.id}
                        onClick={() => setBooking({...booking, professionalId: prof.id})}
                        className={`w-full p-4 rounded-lg border-2 text-left transition ${
                          booking.professionalId === prof.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                            👨‍⚕️
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{prof.name}</h3>
                            <p className="text-sm text-gray-600">{prof.specialtyName}</p>
                            <p className="text-sm text-gray-500">CRM: {prof.crm}/{prof.crmState}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!booking.professionalId}
                className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: tenant.primaryColor }}
              >
                Próximo
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data *</label>
                <input
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={booking.date}
                  onChange={(e) => setBooking({...booking, date: e.target.value, time: ''})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {booking.date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horário *</label>
                  {availableSlots.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhum horário disponível nesta data</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setBooking({...booking, time: slot})}
                          className={`py-3 rounded-lg border-2 font-medium transition ${
                            booking.time === slot
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold"
                >
                  Voltar
                </button>
                <button
                  onClick={handleDateTimeNext}
                  disabled={!booking.date || !booking.time}
                  className="flex-1 py-3 rounded-lg font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: tenant.primaryColor }}
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {/* Formulário de Anamnese */}
          {showAnamnesis && (
            <div className="space-y-6">
              <AnamnesisForm
                tenantId={tenantId!}
                specialtyId={professionals.find(p => p.id === booking.professionalId)?.specialtyId || ''}
                specialtyName={specialties.find(s => s.id === professionals.find(p => p.id === booking.professionalId)?.specialtyId)?.name || ''}
                onComplete={handleAnamnesisComplete}
                onCancel={() => setShowAnamnesis(false)}
              />
            </div>
          )}

          {step === 3 && !showAnamnesis && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={booking.patientName}
                  onChange={(e) => setBooking({...booking, patientName: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={booking.patientCpf}
                  onChange={(e) => setBooking({...booking, patientCpf: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={booking.patientPhone}
                  onChange={(e) => setBooking({...booking, patientPhone: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={booking.patientEmail}
                  onChange={(e) => setBooking({...booking, patientEmail: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h3 className="font-semibold mb-2">Resumo do Agendamento</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Profissional:</strong> {professionals.find(p => p.id === booking.professionalId)?.name}</p>
                  <p><strong>Data:</strong> {booking.date && format(new Date(booking.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  <p><strong>Horário:</strong> {booking.time}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold"
                >
                  Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !booking.patientName || !booking.patientCpf || !booking.patientPhone || !booking.patientEmail}
                  className="flex-1 py-3 rounded-lg font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: tenant.primaryColor }}
                >
                  {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

// ============= AGENDA DO PROFISSIONAL =============
function ProfessionalAgendaPage() {
  const navigate = useNavigate();
  const [tenantId] = useState(sessionStorage.getItem('tenantId') || '');
  const [professionalId] = useState(sessionStorage.getItem('professionalId') || '');
  const [professional, setProfessional] = useState<any>(null);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'upcoming' | 'today' | 'all'>('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (!tenantId || !professionalId) {
      navigate('/profissional/login');
      return;
    }
    loadData();
  }, [tenantId, professionalId]);

  useEffect(() => {
    applyFilters();
  }, [allAppointments, filterStatus, viewMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar profissional
      const profDoc = await getDoc(doc(db, `tenants/${tenantId}/professionals`, professionalId));
      if (profDoc.exists()) {
        setProfessional({ id: profDoc.id, ...profDoc.data() });
      }

      // Carregar pacientes
      const patientsSnapshot = await getDocs(collection(db, `tenants/${tenantId}/patients`));
      const patientsData: any[] = patientsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      // Carregar TODOS os agendamentos do profissional
      const appointmentsSnapshot = await getDocs(
        collection(db, `tenants/${tenantId}/appointments`)
      );

      const appointmentsData: any[] = appointmentsSnapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          const patient = patientsData.find(p => p.id === data.patientId);
          return {
            id: docSnap.id,
            appointmentDate: data.appointmentDate,
            startTime: data.startTime,
            endTime: data.endTime,
            status: data.status,
            professionalId: data.professionalId,
            patientName: patient?.name || 'Paciente não encontrado',
            patientPhone: patient?.phone || '',
            patientEmail: patient?.email || ''
          };
        })
        .filter((a: any) => a.professionalId === professionalId);

      setAllAppointments(appointmentsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allAppointments];
    const today = format(new Date(), 'yyyy-MM-dd');

    // Filtrar por modo de visualização
    if (viewMode === 'today') {
      filtered = filtered.filter(apt => apt.appointmentDate === today);
    } else if (viewMode === 'upcoming') {
      filtered = filtered.filter(apt => apt.appointmentDate >= today);
    }

    // Filtrar por status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }

    // Ordenar por data mais próxima e depois por horário
    filtered.sort((a, b) => {
      const dateCompare = a.appointmentDate.localeCompare(b.appointmentDate);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    setFilteredAppointments(filtered);
  };

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.clear();
    navigate('/');
  };

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, `tenants/${tenantId}/appointments`, appointmentId), {
        status: newStatus,
        ...(newStatus === 'cancelled' ? { cancelledAt: serverTimestamp(), cancelledBy: 'professional' } : {})
      });
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
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

  const formatDateLabel = (dateStr: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    
    if (dateStr === today) {
      return { text: 'Hoje', className: 'bg-green-600 text-white' };
    } else if (dateStr === tomorrow) {
      return { text: 'Amanhã', className: 'bg-blue-600 text-white' };
    } else {
      const date = new Date(dateStr + 'T12:00:00');
      return { 
        text: format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }), 
        className: 'bg-gray-600 text-white' 
      };
    }
  };

  // Agrupar por data
  const groupedByDate = filteredAppointments.reduce((acc: any, apt) => {
    if (!acc[apt.appointmentDate]) {
      acc[apt.appointmentDate] = [];
    }
    acc[apt.appointmentDate].push(apt);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort();

  // Contadores
  const today = format(new Date(), 'yyyy-MM-dd');
  const counts = {
    all: allAppointments.length,
    upcoming: allAppointments.filter(apt => apt.appointmentDate >= today).length,
    today: allAppointments.filter(apt => apt.appointmentDate === today).length,
    scheduled: allAppointments.filter(apt => apt.status === 'scheduled' && apt.appointmentDate >= today).length,
    confirmed: allAppointments.filter(apt => apt.status === 'confirmed' && apt.appointmentDate >= today).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Stethoscope className="w-8 h-8 text-green-600" />
              <div>
                <span className="text-xl font-bold text-gray-800">Portal do Profissional</span>
                {professional && <p className="text-sm text-gray-600">{professional.name}</p>}
              </div>
            </div>
            <nav className="flex items-center space-x-4">
              <Link 
                to="/profissional/disponibilidade" 
                className="text-gray-700 hover:text-green-600 px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Minha Disponibilidade
              </Link>

              <Link 
               to="/profissional/pacientes" 
               className="text-gray-700 hover:text-green-600 px-4 py-2 rounded-lg transition flex items-center gap-2"
               >
                  <Users className="w-5 h-5" />
                    Meus Pacientes
                    </Link>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Hoje</p>
                <p className="text-2xl font-bold text-green-600">{counts.today}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Próximas</p>
                <p className="text-2xl font-bold text-blue-600">{counts.upcoming}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aguardando</p>
                <p className="text-2xl font-bold text-yellow-600">{counts.scheduled}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Confirmadas</p>
                <p className="text-2xl font-bold text-blue-600">{counts.confirmed}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* View Mode Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('today')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  viewMode === 'today' 
                    ? 'bg-white shadow text-green-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Hoje ({counts.today})
              </button>
              <button
                onClick={() => setViewMode('upcoming')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  viewMode === 'upcoming' 
                    ? 'bg-white shadow text-green-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Próximas ({counts.upcoming})
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  viewMode === 'all' 
                    ? 'bg-white shadow text-green-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todas ({counts.all})
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="scheduled">Agendado</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="no_show">Não Compareceu</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">{filteredAppointments.length} consulta(s) encontrada(s)</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma consulta encontrada</h3>
            <p className="text-gray-500">Não há consultas para os filtros selecionados</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => {
              const dateLabel = formatDateLabel(date);
              const dayAppointments = groupedByDate[date];
              
              return (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium capitalize ${dateLabel.className}`}>
                      {dateLabel.text}
                    </span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-sm text-gray-500">{dayAppointments.length} consulta(s)</span>
                  </div>

                  {/* Appointments */}
                  <div className="space-y-3">
                    {dayAppointments.map((appointment: any) => (
                      <div 
                        key={appointment.id} 
                        className={`bg-white rounded-xl shadow-sm border-l-4 p-5 ${
                          appointment.status === 'cancelled' ? 'border-l-red-500 opacity-60' :
                          appointment.status === 'completed' ? 'border-l-green-500' :
                          appointment.status === 'confirmed' ? 'border-l-blue-500' :
                          appointment.status === 'no_show' ? 'border-l-gray-500' :
                          'border-l-yellow-500'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="bg-gray-100 rounded-lg p-3 text-center min-w-[70px]">
                              <p className="text-lg font-bold text-gray-800">{appointment.startTime}</p>
                              <p className="text-xs text-gray-500">até {appointment.endTime}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-gray-800">{appointment.patientName}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                                  {getStatusLabel(appointment.status)}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-2">
                                {appointment.patientPhone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {appointment.patientPhone}
                                  </span>
                                )}
                                {appointment.patientEmail && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {appointment.patientEmail}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            {/* Botão Ver Detalhes (sempre visível) */}
                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowDetailsModal(true);
                              }}
                              className="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-200 flex items-center gap-1 text-sm font-medium"
                            >
                              <ClipboardList className="w-4 h-4" />
                              Ver Detalhes
                            </button>
                            
                            {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                              <>
                                <button
                                  onClick={() => navigate(`/teleconsulta/${tenantId}/${appointment.id}`)}
                                  className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 flex items-center gap-1 text-sm font-medium"
                                >
                                  <Video className="w-4 h-4" />
                                  Teleconsulta
                                </button>
                                
                                {appointment.status === 'scheduled' && (
                                  <button
                                    onClick={() => updateStatus(appointment.id, 'confirmed')}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm font-medium"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Confirmar
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => updateStatus(appointment.id, 'completed')}
                                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm font-medium"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Concluir
                                </button>
                                
                                <button
                                  onClick={() => updateStatus(appointment.id, 'no_show')}
                                  className="bg-gray-500 text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 flex items-center gap-1 text-sm font-medium"
                                >
                                  <UserX className="w-4 h-4" />
                                  Faltou
                                </button>
                                
                                <button
                                  onClick={() => updateStatus(appointment.id, 'cancelled')}
                                  className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 flex items-center gap-1 text-sm font-medium"
                                >
                                  <X className="w-4 h-4" />
                                  Cancelar
                                </button>
                              </>
                            )}
                            
                            {(appointment.status === 'completed' || appointment.status === 'cancelled' || appointment.status === 'no_show') && (
                              <>
                                {appointment.status === 'completed' && (
                                  <button
                                    onClick={() => navigate(`/prontuario/${tenantId}/${appointment.id}`)}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm font-medium"
                                  >
                                    <FileText className="w-4 h-4" />
                                    Prontuário
                                  </button>
                                )}
                                <span className="text-sm text-gray-400 italic py-1.5">
                                  Consulta finalizada
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* Modal de Detalhes do Agendamento */}
      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          tenantId={tenantId}
          onTeleconsulta={() => {
            setShowDetailsModal(false);
            navigate(`/teleconsulta/${tenantId}/${selectedAppointment.id}`);
          }}
          onConfirm={selectedAppointment.status === 'scheduled' ? async () => {
            await updateStatus(selectedAppointment.id, 'confirmed');
            setShowDetailsModal(false);
            setSelectedAppointment(null);
          } : undefined}
          onComplete={async () => {
            await updateStatus(selectedAppointment.id, 'completed');
            setShowDetailsModal(false);
            setSelectedAppointment(null);
          }}
          onNoShow={async () => {
            await updateStatus(selectedAppointment.id, 'no_show');
            setShowDetailsModal(false);
            setSelectedAppointment(null);
          }}
          onCancel={async () => {
            await updateStatus(selectedAppointment.id, 'cancelled');
            setShowDetailsModal(false);
            setSelectedAppointment(null);
          }}
          onViewProntuario={selectedAppointment.status === 'completed' ? () => {
            setShowDetailsModal(false);
            navigate(`/prontuario/${tenantId}/${selectedAppointment.id}`);
          } : undefined}
        />
      )}
      </div>
    </div>
  );
}

// ============= ADMIN APPOINTMENTS PAGE =============
function AdminAppointmentsPage() {
  const [tenantId] = useState(sessionStorage.getItem('tenantId') || '');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!tenantId) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [tenantId]);

  useEffect(() => {
    // Filtrar por status e data
    let filtered = [...allAppointments];
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter((a: any) => a.status === filterStatus);
    }
    
    if (selectedDate) {
      filtered = filtered.filter((a: any) => a.appointmentDate === selectedDate);
    }
    
    setAppointments(filtered);
  }, [filterStatus, selectedDate, allAppointments]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar pacientes
      const patientsSnapshot = await getDocs(collection(db, `tenants/${tenantId}/patients`));
      const patientsData: any[] = patientsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      // Carregar profissionais
      const profsSnapshot = await getDocs(collection(db, `tenants/${tenantId}/professionals`));
      const profsData: any[] = profsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      // Carregar TODOS os agendamentos
      const appointmentsSnapshot = await getDocs(
        collection(db, `tenants/${tenantId}/appointments`)
      );

      const appointmentsData: any[] = appointmentsSnapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          const patient = patientsData.find((p: any) => p.id === data.patientId);
          const prof = profsData.find((p: any) => p.id === data.professionalId);
          return {
            id: docSnap.id,
            appointmentDate: data.appointmentDate,
            startTime: data.startTime,
            endTime: data.endTime,
            status: data.status,
            patientName: patient?.name || 'N/A',
            patientPhone: patient?.phone || '',
            professionalName: prof?.name || 'N/A'
          };
        })
        .sort((a: any, b: any) => {
          // Ordenar por data (mais recente primeiro) e depois por horário
          const dateCompare = b.appointmentDate.localeCompare(a.appointmentDate);
          if (dateCompare !== 0) return dateCompare;
          return a.startTime.localeCompare(b.startTime);
        });

      setAllAppointments(appointmentsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, `tenants/${tenantId}/appointments`, appointmentId), {
        status: newStatus
      });
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activePage="appointments" />

      <div className="ml-64 p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Agendamentos</h1>
            <p className="text-gray-600 mt-1">
              {appointments.length} agendamento(s) encontrado(s)
              {selectedDate && ` para ${format(new Date(selectedDate + 'T12:00:00'), "dd/MM/yyyy")}`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="scheduled">Agendado</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
              <option value="no_show">Não Compareceu</option>
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Limpar Data
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum agendamento encontrado</h3>
            <p className="text-gray-500">
              {selectedDate || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros para ver mais resultados' 
                : 'Ainda não há agendamentos cadastrados'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profissional</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment: any) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium">
                        {format(new Date(appointment.appointmentDate + 'T12:00:00'), "dd/MM/yyyy")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-700">{appointment.startTime} - {appointment.endTime}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        {appointment.patientPhone && (
                          <p className="text-sm text-gray-500">{appointment.patientPhone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{appointment.professionalName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => {
                              const href = window.location.href;
                              const hashIndex = href.indexOf('#');
                              const baseUrl = hashIndex > -1 ? href.substring(0, hashIndex) : href;
                              const link = `${baseUrl}#/teleconsulta/${tenantId}/${appointment.id}`;
                              navigator.clipboard.writeText(link);
                              alert('Link da teleconsulta copiado!');
                            }}
                            className="text-purple-600 hover:bg-purple-50 px-2 py-1 rounded text-sm flex items-center gap-1"
                            title="Copiar link da teleconsulta"
                          >
                            <Video className="w-3 h-3" />
                            Link
                          </button>
                          {appointment.status === 'scheduled' && (
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                              className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-sm"
                            >
                              Confirmar
                            </button>
                          )}
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                            className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-sm"
                          >
                            Concluir
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                            className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============= PORTAL FINANCEIRO =============
function BillingPage() {
  const navigate = useNavigate();
  const [tenantId] = useState(sessionStorage.getItem('tenantId') || '');
  const [loading, setLoading] = useState(true);
  const [billingService, setBillingService] = useState<BillingService | null>(null);
  const [currentBill, setCurrentBill] = useState<{
    professionalsCount: number;
    pricePerProfessional: number;
    totalAmount: number;
    currency: string;
  } | null>(null);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<{
    isActive: boolean;
    hasOverdue: boolean;
    overdueAmount: number;
    overdueCount: number;
  } | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  useEffect(() => {
    if (!tenantId) {
      navigate('/admin/login');
      return;
    }
    initializeBilling();
  }, [tenantId]);

  const initializeBilling = async () => {
    setLoading(true);
    try {
      const service = new BillingService(tenantId);
      setBillingService(service);

      // Carregar dados em paralelo
      const [bill, profs, allInvoices, status] = await Promise.all([
        service.calculateCurrentBill(),
        service.getActiveProfessionals(),
        service.getAllInvoices(),
        service.checkPaymentStatus()
      ]);

      setCurrentBill(bill);
      setProfessionals(profs);
      setInvoices(allInvoices);
      setPaymentStatus(status);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!billingService) return;
    
    setGeneratingInvoice(true);
    try {
      await billingService.generateInvoice();
      await initializeBilling(); // Recarregar dados
      alert('Fatura gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar fatura:', error);
      alert('Erro ao gerar fatura');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    const colors = BillingService.getStatusColor(status);
    return `${colors.bg} ${colors.text}`;
  };

  const getStatusLabel = (status: Invoice['status']) => {
    return BillingService.getStatusColor(status).label;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar activePage="billing" />
        <div className="ml-64 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activePage="billing" />

      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Portal Financeiro</h1>
          <p className="text-gray-600 mt-1">Gerencie suas faturas e acompanhe os custos do sistema</p>
        </div>

        {/* Alert for overdue payments */}
        {paymentStatus?.hasOverdue && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Atenção: Faturas em Atraso</h3>
              <p className="text-red-700">
                Você possui {paymentStatus.overdueCount} fatura(s) em atraso totalizando{' '}
                <strong>{BillingService.formatCurrency(paymentStatus.overdueAmount)}</strong>.
                {' '}Regularize para evitar suspensão do serviço.
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{currentBill?.professionalsCount || 0}</span>
            </div>
            <p className="text-gray-600">Profissionais Ativos</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xl font-bold text-gray-800">
                {BillingService.formatCurrency(currentBill?.pricePerProfessional || 0)}
              </span>
            </div>
            <p className="text-gray-600">Valor por Profissional</p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">
                {BillingService.formatCurrency(currentBill?.totalAmount || 0)}
              </span>
            </div>
            <p className="text-white/80">Total da Próxima Fatura</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                paymentStatus?.isActive ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Building className="w-6 h-6" style={{ color: paymentStatus?.isActive ? '#059669' : '#DC2626' }} />
              </div>
              <span className={`text-lg font-bold ${paymentStatus?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {paymentStatus?.isActive ? 'Ativo' : 'Suspenso'}
              </span>
            </div>
            <p className="text-gray-600">Status da Conta</p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Calculation Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold">Cálculo da Mensalidade</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Profissionais Ativos</span>
                <span className="font-semibold">{currentBill?.professionalsCount}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Valor Unitário</span>
                <span className="font-semibold">{BillingService.formatCurrency(currentBill?.pricePerProfessional || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Fórmula</span>
                <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                  {currentBill?.professionalsCount} × R$ 39,90
                </span>
              </div>
              <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg px-4 -mx-4">
                <span className="text-lg font-semibold text-gray-800">Total Mensal</span>
                <span className="text-2xl font-bold text-blue-600">
                  {BillingService.formatCurrency(currentBill?.totalAmount || 0)}
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerateInvoice}
              disabled={generatingInvoice}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generatingInvoice ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Gerar Fatura do Mês Atual
                </>
              )}
            </button>
          </div>

          {/* Active Professionals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-semibold">Profissionais Ativos ({professionals.length})</h2>
            </div>
            
            {professionals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum profissional ativo</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {professionals.map((prof) => (
                  <div key={prof.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{prof.name}</p>
                        <p className="text-sm text-gray-500">{prof.email}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {BillingService.formatCurrency(39.90)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Invoice History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-purple-600" />
              <h2 className="text-lg font-semibold">Histórico de Faturas</h2>
            </div>
          </div>
          
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma fatura gerada</h3>
              <p>Clique em "Gerar Fatura do Mês Atual" para criar sua primeira fatura</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referência</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profissionais</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium capitalize">
                          {BillingService.formatReferenceMonth(invoice.referenceMonth)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-700">{invoice.professionalsCount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-800">
                          {BillingService.formatCurrency(invoice.totalAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-600">
                          {new Date(invoice.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invoice.status === 'pending' || invoice.status === 'overdue' ? (
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Pagar Agora
                          </button>
                        ) : invoice.status === 'paid' ? (
                          <span className="text-green-600 text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Pago
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Webhook Info (for developers) */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Integração de Pagamento (Webhook)</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Configure seu gateway de pagamento para enviar confirmações para o endpoint abaixo:
          </p>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <p className="text-green-400">POST /api/webhooks/payment</p>
            <p className="text-gray-500 mt-2">// Payload esperado:</p>
            <pre className="text-yellow-300 mt-1">{`{
  "tenantId": "${tenantId}",
  "invoiceId": "tenant_2024-01",
  "paymentId": "pay_xxx",
  "paymentMethod": "pix",
  "amount": ${currentBill?.totalAmount || 0},
  "status": "approved"
}`}</pre>
          </div>
          <p className="text-gray-400 mt-4 text-sm">
            💡 Integrações suportadas: Stripe, PagSeguro, Mercado Pago, Asaas, Gerencianet
          </p>
        </div>
      </div>
    </div>
  );
}

// ============= DISPONIBILIDADE DO PROFISSIONAL (SELF) =============
function ProfessionalAvailabilityPage() {
  const navigate = useNavigate();
  const tenantId = sessionStorage.getItem('tenantId') || '';
  const professionalId = sessionStorage.getItem('professionalId') || '';

  if (!professionalId || !tenantId) {
    navigate('/profissional/login');
    return null;
  }

  return <AvailabilityPage />;
}

// ============= SETUP MASTER ADMIN (TEMPORÁRIO) =============
function SetupMasterAdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const setupMasterAdmin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // UID do usuário que você criou no Firebase Auth
      const masterAdminUid = 'srA2uB5SKjfie8zhctNQhVsOmVi2';
      
      // Verificar se já existe
      const existingDoc = await getDoc(doc(db, 'masterAdmins', masterAdminUid));
      
      if (existingDoc.exists()) {
        setError('Master Admin já está configurado! Você pode fazer login.');
        setTimeout(() => navigate('/master/login'), 2000);
        return;
      }
      
      // Criar documento do Master Admin
      await setDoc(doc(db, 'masterAdmins', masterAdminUid), {
        uid: masterAdminUid,
        email: 'admin@agendai.com.br',
        name: 'Administrador Master',
        isMasterAdmin: true,
        createdAt: serverTimestamp()
      });
      
      setDone(true);
      setTimeout(() => navigate('/master/login'), 3000);
    } catch (err: any) {
      console.error('Erro ao configurar:', err);
      setError('Erro ao configurar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Setup Master Admin</h1>
        <p className="text-gray-600 mb-6">
          Configure o primeiro administrador master do sistema.
        </p>
        
        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">Master Admin configurado com sucesso!</p>
            <p className="text-green-600 text-sm mt-1">Redirecionando para login...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4 text-left">
            <p className="text-purple-700 font-medium mb-2">Será criado:</p>
            <ul className="text-purple-600 text-sm space-y-1">
              <li>• Email: admin@agendai.com.br</li>
              <li>• UID: srA2uB5SKjfie8zhctNQhVsOmVi2</li>
              <li>• Permissão: Master Admin</li>
            </ul>
          </div>
        )}
        
        {!done && (
          <button
            onClick={setupMasterAdmin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Configurar Master Admin
              </>
            )}
          </button>
        )}
        
        <p className="text-xs text-gray-400 mt-6">
          ⚠️ Esta página deve ser removida após a configuração inicial.
        </p>
      </div>
    </div>
  );
}

// ============= PORTAL MASTER ADMIN =============
function MasterAdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      const masterService = new MasterAdminService();
      const isMaster = await masterService.isMasterAdmin(user.uid);
      
      if (isMaster) {
        sessionStorage.setItem('masterAdminId', user.uid);
        sessionStorage.setItem('isMasterAdmin', 'true');
        navigate('/master/dashboard');
      } else {
        await signOut(auth);
        throw new Error('Acesso não autorizado. Apenas Master Admins podem acessar.');
      }
    } catch (error: any) {
      console.error(error);
      setError(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Master Admin</h1>
          <p className="text-gray-500 mt-2">Portal de Gestão AgendAí</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="master@agendai.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm flex items-center">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-semibold text-lg"
          >
            {loading ? 'Entrando...' : 'Acessar Portal Master'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============= MASTER ADMIN DASHBOARD =============
function MasterAdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [masterService] = useState(() => new MasterAdminService());
  const [tenants, setTenants] = useState<TenantWithBilling[]>([]);
  const [summary, setSummary] = useState({
    totalTenants: 0,
    activeTenants: 0,
    blockedTenants: 0,
    totalProfessionals: 0,
    monthlyRevenue: 0,
    overdueTotal: 0,
    pendingInvoices: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState<TenantWithBilling | null>(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [tenantAdmins, setTenantAdmins] = useState<any[]>([]);
  const [tenantInvoices, setTenantInvoices] = useState<Invoice[]>([]);
  const [actionLoading, setActionLoading] = useState('');
  const [runningCron, setRunningCron] = useState(false);

  useEffect(() => {
    const isMaster = sessionStorage.getItem('isMasterAdmin');
    if (!isMaster) {
      navigate('/master/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tenantsData, summaryData] = await Promise.all([
        masterService.getAllTenantsWithBilling(),
        masterService.getSystemSummary()
      ]);
      setTenants(tenantsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockTenant = async (tenantId: string) => {
    if (!confirm('Tem certeza que deseja BLOQUEAR esta clínica?')) return;
    setActionLoading(tenantId);
    try {
      await masterService.blockTenant(tenantId, 'Bloqueio manual pelo Master Admin');
      await loadData();
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setActionLoading('');
    }
  };

  const handleUnblockTenant = async (tenantId: string) => {
    if (!confirm('Tem certeza que deseja DESBLOQUEAR esta clínica?')) return;
    setActionLoading(tenantId);
    try {
      await masterService.unblockTenant(tenantId);
      await loadData();
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setActionLoading('');
    }
  };

  const handleResetPassword = async (email: string, tenantId: string) => {
    if (!confirm(`Enviar email de reset de senha para ${email}?`)) return;
    try {
      await masterService.resetAdminPassword(tenantId, email);
      alert('Email de reset de senha enviado com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao enviar email de reset');
    }
  };

  const handleGeneratePix = async (tenantId: string, invoiceId: string) => {
    try {
      const pixCode = await masterService.generatePixForInvoice(tenantId, invoiceId);
      navigator.clipboard.writeText(pixCode);
      alert('PIX Copia e Cola gerado e copiado para a área de transferência!');
      // Recarregar faturas
      const invoices = await masterService.getTenantInvoices(tenantId);
      setTenantInvoices(invoices);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar PIX');
    }
  };

  const handleMarkAsPaid = async (tenantId: string, invoiceId: string) => {
    if (!confirm('Marcar esta fatura como PAGA?')) return;
    try {
      await masterService.markInvoiceAsPaid(tenantId, invoiceId, 'manual');
      alert('Fatura marcada como paga!');
      // Recarregar
      const invoices = await masterService.getTenantInvoices(tenantId);
      setTenantInvoices(invoices);
      await loadData();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao processar pagamento');
    }
  };

  const handleGenerateInvoice = async (tenantId: string) => {
    try {
      await masterService.generateInvoiceForTenant(tenantId);
      alert('Fatura gerada com sucesso!');
      const invoices = await masterService.getTenantInvoices(tenantId);
      setTenantInvoices(invoices);
      await loadData();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar fatura');
    }
  };

  const handleRunCron = async () => {
    if (!confirm('Executar fechamento mensal para TODAS as clínicas?')) return;
    setRunningCron(true);
    try {
      const result = await runMonthlyBillingClosure();
      alert(`Fechamento concluído!\n\nProcessados: ${result.tenantsProcessed}\nFaturas geradas: ${result.invoicesGenerated}\nTotal: R$ ${result.totalAmount.toFixed(2)}\nErros: ${result.errors.length}`);
      await loadData();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao executar fechamento');
    } finally {
      setRunningCron(false);
    }
  };

  const openTenantDetails = async (tenant: TenantWithBilling) => {
    setSelectedTenant(tenant);
    setShowTenantModal(true);
    
    try {
      const [admins, invoices] = await Promise.all([
        masterService.getTenantAdmins(tenant.id),
        masterService.getTenantInvoices(tenant.id)
      ]);
      setTenantAdmins(admins);
      setTenantInvoices(invoices);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.clear();
    navigate('/');
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || tenant.subscriptionStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'overdue': return 'bg-orange-100 text-orange-700';
      case 'blocked': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Atrasado';
      case 'blocked': return 'Bloqueado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-purple-500" />
              <span className="text-xl font-bold text-white">Master Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRunCron}
                disabled={runningCron}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <BarChart3 className="w-4 h-4" />
                {runningCron ? 'Processando...' : 'Fechamento Mensal'}
              </button>
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Clínicas</p>
            <p className="text-2xl font-bold text-white">{summary.totalTenants}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Ativas</p>
            <p className="text-2xl font-bold text-green-400">{summary.activeTenants}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Bloqueadas</p>
            <p className="text-2xl font-bold text-red-400">{summary.blockedTenants}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Profissionais</p>
            <p className="text-2xl font-bold text-blue-400">{summary.totalProfessionals}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Receita Mensal</p>
            <p className="text-xl font-bold text-green-400">
              {BillingService.formatCurrency(summary.monthlyRevenue)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Em Atraso</p>
            <p className="text-xl font-bold text-orange-400">
              {BillingService.formatCurrency(summary.overdueTotal)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Faturas Pend.</p>
            <p className="text-2xl font-bold text-yellow-400">{summary.pendingInvoices}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, CNPJ ou subdomínio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="pending">Pendente</option>
              <option value="overdue">Atrasado</option>
              <option value="blocked">Bloqueado</option>
            </select>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Clínica</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Profissionais</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Valor Mensal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Em Atraso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <Building className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                      <p>Nenhuma clínica encontrada</p>
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{tenant.companyName}</p>
                          <p className="text-sm text-gray-400">{tenant.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{tenant.cnpj || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="text-blue-400 font-semibold">{tenant.professionalsCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-400 font-semibold">
                          {BillingService.formatCurrency(tenant.currentMonthAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {tenant.overdueAmount > 0 ? (
                          <span className="text-orange-400 font-semibold">
                            {BillingService.formatCurrency(tenant.overdueAmount)}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tenant.subscriptionStatus)}`}>
                          {getStatusLabel(tenant.subscriptionStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openTenantDetails(tenant)}
                            className="text-purple-400 hover:text-purple-300 p-1"
                            title="Ver detalhes"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {tenant.subscriptionStatus === 'blocked' ? (
                            <button
                              onClick={() => handleUnblockTenant(tenant.id)}
                              disabled={actionLoading === tenant.id}
                              className="text-green-400 hover:text-green-300 p-1 disabled:opacity-50"
                              title="Desbloquear"
                            >
                              <Unlock className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlockTenant(tenant.id)}
                              disabled={actionLoading === tenant.id}
                              className="text-red-400 hover:text-red-300 p-1 disabled:opacity-50"
                              title="Bloquear"
                            >
                              <Lock className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tenant Details Modal */}
      {showTenantModal && selectedTenant && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedTenant.companyName}</h2>
                <p className="text-gray-400 text-sm">{selectedTenant.id}</p>
              </div>
              <button
                onClick={() => setShowTenantModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTenant.subscriptionStatus)}`}>
                    {getStatusLabel(selectedTenant.subscriptionStatus)}
                  </span>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Profissionais</p>
                  <p className="text-2xl font-bold text-blue-400">{selectedTenant.professionalsCount}</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Valor Mensal</p>
                  <p className="text-xl font-bold text-green-400">
                    {BillingService.formatCurrency(selectedTenant.currentMonthAmount)}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Em Atraso</p>
                  <p className="text-xl font-bold text-orange-400">
                    {BillingService.formatCurrency(selectedTenant.overdueAmount)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {selectedTenant.subscriptionStatus === 'blocked' ? (
                  <button
                    onClick={() => handleUnblockTenant(selectedTenant.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    Desbloquear Clínica
                  </button>
                ) : (
                  <button
                    onClick={() => handleBlockTenant(selectedTenant.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Bloquear Clínica
                  </button>
                )}
                <button
                  onClick={() => handleGenerateInvoice(selectedTenant.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Gerar Fatura
                </button>
              </div>

              {/* Admins */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Administradores
                </h3>
                <div className="bg-gray-900 rounded-lg divide-y divide-gray-800">
                  {tenantAdmins.length === 0 ? (
                    <p className="p-4 text-gray-400">Nenhum administrador encontrado</p>
                  ) : (
                    tenantAdmins.map((admin) => (
                      <div key={admin.id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-white">{admin.name}</p>
                          <p className="text-sm text-gray-400">{admin.email}</p>
                        </div>
                        <button
                          onClick={() => handleResetPassword(admin.email, selectedTenant.id)}
                          className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm"
                        >
                          <Key className="w-4 h-4" />
                          Reset Senha
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Invoices */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-green-400" />
                  Faturas
                </h3>
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-950">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Referência</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Valor</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Vencimento</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {tenantInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                            Nenhuma fatura encontrada
                          </td>
                        </tr>
                      ) : (
                        tenantInvoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-gray-800">
                            <td className="px-4 py-3 text-white capitalize">
                              {BillingService.formatReferenceMonth(invoice.referenceMonth)}
                            </td>
                            <td className="px-4 py-3 text-green-400 font-semibold">
                              {BillingService.formatCurrency(invoice.totalAmount)}
                            </td>
                            <td className="px-4 py-3 text-gray-300">
                              {new Date(invoice.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                invoice.status === 'paid' ? 'bg-green-900 text-green-300' :
                                invoice.status === 'overdue' ? 'bg-red-900 text-red-300' :
                                invoice.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                                'bg-gray-700 text-gray-300'
                              }`}>
                                {BillingService.getStatusColor(invoice.status).label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleGeneratePix(selectedTenant.id, invoice.id)}
                                    className="text-blue-400 hover:text-blue-300 text-sm"
                                  >
                                    Gerar PIX
                                  </button>
                                  <button
                                    onClick={() => handleMarkAsPaid(selectedTenant.id, invoice.id)}
                                    className="text-green-400 hover:text-green-300 text-sm"
                                  >
                                    Marcar Pago
                                  </button>
                                </div>
                              )}
                              {invoice.status === 'paid' && (
                                <span className="text-green-400 text-sm flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  Pago
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border border-red-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Zona de Perigo
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Atenção: Esta ação é irreversível e deletará todos os dados da clínica.
                </p>
                <button
                  onClick={async () => {
                    if (prompt(`Digite "${selectedTenant.id}" para confirmar a exclusão:`) === selectedTenant.id) {
                      try {
                        await masterService.deleteTenant(selectedTenant.id);
                        alert('Clínica deletada com sucesso');
                        setShowTenantModal(false);
                        loadData();
                      } catch (error) {
                        alert('Erro ao deletar clínica');
                      }
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar Clínica Permanentemente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============= APP PRINCIPAL =============
export function App() {
  return (
    <Router>
      <Routes>
        {/* Páginas Públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/cadastro" element={<TenantRegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/profissional/login" element={<ProfessionalLoginPage />} />
        
        {/* Página de Agendamento do Paciente */}
        <Route path="/clinica/:tenantId/agendar" element={<PublicBookingPage />} />
        
        {/* Área Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/especialidades" element={<SpecialtiesPage />} />
        <Route path="/admin/profissionais" element={<ProfessionalsPage />} />
        <Route path="/admin/profissionais/:professionalId/disponibilidade" element={<AvailabilityPage />} />
        <Route path="/admin/agendamentos" element={<AdminAppointmentsPage />} />
        <Route path="/admin/configuracoes" element={<SettingsPage />} />
        <Route path="/admin/financeiro" element={<BillingPage />} />
        
        {/* Área Profissional */}
        <Route path="/profissional/agenda" element={<ProfessionalAgendaPage />} />
        <Route path="/profissional/disponibilidade" element={<ProfessionalAvailabilityPage />} />
        <Route path="/profissional/pacientes" element={<ProfessionalPatientsPage />} />

        {/* Teleconsulta */}
        <Route path="/teleconsulta/:tenantId/:appointmentId" element={<TeleconsultaSplitScreen />} />
        
        {/* Prontuário */}
        <Route path="/prontuario/:tenantId/:appointmentId" element={<MedicalRecordPage />} />
        
        {/* Master Admin */}
        <Route path="/master/setup" element={<SetupMasterAdminPage />} />
        <Route path="/master/login" element={<MasterAdminLoginPage />} />
        <Route path="/master/dashboard" element={<MasterAdminDashboard />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
