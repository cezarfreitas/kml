#!/bin/bash

echo "🚀 Configurando Maps Region System..."

# Navegar para o projeto
cd my-app

# Instalar dependências específicas do projeto
echo "📦 Instalando dependências..."
npm install @types/google.maps google-maps class-variance-authority clsx tailwind-merge tailwindcss-animate

# Adicionar componentes shadcn necessários
echo "🎨 Adicionando componentes shadcn..."
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add badge
npx shadcn@latest add slider
npx shadcn@latest add switch
npx shadcn@latest add separator
npx shadcn@latest add select
npx shadcn@latest add progress
npx shadcn@latest add tooltip
npx shadcn@latest add tabs

echo "✅ Configuração inicial concluída!"
