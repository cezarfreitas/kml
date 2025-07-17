#!/bin/bash

echo "🚀 Instalando dependências e iniciando aplicação..."

# 1. Ir para /code
cd /code

# 2. Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado!"
    echo "🔧 Execute primeiro: bash setup-project-in-code.sh"
    exit 1
fi

# 3. Limpar cache e instalar
echo "🧹 Limpando cache..."
rm -rf node_modules
rm -rf .next
rm -f package-lock.json

echo "📦 Instalando dependências..."
npm install

# 4. Build da aplicação
echo "🔨 Fazendo build..."
npm run build

# 5. Verificar se build foi bem-sucedido
if [ -d ".next" ]; then
    echo "✅ Build concluído com sucesso!"
else
    echo "❌ Erro no build!"
    exit 1
fi

echo "🎉 Pronto para iniciar!"
echo "🚀 Para iniciar: npm start"
