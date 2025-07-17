#!/bin/bash

echo "🚀 Configuração completa do Maps Region System..."

# 1. Navegar para o projeto
cd my-app

# 2. Instalar dependências
echo "📦 Instalando dependências..."
npm install @types/google.maps google-maps class-variance-authority clsx tailwind-merge tailwindcss-animate lucide-react

# 3. Instalar componentes shadcn
echo "🎨 Instalando componentes shadcn..."
npx shadcn@latest add button card input label badge slider switch select separator tabs progress tooltip --yes

# 4. Criar estrutura de pastas
echo "📁 Criando estrutura de pastas..."
mkdir -p app/api/check-point
mkdir -p app/api/health
mkdir -p lib
mkdir -p components

# 5. Build do projeto
echo "🔨 Fazendo build..."
npm run build

# 6. Testar se está funcionando
echo "🧪 Testando aplicação..."
npm run dev &
sleep 10
curl -f http://localhost:3000 && echo "✅ Aplicação funcionando!" || echo "❌ Erro na aplicação"

echo "🎉 Configuração concluída!"
