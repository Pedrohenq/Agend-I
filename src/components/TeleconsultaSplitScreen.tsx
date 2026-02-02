import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Copy,
  Check,
  Users,
  FileText,
  Maximize2,
  Minimize2,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { db } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  updateDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import MedicalRecordForm from './MedicalRecordForm';

// Configuração ICE Servers
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // TURN servers gratuitos para desenvolvimento
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

type ConnectionState = 'idle' | 'initializing' | 'waiting' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'ended';

export default function TeleconsultaSplitScreen() {
  const { tenantId, appointmentId } = useParams();
  const navigate = useNavigate();

  // Estados de mídia
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Estados de conexão
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  // Estados do prontuário
  const [showMedicalRecord, setShowMedicalRecord] = useState(true);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);

  // Dados do agendamento
  const [appointment, setAppointment] = useState<any>(null);
  const [professional, setProfessional] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [userRole, setUserRole] = useState<'professional' | 'patient'>('patient');
  const [userName, setUserName] = useState('');
  const [remoteName, setRemoteName] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(true);

  // Timer
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const unsubscribersRef = useRef<Unsubscribe[]>([]);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const hasRemoteDescriptionRef = useRef(false);
  const roomIdRef = useRef<string>('');

  // Copiar link
  const [linkCopied, setLinkCopied] = useState(false);

  // Logging
  const log = useCallback((message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    if (data) {
      console.log(`[${timestamp}] [Teleconsulta] ${message}`, data);
    } else {
      console.log(`[${timestamp}] [Teleconsulta] ${message}`);
    }
  }, []);

  // Carregar dados do agendamento
  useEffect(() => {
    loadAppointmentData();
    return () => {
      cleanup();
    };
  }, [tenantId, appointmentId]);

  // Timer da chamada
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && connectionState === 'connected') {
      interval = setInterval(() => {
        const now = new Date();
        setDuration(Math.floor((now.getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, connectionState]);

  // Atualizar video refs quando streams mudam
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const loadAppointmentData = async () => {
    if (!tenantId || !appointmentId) return;

    try {
      log('Carregando dados do agendamento...');
      
      // Carregar agendamento
      const appointmentDoc = await getDoc(doc(db, `tenants/${tenantId}/appointments`, appointmentId));
      if (!appointmentDoc.exists()) {
        setError('Agendamento não encontrado');
        setConnectionState('error');
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

      // Carregar profissional
      const profDoc = await getDoc(doc(db, `tenants/${tenantId}/professionals`, appointmentData.professionalId));
      const profData = profDoc.exists() ? profDoc.data() : null;
      if (profData) {
        setProfessional({ id: profDoc.id, ...profData });
      }

      // Carregar paciente
      const patientDoc = await getDoc(doc(db, `tenants/${tenantId}/patients`, appointmentData.patientId));
      if (patientDoc.exists()) {
        const patientDocData = patientDoc.data();
        const patientData = { id: patientDoc.id, name: patientDocData.name as string, ...patientDocData };
        setPatient(patientData);
        
        // Verificar se é profissional logado
        const loggedProfId = sessionStorage.getItem('professionalId');
        if (loggedProfId === appointmentData.professionalId) {
          setUserRole('professional');
          setUserName(profData?.name || 'Profissional');
          setShowMedicalRecord(true);
          log('Usuário é o profissional');
        } else {
          setUserName(patientData.name || '');
          setShowMedicalRecord(false);
          log('Usuário é o paciente');
        }
      }
      
      log('Dados carregados com sucesso');
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados do agendamento');
      setConnectionState('error');
    }
  };

  const cleanup = () => {
    log('Limpando recursos...');
    
    // Parar tracks locais
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        log(`Track ${track.kind} parado`);
      });
      localStreamRef.current = null;
    }
    
    // Fechar peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Cancelar listeners
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];
    
    // Limpar refs
    hasRemoteDescriptionRef.current = false;
    iceCandidatesQueueRef.current = [];
  };

  const initializeMedia = async (): Promise<MediaStream> => {
    log('Inicializando mídia...');
    
    try {
      // Tentar com vídeo e áudio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      log('Mídia inicializada com vídeo e áudio');
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      return stream;
    } catch (videoError) {
      log('Falha ao obter vídeo, tentando só áudio...', videoError);
      
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        log('Mídia inicializada apenas com áudio');
        localStreamRef.current = audioStream;
        setLocalStream(audioStream);
        setIsVideoEnabled(false);
        setIsAudioEnabled(true);
        return audioStream;
      } catch (audioError) {
        log('Falha ao obter áudio', audioError);
        throw new Error('Não foi possível acessar câmera ou microfone. Por favor, permita o acesso nas configurações do navegador.');
      }
    }
  };

  const createPeerConnection = (stream: MediaStream): RTCPeerConnection => {
    log('Criando PeerConnection...');
    
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    // Adicionar tracks locais
    stream.getTracks().forEach(track => {
      log(`Adicionando track local: ${track.kind}`);
      pc.addTrack(track, stream);
    });
    
    // Handler para tracks remotos
    pc.ontrack = (event) => {
      log('Track remoto recebido:', event.track.kind);
      
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        // Criar stream se não existir
        const newStream = new MediaStream();
        newStream.addTrack(event.track);
        setRemoteStream(newStream);
      }
    };
    
    // Estado ICE
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      log(`ICE Connection State: ${state}`);
      
      switch (state) {
        case 'checking':
          setConnectionState('connecting');
          break;
        case 'connected':
        case 'completed':
          setConnectionState('connected');
          if (!startTime) {
            setStartTime(new Date());
          }
          break;
        case 'disconnected':
          log('Conexão ICE desconectada, aguardando reconexão...');
          setConnectionState('reconnecting');
          break;
        case 'failed':
          log('Conexão ICE falhou');
          setError('Conexão perdida. Por favor, recarregue a página.');
          setConnectionState('error');
          break;
        case 'closed':
          setConnectionState('ended');
          break;
      }
    };
    
    // Estado da conexão
    pc.onconnectionstatechange = () => {
      log(`Connection State: ${pc.connectionState}`);
      
      if (pc.connectionState === 'connected') {
        setConnectionState('connected');
        if (!startTime) {
          setStartTime(new Date());
        }
      } else if (pc.connectionState === 'failed') {
        setError('Falha na conexão. Por favor, recarregue a página.');
        setConnectionState('error');
      }
    };
    
    // Estado de sinalização
    pc.onsignalingstatechange = () => {
      log(`Signaling State: ${pc.signalingState}`);
    };
    
    // ICE Gathering State
    pc.onicegatheringstatechange = () => {
      log(`ICE Gathering State: ${pc.iceGatheringState}`);
    };
    
    peerConnectionRef.current = pc;
    return pc;
  };

  const processIceCandidateQueue = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !hasRemoteDescriptionRef.current) return;
    
    log(`Processando ${iceCandidatesQueueRef.current.length} ICE candidates em fila`);
    
    while (iceCandidatesQueueRef.current.length > 0) {
      const candidate = iceCandidatesQueueRef.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          log('ICE candidate da fila adicionado');
        } catch (err) {
          console.warn('Erro ao adicionar ICE candidate:', err);
        }
      }
    }
  };

  const addIceCandidate = async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    
    if (hasRemoteDescriptionRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        log('ICE candidate remoto adicionado');
      } catch (err) {
        console.warn('Erro ao adicionar ICE candidate:', err);
      }
    } else {
      log('Remote description não setada, colocando candidate na fila');
      iceCandidatesQueueRef.current.push(candidate);
    }
  };

  const joinCall = async () => {
    if (!userName.trim()) {
      alert('Por favor, informe seu nome');
      return;
    }

    if (!tenantId || !appointmentId) {
      setError('Dados da consulta não encontrados');
      setConnectionState('error');
      return;
    }

    setShowJoinModal(false);
    setConnectionState('initializing');
    log('Iniciando entrada na chamada...', { userName, userRole });

    try {
      // Inicializar mídia
      const stream = await initializeMedia();
      
      // Criar peer connection
      const pc = createPeerConnection(stream);
      
      // Referência da sala no Firestore
      const roomId = `${tenantId}_${appointmentId}`;
      roomIdRef.current = roomId;
      const roomRef = doc(db, 'videoCalls', roomId);
      
      // Verificar se sala existe
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        // CRIAR SALA (Primeiro participante - geralmente profissional)
        log('Sala não existe, criando...');
        setIsCreator(true);
        
        // Configurar handler de ICE candidates ANTES de criar oferta
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            log('ICE candidate local gerado (criador)');
            try {
              await addDoc(collection(db, 'videoCalls', roomId, 'callerCandidates'), 
                event.candidate.toJSON()
              );
            } catch (err) {
              console.warn('Erro ao salvar ICE candidate:', err);
            }
          } else {
            log('ICE gathering completo (criador)');
          }
        };
        
        // Criar oferta
        log('Criando oferta SDP...');
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        
        log('Setando local description...');
        await pc.setLocalDescription(offer);
        
        // Salvar sala no Firestore
        await setDoc(roomRef, {
          offer: {
            type: offer.type,
            sdp: offer.sdp
          },
          createdBy: userRole,
          creatorName: userName,
          appointmentId,
          tenantId,
          status: 'waiting',
          createdAt: serverTimestamp()
        });
        
        log('Sala criada, aguardando participante...');
        setConnectionState('waiting');
        
        // Escutar por resposta
        const unsubRoom = onSnapshot(roomRef, async (snapshot) => {
          const data = snapshot.data();
          if (!data) return;
          
          // Atualizar nome remoto
          if (data.joinerName && !remoteName) {
            setRemoteName(data.joinerName);
          }
          
          // Processar resposta
          if (data.answer && !hasRemoteDescriptionRef.current) {
            log('Resposta SDP recebida');
            try {
              const currentPc = peerConnectionRef.current;
              if (currentPc && currentPc.signalingState === 'have-local-offer') {
                const answer = new RTCSessionDescription(data.answer);
                await currentPc.setRemoteDescription(answer);
                hasRemoteDescriptionRef.current = true;
                log('Remote description setada (answer)');
                setConnectionState('connecting');
                await processIceCandidateQueue();
              }
            } catch (err) {
              console.error('Erro ao processar resposta:', err);
            }
          }
          
          // Sala encerrada
          if (data.status === 'ended') {
            endCall();
          }
        });
        unsubscribersRef.current.push(unsubRoom);
        
        // Escutar ICE candidates do participante
        const unsubCallee = onSnapshot(
          collection(db, 'videoCalls', roomId, 'calleeCandidates'),
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                log('ICE candidate recebido do participante');
                addIceCandidate(change.doc.data());
              }
            });
          }
        );
        unsubscribersRef.current.push(unsubCallee);
        
      } else {
        // ENTRAR EM SALA EXISTENTE (Segundo participante)
        log('Sala existe, entrando...');
        setIsCreator(false);
        const roomData = roomDoc.data();
        
        if (!roomData.offer) {
          throw new Error('Sala inválida - sem oferta');
        }
        
        // Atualizar nome remoto
        if (roomData.creatorName) {
          setRemoteName(roomData.creatorName);
        }
        
        setConnectionState('connecting');
        
        // Configurar handler de ICE candidates ANTES de criar resposta
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            log('ICE candidate local gerado (participante)');
            try {
              await addDoc(collection(db, 'videoCalls', roomId, 'calleeCandidates'), 
                event.candidate.toJSON()
              );
            } catch (err) {
              console.warn('Erro ao salvar ICE candidate:', err);
            }
          } else {
            log('ICE gathering completo (participante)');
          }
        };
        
        // Setar oferta remota
        log('Setando remote description (offer)...');
        const offer = new RTCSessionDescription(roomData.offer);
        await pc.setRemoteDescription(offer);
        hasRemoteDescriptionRef.current = true;
        log('Remote description setada');
        
        // Processar candidates que chegaram antes
        await processIceCandidateQueue();
        
        // Criar resposta
        log('Criando resposta SDP...');
        const answer = await pc.createAnswer();
        
        log('Setando local description...');
        await pc.setLocalDescription(answer);
        
        // Atualizar sala com resposta
        await updateDoc(roomRef, {
          answer: {
            type: answer.type,
            sdp: answer.sdp
          },
          joinerName: userName,
          joinerRole: userRole,
          status: 'active',
          joinedAt: serverTimestamp()
        });
        
        log('Resposta enviada');
        
        // Escutar ICE candidates do criador (já existentes e novos)
        const existingCandidates = await getDocs(collection(db, 'videoCalls', roomId, 'callerCandidates'));
        existingCandidates.forEach((docSnap) => {
          log('ICE candidate existente do criador');
          addIceCandidate(docSnap.data());
        });
        
        const unsubCaller = onSnapshot(
          collection(db, 'videoCalls', roomId, 'callerCandidates'),
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                log('Novo ICE candidate do criador');
                addIceCandidate(change.doc.data());
              }
            });
          }
        );
        unsubscribersRef.current.push(unsubCaller);
        
        // Escutar mudanças na sala
        const unsubRoom = onSnapshot(roomRef, (snapshot) => {
          const data = snapshot.data();
          if (data?.status === 'ended') {
            endCall();
          }
        });
        unsubscribersRef.current.push(unsubRoom);
      }

    } catch (err: any) {
      console.error('Erro ao entrar na chamada:', err);
      setError(err.message || 'Erro ao iniciar chamada');
      setConnectionState('error');
    }
  };

  const endCall = async () => {
    log('Encerrando chamada...');
    
    // Limpar recursos
    cleanup();
    
    // Atualizar status da sala
    if (roomIdRef.current) {
      try {
        await updateDoc(doc(db, 'videoCalls', roomIdRef.current), {
          status: 'ended',
          endedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Erro ao atualizar sala:', err);
      }
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState('ended');
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        log(`Vídeo ${videoTrack.enabled ? 'ligado' : 'desligado'}`);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        log(`Áudio ${audioTrack.enabled ? 'ligado' : 'desligado'}`);
      }
    }
  };

  const copyLink = () => {
    const href = window.location.href;
    const hashIndex = href.indexOf('#');
    const baseUrl = hashIndex > -1 ? href.substring(0, hashIndex) : href;
    const link = `${baseUrl}#/teleconsulta/${tenantId}/${appointmentId}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    log('Link copiado:', link);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const retryConnection = () => {
    cleanup();
    setConnectionState('idle');
    setError(null);
    setShowJoinModal(true);
  };

  // Modal de entrada
  if (showJoinModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Video className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">
              {userRole === 'professional' ? 'Iniciar Teleconsulta' : 'Entrar na Consulta'}
            </h1>
            <p className="text-gray-600 mt-2">
              {professional?.name && patient?.name && (
                <>
                  <span className="font-medium">{professional.name}</span>
                  <span className="mx-2">•</span>
                  <span>{patient.name}</span>
                </>
              )}
            </p>
            {appointment && (
              <p className="text-sm text-gray-500 mt-1">
                {new Date(appointment.appointmentDate).toLocaleDateString('pt-BR')} às {appointment.startTime}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seu nome
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className={`p-3 rounded-lg ${userRole === 'professional' ? 'bg-blue-50' : 'bg-green-50'}`}>
              <p className={`text-sm ${userRole === 'professional' ? 'text-blue-700' : 'text-green-700'}`}>
                {userRole === 'professional' 
                  ? '🩺 Você é o profissional desta consulta'
                  : '👤 Você entrará como paciente'}
              </p>
            </div>

            <button
              onClick={joinCall}
              disabled={!userName.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center"
            >
              <Video className="w-5 h-5 mr-2" />
              {userRole === 'professional' ? 'Iniciar Consulta' : 'Entrar na Consulta'}
            </button>

            <button
              onClick={() => navigate(-1)}
              className="w-full text-gray-600 py-2 hover:text-gray-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de erro
  if (connectionState === 'error') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro na Teleconsulta</h2>
          <p className="text-gray-600 mb-6">{error || 'Ocorreu um erro inesperado'}</p>
          <div className="space-y-3">
            <button
              onClick={retryConnection}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Tentar Novamente
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full text-gray-600 py-2 hover:text-gray-800"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de chamada encerrada
  if (connectionState === 'ended') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Consulta Encerrada</h2>
          <p className="text-gray-600 mb-2">Duração: {formatDuration(duration)}</p>
          {userRole === 'professional' && (
            <p className="text-sm text-gray-500 mb-6">
              O prontuário foi salvo automaticamente. Você pode acessá-lo pela agenda.
            </p>
          )}
          <button
            onClick={() => navigate(userRole === 'professional' ? '/profissional/agenda' : '/')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            {userRole === 'professional' ? 'Voltar para Agenda' : 'Voltar ao Início'}
          </button>
        </div>
      </div>
    );
  }

  // Layout Split-Screen Principal
  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-white">
            <Video className="w-5 h-5 mr-2" />
            <span className="font-medium">Teleconsulta</span>
          </div>
          
          {connectionState === 'connected' && (
            <div className="flex items-center text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <Clock className="w-4 h-4 mr-1" />
              <span className="font-mono">{formatDuration(duration)}</span>
            </div>
          )}

          {connectionState === 'waiting' && (
            <span className="text-yellow-400 flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Aguardando {userRole === 'professional' ? 'paciente' : 'profissional'}...
            </span>
          )}

          {connectionState === 'connecting' && (
            <span className="text-blue-400 flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Conectando...
            </span>
          )}

          {connectionState === 'reconnecting' && (
            <span className="text-orange-400 flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Reconectando...
            </span>
          )}

          {connectionState === 'initializing' && (
            <span className="text-gray-400 flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Inicializando câmera...
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {saveStatus === 'saving' && (
            <span className="text-yellow-400 text-sm flex items-center">
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Salvando...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-green-400 text-sm flex items-center">
              <Check className="w-4 h-4 mr-1" />
              Salvo
            </span>
          )}

          {userRole === 'professional' && (
            <button
              onClick={() => setShowMedicalRecord(!showMedicalRecord)}
              className={`p-2 rounded-lg transition ${
                showMedicalRecord ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={showMedicalRecord ? 'Ocultar Prontuário' : 'Mostrar Prontuário'}
            >
              <FileText className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setIsVideoExpanded(!isVideoExpanded)}
            className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
            title={isVideoExpanded ? 'Reduzir Vídeo' : 'Expandir Vídeo'}
          >
            {isVideoExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content - Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Área de Vídeo */}
        <div className={`bg-gray-900 relative flex flex-col ${
          showMedicalRecord && userRole === 'professional' && !isVideoExpanded
            ? 'w-3/5'
            : 'w-full'
        } transition-all duration-300`}>
          
          {/* Vídeo Remoto */}
          <div className="flex-1 relative">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  {connectionState === 'waiting' ? (
                    <>
                      <Users className="w-20 h-20 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">
                        Aguardando {userRole === 'professional' ? 'o paciente' : 'o profissional'} entrar...
                      </p>
                      {isCreator && (
                        <button
                          onClick={copyLink}
                          className="mt-4 flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          {linkCopied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                          {linkCopied ? 'Link Copiado!' : 'Copiar Link para Paciente'}
                        </button>
                      )}
                    </>
                  ) : connectionState === 'connecting' ? (
                    <>
                      <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" />
                      <p>Estabelecendo conexão com {remoteName || 'participante'}...</p>
                    </>
                  ) : connectionState === 'initializing' ? (
                    <>
                      <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" />
                      <p>Inicializando câmera e microfone...</p>
                    </>
                  ) : connectionState === 'reconnecting' ? (
                    <>
                      <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" />
                      <p>Reconectando...</p>
                    </>
                  ) : (
                    <p>Conectando...</p>
                  )}
                </div>
              </div>
            )}

            {/* Nome do participante remoto */}
            {remoteStream && remoteName && (
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-white text-sm">
                {remoteName}
              </div>
            )}
          </div>

          {/* Vídeo Local (PIP) */}
          <div className="absolute bottom-20 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
            />
            {!isVideoEnabled && (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <VideoOff className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur px-2 py-0.5 rounded text-white text-xs">
              Você {!isAudioEnabled && '(mudo)'}
            </div>
          </div>

          {/* Controles de Mídia */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-3">
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition ${
                isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isVideoEnabled ? 'Desligar câmera' : 'Ligar câmera'}
            >
              {isVideoEnabled ? (
                <Video className="w-6 h-6 text-white" />
              ) : (
                <VideoOff className="w-6 h-6 text-white" />
              )}
            </button>

            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition ${
                isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isAudioEnabled ? 'Desligar microfone' : 'Ligar microfone'}
            >
              {isAudioEnabled ? (
                <Mic className="w-6 h-6 text-white" />
              ) : (
                <MicOff className="w-6 h-6 text-white" />
              )}
            </button>

            <button
              onClick={endCall}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition"
              title="Encerrar chamada"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Painel do Prontuário (apenas para profissional) */}
        {showMedicalRecord && userRole === 'professional' && !isVideoExpanded && appointment && appointment.patientId && appointment.professionalId && (
          <div className="w-2/5 bg-white border-l border-gray-200 overflow-hidden">
            <MedicalRecordForm
              tenantId={tenantId || ''}
              appointmentId={appointmentId || ''}
              patientId={appointment.patientId}
              professionalId={appointment.professionalId}
              isCompact={true}
              onSaveStatusChange={(status) => setSaveStatus(status)}
            />
          </div>
        )}
        
        {/* Mensagem se dados não estiverem prontos */}
        {showMedicalRecord && userRole === 'professional' && !isVideoExpanded && appointment && (!appointment.patientId || !appointment.professionalId) && (
          <div className="w-2/5 bg-white border-l border-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
              <p>Carregando dados do prontuário...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
