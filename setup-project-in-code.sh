#!/bin/bash

echo "🚀 Configurando projeto no diretório /code..."

# 1. Criar diretório /code se não existir
mkdir -p /code
cd /code

# 2. Verificar se já existe um projeto
if [ -f "package.json" ]; then
    echo "✅ package.json já existe em /code"
else
    echo "📦 Criando novo projeto Next.js..."
    
    # Criar package.json básico
    cat > package.json << 'EOF'
{
  "name": "maps-region-system",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.2.2",
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
EOF

    # Criar next.config.js
    cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  }
}

module.exports = nextConfig
EOF

    # Criar tsconfig.json
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

    # Criar estrutura de pastas
    mkdir -p app
    mkdir -p app/api/health
    mkdir -p components/ui
    mkdir -p lib

    # Criar página inicial básica
    cat > app/page.tsx << 'EOF'
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Maps Region System</h1>
      <p className="mt-4 text-lg">Sistema funcionando!</p>
    </main>
  )
}
EOF

    # Criar layout
    cat > app/layout.tsx << 'EOF'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Maps Region System',
  description: 'Sistema de regiões com Google Maps',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
EOF

    # Criar API de health
    cat > app/api/health/route.ts << 'EOF'
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    message: "Maps Region System is running!"
  })
}
EOF

fi

echo "✅ Projeto configurado em /code"
