#!/bin/bash

# Script de correção para problemas de deploy
echo "🔧 Corrigindo problemas de deploy..."

# 1. Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado!"
    echo "📁 Diretório atual: $(pwd)"
    echo "📋 Arquivos disponíveis:"
    ls -la
    exit 1
fi

# 2. Corrigir permissões de todos os scripts
echo "🔐 Corrigindo permissões..."
find . -name "*.sh" -type f -exec chmod +x {} \;
chmod +x scripts/*.sh 2>/dev/null || true

# 3. Verificar Node.js e npm
echo "🔍 Verificando Node.js..."
node --version || { echo "❌ Node.js não encontrado!"; exit 1; }
npm --version || { echo "❌ npm não encontrado!"; exit 1; }

# 4. Limpar cache e reinstalar
echo "🧹 Limpando cache..."
rm -rf node_modules
rm -rf .next
rm -f package-lock.json
npm cache clean --force

# 5. Instalar dependências
echo "📦 Instalando dependências..."
npm install --production=false

# 6. Build da aplicação
echo "🔨 Fazendo build..."
npm run build

# 7. Verificar se o build foi bem-sucedido
if [ -d ".next" ]; then
    echo "✅ Build concluído com sucesso!"
else
    echo "❌ Erro no build!"
    exit 1
fi

echo "🎉 Correção concluída!"
