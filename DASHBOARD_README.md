# Dashboard Administrativo - Barbearias

## 📋 Visão Geral

Este é o painel administrativo para donos de barbearias e funcionários gerenciarem:

- Agendamentos
- Profissionais
- Horários
- Faturamento
- Clientes

## 🗂️ Estrutura do Projeto

```
app/
├── barbershops/
│   └── dashboard/
│       ├── layout.tsx           # Layout principal do dashboard
│       ├── page.tsx             # Página de visão geral
│       ├── appointments/        # Gerenciamento de agendamentos
│       ├── professionals/       # Gerenciamento de profissionais
│       ├── financial/           # Painel financeiro
│       └── settings/            # Configurações
├── api/
│   └── auth/
│       ├── login/               # Endpoint de login
│       └── register/            # Endpoint de registro
└── dashboard-login/             # Página de login
components/
├── dashboard/
│   ├── metric-card.tsx          # Card de métricas
│   ├── bar-chart.tsx            # Gráfico de barras
│   └── pie-chart.tsx            # Gráfico pizza
└── ui/                          # Componentes shadcn/ui
data/
└── dashboard.ts                 # Funções de dados do dashboard
```
