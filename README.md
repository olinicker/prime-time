# 🕒 Prime Time — Controle de Jornada Premium & Banco de Horas

Este repositório contém a versão completa do **Prime Time**, um sistema de controle de ponto e banco de horas eletrônico premium *enterprise-ready*. Desenhado seguindo as diretrizes visuais mais refinadas do mercado (inspirado em interfaces como Linear, Stripe e Vercel), a aplicação implementa recursos de geolocalização simulada, segurança biométrica facial, reconhecimento IA (OCR) de atestados e gerenciamento integral de banco de horas em regime CLT.

---

## ✨ Recursos Implementados

### 1. 💼 Diferenciais de Engenharia & UX
- **Arquitetura Desacoplada**: Camada de API mocked assíncrona (`/src/services/api.ts`) que emula latência de rede real, validação de tokens e persistência via banco local reativo (`localStorage`). 
- **Zustand Equivalency & Central Store**: Configuração robusta de estado global centralizado (`/src/store/AppContext.tsx`), provendo sincronia instantânea e integridade de tipos.
- **Tipagem Estrita**: 100% em TypeScript com especificações completas de contratos, registros de jornada e regras de turnos contractuais (`/src/types/index.ts`).
- **Tema Premium Dark/Light**: Foco visual no requinte em tons grafite, acentos verde esmeralda (#10B981) e tipografia moderna (Space Grotesk + JetBrains Mono).

### 2. 📲 Funcionalidades da Jornada (Colaborador)
- **Bater Ponto Inteligente**: Modal interativo com simulação de leitura facial e captura geográfica de coordenadas. Emite recibo eletrônico digital assinado eletronicamente e passível de impressão.
- **Histórico & Espelho de Ponto**: Tabela responsiva contendo detalhes diários de entradas, saídas, intervalos e saldos positivos/negativos acumulados.
- **Envio de Atestados Inteligente**: Upload simulado de laudos médicos com linha de escaneamento em tempo real (IA OCR) que extrai CRM do clínico, código CID e dias sugeridos de abono comercial automaticamente.
- **Central de Ajustes**: Envio facilitado de solicitações retroativas para correção de esquecimentos de registros ou viagens corporativas extra-HQ.

### 3. 🛡️ Funcionalidades Administrativas (Módulo RH & Gestão)
- **Gestão de Colaboradores (CRUD)**: Cadastramento de profissionais, ajuste instantâneo de horas acumuladas no banco de horas corporativo e desativação temporária de credenciais.
- **Turnos & Tolerâncias**: Criação de regras de tolerância diária em linha com o artigo 58 da CLT (limite de tolerância de 10 minutos).
- **Central de Homologação**: Visualização em fila única de atestados médicos e ajustes criados. Possui ações de deferimento (aprovação retrógrada automática na jornada) e indeferimento com justificativas.
- **Relatórios & Fechamentos**: Consolidados de banco de horas filtrados por departamento de atuação com exportação interativa para Excel (.xls) ou PDF corporativo.

---

## 🔑 Credenciais Rápidas de Onboarding (Demonstração)

Para facilitar a auditoria sem a necessidade de buscar registros em arquivos de configuração, implementamos atalhos avaliativos na tela de login. Basta clicar em um deles para logar instantaneamente com papéis pré-configurados:

| Função / Perfil | CPF de Teste | Senha Padrão | Cenários de Teste Recomendados |
| :--- | :--- | :--- | :--- |
| **Colaborador** | `222.222.222-22` | `123456` | Registro de ponto ordinário, espelho de ponto pessoal, upload de atestados. |
| **Gestor de Time** | `111.111.111-11` | `123456` | Gestão de abonos e homologação de solicitações pendentes no fluxo do time. |
| **Administrador** | `000.000.000-00` | `123456` | Controle CRUD geral de turnos, alteração de saldos manuais e visualização de relatórios. |

---

## 📁 Estrutura do Sistema

```bash
/src
  ├── components/          # Elementos de UI globais, gráficos customizados e botões modais
  │    ├── Charts.tsx      # Visualizadores gráficos SVG independentes para performance
  │    ├── ClockButton.tsx # O botão mestre de marcação de ponto biométrico/geográfico
  │    ├── Header.tsx      # Barra superior com relógio digital UTC e perfil rápido
  │    ├── Sidebar.tsx     # Menu lateral responsivo com filtragem de links baseada no perfil
  │    └── LoginOverlay.tsx# Portal de entrada e recuperação de credenciais de segurança
  │
  ├── pages/               # Telas / Viewports acionadas por rotas internas
  │    ├── DashboardView.tsx   # Visão macro de jornada, saldo acumulado e logs recientes
  │    ├── HistoryView.tsx     # Espelho oficial de ponto impresso com selos fiscais
  │    ├── AdjustmentsView.tsx # Central de requisição de correções retroativas
  │    ├── AtestadoView.tsx    # Upload e digitalização IA OCR de laudos de repouso
  │    ├── ProfileView.tsx     # Ficha cadastral CLT e troca de senha do display local
  │    ├── AdminUsersView.tsx  # CRUD de colaboradores + alteração manual de créditos e débitos
  │    ├── AdminShiftsView.tsx # Registro e dimensionamento de turnos e horas diárias
  │    ├── AdminApprovalsView.tsx # Saneamento e deferimento eletrônico pelo RH
  │    └── AdminReportsView.tsx   # Agregações de departamento e planilhas de fechamento
  │
  ├── mocks/               # Camada de banco de dados e sementes iniciais
  │    └── database.ts     # Banco de Dados local reativo sincronizado no LocalStorage
  │
  ├── services/            # Camada de integração corporativa
  │    └── api.ts          # Simulação de endpoints REST com delay controlado
  │
  ├── store/               # Estado Global Centralizado
  │    └── AppContext.tsx  # Instancia do provedor reativo geral de sessões e rotinas
  │
  ├── utils/               # Utilitários de renderização
  │    └── formatters.ts   # Máscaras de CPF, formatações de tempo e banco de horas
  │
  ├── App.tsx              # Componente Mestre, manipulador de roteamento interno
  ├── index.css            # Folha de estilo global integrando fontes Google Fonts
  └── main.tsx             # Arquivo inicializador
```

---

## ⚙️ Tecnologias Utilizadas

- **React 19 & TypeScript 5+**
- **Vite** (Build ultrarrápido sem gargalos)
- **Tailwind CSS v4** (Design utilitário fluido com classes customizadas)
- **Motion (Framer Motion)** (Micromovimentos refinados e transições de página)
- **Lucide React** (Pacote de ícones minimalistas de alta densidade)
