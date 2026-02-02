# Guia de Teste da Teleconsulta

## Pré-requisitos

1. **HTTPS ou localhost**: O navegador só permite acesso à câmera/microfone em HTTPS ou localhost
2. **Câmera e microfone funcionando**
3. **Permissões do navegador** para acessar câmera/microfone

## Como Testar

### Opção 1: Usar 2 Janelas/Abas do Navegador

1. **Janela 1 - Profissional:**
   - Faça login como profissional: `/#/profissional/login`
   - Vá para a agenda: `/#/profissional/agenda`
   - Clique em "Teleconsulta" em um agendamento
   - Informe seu nome e clique "Iniciar Consulta"
   - Copie o link

2. **Janela 2 - Paciente:**
   - Cole o link copiado em uma nova aba/janela
   - Informe seu nome e clique "Entrar na Consulta"
   - Aguarde a conexão ser estabelecida

### Opção 2: Usar 2 Dispositivos Diferentes

1. **Dispositivo 1 (Profissional):**
   - Acesse o sistema e faça login como profissional
   - Inicie a teleconsulta
   - Copie o link e envie para o outro dispositivo

2. **Dispositivo 2 (Paciente):**
   - Abra o link recebido
   - Informe seu nome e entre na consulta

## O que Esperar

### Estados da Conexão:

1. **Inicializando câmera...** - O navegador está solicitando acesso à câmera/microfone
2. **Aguardando paciente...** - O profissional está esperando o paciente entrar
3. **Conectando...** - A conexão P2P está sendo estabelecida
4. **Conectado** (bola verde pulsando) - A chamada está ativa

### Debug no Console:

Abra o Console do navegador (F12) para ver os logs:

```
[12:34:56] [Teleconsulta] Carregando dados do agendamento...
[12:34:56] [Teleconsulta] Dados carregados com sucesso
[12:34:57] [Teleconsulta] Iniciando entrada na chamada... {userName: "Dr. João", userRole: "professional"}
[12:34:57] [Teleconsulta] Inicializando mídia...
[12:34:58] [Teleconsulta] Mídia inicializada com vídeo e áudio
[12:34:58] [Teleconsulta] Criando PeerConnection...
[12:34:58] [Teleconsulta] Adicionando track local: video
[12:34:58] [Teleconsulta] Adicionando track local: audio
[12:34:58] [Teleconsulta] Sala não existe, criando...
[12:34:58] [Teleconsulta] Criando oferta SDP...
[12:34:58] [Teleconsulta] Setando local description...
[12:34:58] [Teleconsulta] Sala criada, aguardando participante...
```

## Problemas Comuns

### 1. "Erro ao acessar câmera/microfone"
- Verifique se permitiu o acesso no navegador
- Clique no ícone de câmera na barra de endereço
- Verifique se outro aplicativo está usando a câmera

### 2. Fica em "Conectando..." infinitamente
- Verifique sua conexão com a internet
- Tente em uma rede diferente (o firewall pode estar bloqueando)
- Verifique se ambos os participantes estão na mesma sala

### 3. Vídeo remoto não aparece
- Verifique se o outro participante permitiu a câmera
- Aguarde alguns segundos para a conexão estabilizar
- Verifique o console para erros

### 4. Áudio não funciona
- Verifique se o microfone está ligado (ícone azul)
- Verifique o volume do sistema
- Teste o microfone em outro aplicativo

## Estrutura do Firestore

A teleconsulta cria documentos no Firestore em:

```
videoCalls/
  {tenantId}_{appointmentId}/
    - offer: { type, sdp }
    - answer: { type, sdp }
    - creatorName: "Dr. João"
    - joinerName: "Maria"
    - status: "waiting" | "active" | "ended"
    - createdAt: timestamp
    
    callerCandidates/
      {candidateId}/
        - candidate, sdpMid, sdpMLineIndex, etc.
    
    calleeCandidates/
      {candidateId}/
        - candidate, sdpMid, sdpMLineIndex, etc.
```

## Regras do Firestore Necessárias

Certifique-se de que as regras do Firestore permitem leitura/escrita em `videoCalls`:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // ... outras regras ...
    
    // Teleconsulta
    match /videoCalls/{callId} {
      allow read, write: if true;
      
      match /{subcol}/{docId} {
        allow read, write: if true;
      }
    }
  }
}
```

## Fluxo Técnico

```
PROFISSIONAL                          FIRESTORE                          PACIENTE
     |                                     |                                 |
     |-- Criar PeerConnection -------------|                                 |
     |-- Criar Offer SDP ------------------|                                 |
     |-- Salvar Offer no Firestore ------->|                                 |
     |                                     |                                 |
     |                                     |<------ Buscar sala existente ---|
     |                                     |------- Retornar Offer --------->|
     |                                     |                                 |
     |                                     |                 Setar Remote Description
     |                                     |                 Criar Answer SDP
     |                                     |<------ Salvar Answer ----------|
     |                                     |                                 |
     |<---- Receber Answer ----------------|                                 |
     |   Setar Remote Description          |                                 |
     |                                     |                                 |
     |-- ICE Candidate ------------------->|<------ ICE Candidate ----------|
     |<---- ICE Candidate -----------------|------> ICE Candidate ---------->|
     |                                     |                                 |
     |<=============== CONEXÃO P2P ESTABELECIDA =========================>|
     |                                     |                                 |
     |<======================== VÍDEO/ÁUDIO ===========================>|
```

## Suporte

Se continuar com problemas:

1. Verifique o console do navegador (F12)
2. Verifique as regras do Firestore
3. Teste em uma rede diferente
4. Certifique-se de que está usando HTTPS em produção
