# Regras do Firestore para o AgendAí

## Regras Recomendadas

Cole as seguintes regras no Firebase Console: https://console.firebase.google.com/project/agendai-485bc/firestore/rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Master Admins - apenas leitura/escrita para autenticados
    match /masterAdmins/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Tenants e suas subcoleções
    match /tenants/{tenantId} {
      // Permite leitura pública do tenant
      allow read: if true;
      // Permite escrita para autenticados
      allow write: if request.auth != null;
      
      // Admins do tenant
      match /admins/{adminId} {
        allow read, write: if request.auth != null;
      }
      
      // Especialidades
      match /specialties/{specialtyId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
      
      // Profissionais
      match /professionals/{professionalId} {
        allow read: if true;
        allow write: if request.auth != null;
        
        // Disponibilidade do profissional
        match /availability/{availabilityId} {
          allow read: if true;
          allow write: if request.auth != null;
        }
        
        // Exceções de disponibilidade
        match /availabilityExceptions/{exceptionId} {
          allow read: if true;
          allow write: if request.auth != null;
        }
      }
      
      // Pacientes
      match /patients/{patientId} {
        allow read: if true;
        allow create: if true;  // Permite cadastro de paciente sem login
        allow update, delete: if request.auth != null;
      }
      
      // Agendamentos
      match /appointments/{appointmentId} {
        allow read: if true;
        allow create: if true;  // Permite criar agendamento sem login (paciente)
        allow update, delete: if request.auth != null;
      }
      
      // Prontuários Médicos
      match /medicalRecords/{recordId} {
        // Leitura e escrita: apenas autenticados
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
      
      // Faturas
      match /invoices/{invoiceId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
      
      // Chamadas de Vídeo
      match /videoCalls/{callId} {
        allow read, write: if true;  // Permite sem login para pacientes
        
        match /callerCandidates/{candidateId} {
          allow read, write: if true;
        }
        
        match /calleeCandidates/{candidateId} {
          allow read, write: if true;
        }
      }
    }
    
    // Video Calls na raiz (para compatibilidade)
    match /videoCalls/{callId} {
      allow read, write: if true;
      
      match /callerCandidates/{candidateId} {
        allow read, write: if true;
      }
      
      match /calleeCandidates/{candidateId} {
        allow read, write: if true;
      }
    }
  }
}
```

## Importante

1. Acesse: https://console.firebase.google.com/project/agendai-485bc/firestore/rules
2. Cole as regras acima
3. Clique em "Publicar"

## Notas

- As regras de `videoCalls` permitem leitura/escrita pública para que pacientes possam entrar na teleconsulta sem login
- Os `medicalRecords` exigem autenticação para leitura/escrita (proteção de dados médicos)
- Os `appointments` permitem criação pública para que pacientes possam agendar sem login
