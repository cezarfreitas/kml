#!/bin/bash

echo "🎨 Instalando componentes shadcn..."

cd my-app

# Componentes básicos
npx shadcn@latest add button --yes
npx shadcn@latest add card --yes
npx shadcn@latest add input --yes
npx shadcn@latest add label --yes
npx shadcn@latest add badge --yes

# Componentes de formulário
npx shadcn@latest add slider --yes
npx shadcn@latest add switch --yes
npx shadcn@latest add select --yes

# Componentes de layout
npx shadcn@latest add separator --yes
npx shadcn@latest add tabs --yes
npx shadcn@latest add progress --yes
npx shadcn@latest add tooltip --yes

echo "✅ Todos os componentes instalados!"
