# DuoFin — Finanças Inteligentes para Casais 💙💖

Sistema web moderno e fluido para gestão de finanças pessoais e conjuntas de casais, inspirado no modelo do *Minhas Finanças*, com divisão de despesas (Split % ou R$), gerenciamento automático de limite de cartões de crédito, tetos de orçamento por categoria, sistema de metas com aportes e sincronização em nuvem via **Supabase**.

---

## ✨ Funcionalidades Principais

- 📊 **Dashboard Completo:** Saldo real vs previsto, total de receitas e despesas, gráfico por categorias e fluxo de caixa de 6 meses.
- 🤝 **Acerto de Contas & Split do Casal:** Lançamentos com divisão 50/50, percentual dinâmico ou valor manual em R$. O sistema calcula automaticamente o valor de acerto de quem pagou vs quem deve no mês.
- 💳 **Cartões de Crédito com Limite Automático:** Compras únicas e parceladas consomem limite imediatamente; pagamentos de fatura liberam o limite na hora.
- 📅 **Dupla Data Obrigatória:** Escolha a *Data de Registro (Competência)* e a *Data de Vencimento (Caixa)* com calendário nativo do sistema.
- 🔁 **Controle de Parcelas e Fixas:** Ao editar ou excluir lançamentos de séries, escolha entre aplicar *Somente nesta*, *Desta em diante* ou *Todas*.
- 📋 **Duplicar Lançamento Rápido:** Ao clicar em duplicar, o modal de formulário abre pré-preenchido para alterar datas e valores com agilidade.
- 🏷️ **Categorias, Subcategorias e Tags (#):** CRUD total de todas as categorias, subcategorias e etiquetas.
- 🎯 **Metas Financeiras & Orçamentos Mensais:** Tetos de gastos com despesas atreladas e histórico detalhado de aportes em metas.
- 🌓 **Modos Light & Dark:** Design limpo de alto contraste, sem gradientes exagerados ou flicker.
- 💰 **Máscara Monetária ATM:** Inputs de valor preenchidos da direita para a esquerda (`R$ 0,00`).

---

## 🚀 Como Executar Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/SEU-USUARIO/duofin.git
cd duofin
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz (baseado no `.env.example`):
```env
VITE_SUPABASE_URL=https://knwsmbnhcmgulzyfgwtu.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse no seu navegador em `http://localhost:5173`.

### 5. Compilar para Produção
```bash
npm run build
```

---

## 🗄️ Banco de Dados (Supabase)
O script SQL com a estrutura de todas as tabelas, políticas RLS e relacionamento de dados está disponível no arquivo [`supabase_schema.sql`](./supabase_schema.sql). Execute-o no SQL Editor do seu projeto Supabase.

---

## 🛠️ Tecnologias Utilizadas
- **React 19** + **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **Lucide React** (Ícones)
- **Recharts** (Gráficos)
- **date-fns**
- **Supabase** (Auth & Cloud Database)
