# GS-Performance — Design Spec

> **For agentic workers:** Use superpowers:writing-plans to implement this spec task-by-task.

**Goal:** Plataforma web para personal trainer gerenciar e distribuir treinos de CrossFit para atletas, com feedback, leaderboard e benchmarks.

**Architecture:** Next.js 16 App Router + TypeScript + Tailwind CSS + PostgreSQL + NextAuth v5 + AWS S3. Deploy no Render. Dois perfis: Admin (Guilherme) e Atleta.

---

## 1. Autenticação

- Login com usuário e senha via NextAuth v5 (JWT strategy)
- Dois papéis: `admin` e `athlete`
- Admin é marcado por flag `is_admin = TRUE` na tabela `users`
- Atleta acessa apenas seus próprios dados
- Sessão expira em 7 dias

---

## 2. Banco de Dados (PostgreSQL)

### Tabelas principais

**users**
- id, username, password_hash, name, is_admin, group_id, created_at

**groups** (turmas)
- id, name, created_at

**workouts** (treinos/templates)
- id, title, date, notes, created_by, created_at

**workout_parts** (partes do treino: Aquecimento, WOD, Strength, etc.)
- id, workout_id, order, title, type (AMRAP/EMOM/ForTime/Strength/etc.), description, time_cap

**exercises** (exercícios dentro de cada parte)
- id, part_id, order, name, sets, reps, load_suggested, notes

**workout_assignments** (atribuição de treino para aluno ou grupo)
- id, workout_id, user_id (nullable), group_id (nullable), assigned_at

**athlete_results** (resultados lançados pelo atleta)
- id, workout_id, part_id, user_id, completed (boolean), rpe (1-10), result_value (texto livre: tempo, reps, carga), notes, created_at

**benchmarks** (PRs dos atletas nos benchmarks clássicos do CrossFit)
- id, user_id, benchmark_name, result_value, date, notes, created_at

---

## 3. Importação via Excel

- Admin faz upload de `.xlsx` no painel
- Sistema lê colunas: Parte | Exercício | Séries | Reps | Carga | Notas
- Exibe prévia em tabela antes de confirmar
- Ao confirmar, cria workout + workout_parts + exercises no banco
- Admin ainda pode editar antes de publicar/atribuir

### Formato esperado do Excel
| Parte | Exercício | Séries | Reps | Carga | Notas |
|-------|-----------|--------|------|-------|-------|
| Aquecimento | Agachamento | 3 | 10 | - | Sem carga |
| WOD | Burpee | - | 21-15-9 | - | For Time |

---

## 4. Área do Atleta

### Tela principal — Treinos da semana
- Cards por dia da semana com os treinos atribuídos
- Cada card mostra: título, partes do treino, status (pendente/concluído)

### Detalhe do treino
- Lista de partes com exercícios, séries, reps e carga sugerida
- Botão "Concluir parte" → abre modal para:
  - Marcar como concluído
  - PSE (percepção subjetiva de esforço) de 1 a 10
  - Campo de resultado (tempo, reps, carga usada)
  - Notas opcionais
- Progresso visual das partes concluídas

### Histórico
- Lista de todos os treinos passados com resultados registrados
- Filtro por período

### Benchmarks
- Lista dos benchmarks clássicos do CrossFit (Fran, Grace, Cindy, Diane, Helen, Annie, etc.)
- Atleta registra PR com valor, data e notas
- Histórico de evolução por benchmark

### Leaderboard
- Ranking semanal por treino
- Exibe: posição, nome do atleta, resultado
- Separado por parte/tipo de resultado

---

## 5. Painel do Admin

### Visão geral dos alunos
- Lista de todos os atletas
- Indicador: treinou hoje (sim/não), PSE média da semana, último acesso

### Detalhe do atleta
- Histórico completo de treinos e resultados
- Evolução de cargas por exercício (gráfico simples)
- Benchmarks registrados

### Gestão de treinos
- Criar treino manualmente (título, data, partes, exercícios)
- Importar via Excel
- Duplicar treino existente
- Atribuir treino para: aluno específico, grupo/turma, ou todos

### Gestão de usuários
- Criar/editar atletas (nome, usuário, senha, turma)
- Resetar senha

---

## 6. Stack e Infraestrutura

- **Framework:** Next.js 16.x (App Router)
- **Linguagem:** TypeScript
- **Estilo:** Tailwind CSS v4
- **Auth:** NextAuth v5 (JWT, bcryptjs para senhas)
- **Banco:** PostgreSQL via postgres.js
- **Excel:** biblioteca `xlsx` (SheetJS) para leitura do arquivo
- **Deploy:** Render (web service + PostgreSQL)
- **Storage:** AWS S3 (opcional, para fotos de perfil futuramente)

---

## 7. Benchmarks de CrossFit incluídos

Fran, Grace, Cindy, Diane, Helen, Annie, Isabel, Jackie, Karen, Nancy, Amanda, Barbara, Chelsea, Eva, Kelly, Linda, Mary, Murph, Nicole, Filthy Fifty.

---

## 8. Fora do escopo (v1)

- App mobile nativo
- Notificações push
- Chat entre atleta e Guilherme
- Pagamento/assinatura
- Integração com wearables
