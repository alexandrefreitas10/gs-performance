# GS-Performance — Fase 1: Scaffolding + Auth + Banco de Dados

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o projeto Next.js do zero com autenticação (admin e atleta), banco de dados PostgreSQL com schema completo, e layout base com header.

**Architecture:** Next.js 16 App Router + TypeScript + Tailwind CSS v4 + NextAuth v5 (JWT) + PostgreSQL via postgres.js + bcryptjs. Dois perfis: admin (is_admin=TRUE) e atleta. Schema inicializado automaticamente no primeiro acesso.

**Tech Stack:** next@16, next-auth@5, postgres, bcryptjs, tailwindcss@4, typescript

---

## Estrutura de Arquivos

```
gs-performance/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout raiz com header
│   │   ├── page.tsx                # Redireciona para /dashboard ou /login
│   │   ├── login/
│   │   │   └── page.tsx            # Tela de login
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Dashboard (atleta ou admin conforme perfil)
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts    # Handler NextAuth
│   │       └── setup/
│   │           └── route.ts        # Cria admin inicial se não existir
│   ├── auth.ts                     # Configuração NextAuth
│   ├── middleware.ts               # Protege rotas autenticadas
│   └── lib/
│       ├── db.ts                   # Conexão PostgreSQL + initSchema()
│       └── users.ts                # findUserByUsername, createUser, findAdminUser
├── .env.local                      # Variáveis de ambiente (não commitado)
├── .env.example                    # Template de variáveis
└── package.json
```

---

### Task 1: Criar projeto Next.js

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.env.example`

- [ ] **Step 1: Scaffoldar o projeto**

```bash
cd "C:\Users\alexa\OneDrive\Desktop\GS-Performance"
npx create-next-app@16 . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

- [ ] **Step 2: Mover arquivos para src/**

```bash
mkdir src
mv app src/app
mv lib src/lib 2>/dev/null || true
```

Ajustar `tsconfig.json` — garantir que `paths` aponta para `src`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 3: Instalar dependências**

```bash
npm install next-auth@beta postgres bcryptjs
npm install -D @types/bcryptjs
npm install xlsx
```

- [ ] **Step 4: Criar .env.example**

```bash
# .env.example
DATABASE_URL=postgresql://user:password@host:5432/gs_performance
NEXTAUTH_SECRET=gere-com-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
```

- [ ] **Step 5: Criar .env.local com valores reais**

Copie `.env.example` para `.env.local` e preencha com as credenciais do banco local ou do Render.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: scaffolding inicial Next.js 16"
```

---

### Task 2: Banco de dados — conexão e schema

**Files:**
- Create: `src/lib/db.ts`

- [ ] **Step 1: Criar src/lib/db.ts**

```typescript
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 10,
})

export async function initSchema() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      is_admin BOOLEAN DEFAULT FALSE,
      group_id INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS workouts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      date DATE,
      notes TEXT DEFAULT '',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS workout_parts (
      id SERIAL PRIMARY KEY,
      workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL,
      type TEXT DEFAULT '',
      description TEXT DEFAULT '',
      time_cap INTEGER
    );
    CREATE TABLE IF NOT EXISTS exercises (
      id SERIAL PRIMARY KEY,
      part_id INTEGER NOT NULL REFERENCES workout_parts(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      name TEXT NOT NULL,
      sets INTEGER,
      reps TEXT DEFAULT '',
      load_suggested TEXT DEFAULT '',
      notes TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS workout_assignments (
      id SERIAL PRIMARY KEY,
      workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      assigned_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS athlete_results (
      id SERIAL PRIMARY KEY,
      workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      part_id INTEGER NOT NULL REFERENCES workout_parts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      completed BOOLEAN DEFAULT FALSE,
      rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
      result_value TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(part_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS benchmarks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      benchmark_name TEXT NOT NULL,
      result_value TEXT NOT NULL,
      date DATE,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
}

export default sql
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: schema PostgreSQL completo"
```

---

### Task 3: Usuários — queries

**Files:**
- Create: `src/lib/users.ts`

- [ ] **Step 1: Criar src/lib/users.ts**

```typescript
import bcrypt from 'bcryptjs'
import sql, { initSchema } from './db'

export interface User {
  id: number
  username: string
  password_hash: string
  name: string
  is_admin: boolean
  group_id: number | null
  created_at: string
}

export async function findUserByUsername(username: string): Promise<User | null> {
  await initSchema()
  const [user] = await sql<User[]>`SELECT * FROM users WHERE username = ${username} LIMIT 1`
  return user ?? null
}

export async function findUserById(id: number): Promise<User | null> {
  await initSchema()
  const [user] = await sql<User[]>`SELECT * FROM users WHERE id = ${id} LIMIT 1`
  return user ?? null
}

export async function findAdminUser(): Promise<User | null> {
  await initSchema()
  const [user] = await sql<User[]>`SELECT * FROM users WHERE is_admin = TRUE LIMIT 1`
  return user ?? null
}

export async function createUser(
  username: string,
  password: string,
  name: string,
  isAdmin = false,
  groupId?: number,
): Promise<User> {
  await initSchema()
  const hash = await bcrypt.hash(password, 12)
  const [user] = await sql<User[]>`
    INSERT INTO users (username, password_hash, name, is_admin, group_id)
    VALUES (${username}, ${hash}, ${name}, ${isAdmin}, ${groupId ?? null})
    RETURNING *
  `
  return user
}

export async function listAthletes(): Promise<Omit<User, 'password_hash'>[]> {
  await initSchema()
  return sql<Omit<User, 'password_hash'>[]>`
    SELECT id, username, name, is_admin, group_id, created_at
    FROM users WHERE is_admin = FALSE ORDER BY name
  `
}

export async function updateUserPassword(id: number, password: string): Promise<void> {
  await initSchema()
  const hash = await bcrypt.hash(password, 12)
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${id}`
}

export async function deleteUser(id: number): Promise<void> {
  await initSchema()
  await sql`DELETE FROM users WHERE id = ${id}`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/users.ts
git commit -m "feat: queries de usuários"
```

---

### Task 4: Autenticação NextAuth v5

**Files:**
- Create: `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/middleware.ts`

- [ ] **Step 1: Criar src/auth.ts**

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { findUserByUsername } from '@/lib/users'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Usuário', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const user = await findUserByUsername(credentials.username as string)
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password as string, user.password_hash)
        if (!valid) return null
        return { id: String(user.id), name: user.name, is_admin: user.is_admin }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.is_admin = (user as any).is_admin ?? false
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).is_admin = token.is_admin ?? false
      }
      return session
    },
  },
})
```

- [ ] **Step 2: Criar src/app/api/auth/[...nextauth]/route.ts**

```typescript
import { handlers } from '@/auth'
export const { GET, POST } = handlers
```

- [ ] **Step 3: Criar src/middleware.ts**

```typescript
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isLoginPage = req.nextUrl.pathname === '/login'

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 4: Commit**

```bash
git add src/auth.ts src/app/api/auth src/middleware.ts
git commit -m "feat: autenticação NextAuth v5 com JWT"
```

---

### Task 5: Tela de login

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Criar src/app/login/page.tsx**

```tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })
    if (result?.error) {
      setError('Usuário ou senha incorretos')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">GS Performance</h1>
          <p className="text-zinc-400 text-sm mt-1">Acesse sua conta</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="seu.usuario"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/login
git commit -m "feat: tela de login"
```

---

### Task 6: Layout raiz + página principal

**Files:**
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/dashboard/page.tsx`

- [ ] **Step 1: Criar src/app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GS Performance',
  description: 'Plataforma de treinos GS Performance',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.className} bg-zinc-950 text-white`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Criar src/app/page.tsx**

```tsx
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function Home() {
  const session = await auth()
  if (!session) redirect('/login')
  redirect('/dashboard')
}
```

- [ ] **Step 3: Criar src/app/dashboard/page.tsx**

```tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const isAdmin = (session.user as any).is_admin

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">
          Olá, {session.user?.name} 👋
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {isAdmin ? 'Painel do Administrador' : 'Seus treinos de hoje'}
        </p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <p className="text-zinc-500 text-sm text-center">
          {isAdmin
            ? 'Área do admin — em construção.'
            : 'Seus treinos aparecerão aqui em breve.'}
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/app/dashboard
git commit -m "feat: layout raiz e dashboard placeholder"
```

---

### Task 7: Rota de setup — criar admin inicial

**Files:**
- Create: `src/app/api/setup/route.ts`, `src/app/setup/page.tsx`

- [ ] **Step 1: Criar src/app/api/setup/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { findAdminUser, createUser } from '@/lib/users'

export async function POST(req: NextRequest) {
  const existing = await findAdminUser()
  if (existing) {
    return NextResponse.json({ error: 'Admin já existe' }, { status: 409 })
  }
  const { username, password, name } = await req.json()
  if (!username || !password || !name) {
    return NextResponse.json({ error: 'Campos obrigatórios: username, password, name' }, { status: 400 })
  }
  const user = await createUser(username, password, name, true)
  return NextResponse.json({ id: user.id, username: user.username, name: user.name }, { status: 201 })
}
```

- [ ] **Step 2: Criar src/app/setup/page.tsx**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const [form, setForm] = useState({ username: '', password: '', name: '' })
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setDone(true)
      setTimeout(() => router.push('/login'), 2000)
    } else {
      const d = await res.json()
      setError(d.error)
    }
  }

  if (done) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-green-400 font-semibold">Admin criado! Redirecionando...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-black text-white mb-6 text-center">Configuração Inicial</h1>
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          {(['name', 'username', 'password'] as const).map(field => (
            <div key={field}>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5 capitalize">
                {field === 'name' ? 'Nome completo' : field === 'username' ? 'Usuário' : 'Senha'}
              </label>
              <input
                type={field === 'password' ? 'password' : 'text'}
                value={form[field]}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          ))}
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors">
            Criar Admin
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Atualizar middleware para permitir /setup sem auth**

Em `src/middleware.ts`, adicionar `/setup` às rotas públicas:

```typescript
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|setup).*)'],
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/setup src/app/setup src/middleware.ts
git commit -m "feat: rota de setup para criar admin inicial"
```

---

### Task 8: Testar localmente

- [ ] **Step 1: Rodar o servidor**

```bash
npm run dev
```

- [ ] **Step 2: Acessar http://localhost:3000/setup e criar o admin**

Preencha nome, usuário e senha do Guilherme.

- [ ] **Step 3: Fazer login em http://localhost:3000/login**

Use as credenciais criadas no setup. Deve redirecionar para `/dashboard`.

- [ ] **Step 4: Verificar que rota protegida sem login redireciona para /login**

Acesse `http://localhost:3000/dashboard` sem estar logado. Deve ir para `/login`.

- [ ] **Step 5: Commit final**

```bash
git add .
git commit -m "chore: ajustes pós-teste fase 1"
```

---

## Resumo da Fase 1

Ao final desta fase você terá:
- Projeto Next.js 16 funcionando localmente
- Schema PostgreSQL completo criado automaticamente
- Login/logout funcionando com dois perfis (admin e atleta)
- Rota `/setup` para criar o primeiro admin
- Dashboard placeholder diferenciado por perfil
- Visual dark com identidade GS Performance (laranja + zinc)
