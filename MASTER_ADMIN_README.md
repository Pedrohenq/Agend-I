# Portal Master Admin - AgendAí

## 📋 Visão Geral

O Portal Master Admin é uma interface de gestão para controlar TODAS as clínicas (tenants) do sistema AgendAí. Apenas usuários com a flag `isMasterAdmin: true` podem acessar.

## 🔧 Configuração Inicial

### 1. Criar o Primeiro Master Admin

Execute este código no Console do Firebase ou crie um script:

```javascript
// No Console do Firebase > Firestore > + Adicionar documento
// Coleção: masterAdmins
// ID do documento: [UID do usuário no Firebase Auth]

{
  "id": "[UID do usuário]",
  "uid": "[UID do usuário]",
  "email": "master@agendai.com",
  "name": "Master Admin",
  "isMasterAdmin": true,
  "createdAt": [Timestamp atual]
}
```

### 2. Criar Usuário no Firebase Authentication

1. Acesse Firebase Console > Authentication > Users
2. Clique em "Add user"
3. Email: `master@agendai.com`
4. Senha: (defina uma senha segura)
5. Copie o UID gerado
6. Use esse UID no passo anterior

### 3. Acessar o Portal

URL: `/#/master/login`

## 📊 Funcionalidades

### Dashboard Geral
- **Total de Clínicas**: Quantidade de tenants cadastrados
- **Ativas**: Clínicas com pagamento em dia
- **Bloqueadas**: Clínicas com acesso suspenso
- **Profissionais**: Total de médicos cadastrados no sistema
- **Receita Mensal**: Soma de (profissionais × R$ 39,90) de todas as clínicas
- **Em Atraso**: Total de faturas vencidas
- **Faturas Pendentes**: Quantidade de faturas aguardando pagamento

### Gestão de Clínicas
Para cada clínica você pode:
- **Ver Detalhes**: Informações completas, admins, faturas
- **Bloquear/Desbloquear**: Controle de acesso por inadimplência
- **Gerar PIX**: Criar código PIX Copia e Cola
- **Marcar como Pago**: Confirmar pagamento manualmente
- **Reset de Senha**: Enviar email de recuperação para admins
- **Deletar**: Remover clínica permanentemente

### Filtros
- Busca por nome, CNPJ ou subdomínio
- Filtro por status: Ativo, Pendente, Atrasado, Bloqueado

### Fechamento Mensal (Cron Job)
Botão "Fechamento Mensal" executa:
1. Gera faturas para todas as clínicas
2. Conta profissionais ativos de cada clínica
3. Calcula valor (profissionais × R$ 39,90)
4. Bloqueia clínicas com atraso > 5 dias

## 🔐 Lógica de Bloqueio

### Automático
- Fatura vence no dia 10 do mês seguinte
- Após 5 dias de atraso, clínica é bloqueada automaticamente
- Bloqueio impede login de QUALQUER usuário da clínica

### Manual
- Master Admin pode bloquear/desbloquear a qualquer momento
- Motivo é registrado no banco de dados

### Middleware de Bloqueio
Quando um usuário de uma clínica bloqueada tenta fazer login:
1. Login é bem-sucedido (Firebase Auth)
2. Sistema verifica status do tenant
3. Se `status: 'suspended'`, redireciona para tela de pagamento

## 💳 Integração de Pagamentos

### Mock Atual
O sistema usa um mock de pagamento que gera:
- Código PIX fake (funcional para testes)
- URL de boleto fake

### Integração Real (Produção)
Para integrar com gateway real (Asaas, Mercado Pago, etc.):

1. Edite `src/services/payment.ts`
2. Substitua `MockPaymentProvider` por implementação real:

```typescript
class AsaasPaymentProvider implements PaymentProvider {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || '';
  }
  
  async generatePix(amount: number, description: string): Promise<{
    code: string;
    qrCodeBase64?: string;
    transactionId: string;
  }> {
    // Implementar chamada à API do Asaas
    const response = await fetch('https://api.asaas.com/v3/pix/qrCodes/static', {
      method: 'POST',
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        addressKey: 'sua-chave-pix',
        value: amount,
        description
      })
    });
    
    const data = await response.json();
    return {
      code: data.payload,
      qrCodeBase64: data.encodedImage,
      transactionId: data.id
    };
  }
  
  // Implementar outros métodos...
}
```

## 📁 Estrutura do Banco de Dados

```
Firestore/
├── masterAdmins/
│   └── {userId}/
│       ├── id: string
│       ├── uid: string
│       ├── email: string
│       ├── name: string
│       ├── isMasterAdmin: true
│       └── createdAt: timestamp
│
├── tenants/
│   └── {tenantId}/
│       ├── status: 'active' | 'suspended'
│       ├── suspendedAt?: timestamp
│       ├── suspensionReason?: string
│       ├── reactivatedAt?: timestamp
│       │
│       └── invoices/
│           └── {invoiceId}/
│               ├── referenceMonth: '2026-01'
│               ├── professionalsCount: number
│               ├── pricePerProfessional: 39.90
│               ├── totalAmount: number
│               ├── status: 'pending' | 'paid' | 'overdue' | 'cancelled'
│               ├── dueDate: 'YYYY-MM-DD'
│               ├── paidAt?: timestamp
│               ├── paymentMethod?: string
│               └── paymentLink?: string
│
└── paymentLinks/
    └── {linkId}/
        ├── invoiceId: string
        ├── tenantId: string
        ├── type: 'pix' | 'boleto'
        ├── code: string
        ├── url?: string
        ├── amount: number
        ├── status: 'active' | 'expired' | 'paid'
        └── expiresAt: string
```

## 🔄 Cron Job de Fechamento

Para executar automaticamente todo dia 01:

### Opção 1: Firebase Functions (Recomendado)
```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.monthlyBilling = functions.pubsub
  .schedule('0 0 1 * *') // Meia-noite do dia 01
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    // Chamar runMonthlyBillingClosure()
  });
```

### Opção 2: Cloud Scheduler + Cloud Functions
Configure um job que chama uma Cloud Function HTTP.

### Opção 3: Servidor externo
Configure um cron job no servidor que chama a API.

## 🚨 Segurança

1. **Acesso Restrito**: Apenas usuários na coleção `masterAdmins` com `isMasterAdmin: true`
2. **Regras do Firestore**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Master Admins collection - leitura apenas autenticado
    match /masterAdmins/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Apenas via Console/Admin SDK
    }
    
    // ... outras regras
  }
}
```

## 📱 URLs do Sistema

| Rota | Descrição |
|------|-----------|
| `/#/master/login` | Login do Master Admin |
| `/#/master/dashboard` | Dashboard de gestão |

## ✅ Checklist de Produção

- [ ] Criar Master Admin no Firestore
- [ ] Criar usuário no Firebase Auth
- [ ] Configurar regras de segurança do Firestore
- [ ] Integrar gateway de pagamento real
- [ ] Configurar Cron Job mensal
- [ ] Monitorar logs de erro
- [ ] Fazer backup regular do Firestore
