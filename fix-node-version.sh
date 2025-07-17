#!/bin/bash

echo "🔧 Corrigindo versão do Node.js..."

# Remover versão antiga do Node.js
apt-get remove -y nodejs npm

# Limpar cache
apt-get autoremove -y
apt-get autoclean

# Instalar Node.js 18 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verificar instalação
echo "✅ Versões instaladas:"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"

# Navegar para o projeto
cd /code

# Limpar completamente
echo "🧹 Limpando projeto..."
rm -rf node_modules
rm -rf .next
rm -rf .npm
rm -f package-lock.json

# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
echo "📦 Reinstalando dependências..."
npm install

# Fazer build
echo "🔨 Fazendo build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build realizado com sucesso!"
    echo "🚀 Aplicação pronta para deploy!"
else
    echo "❌ Erro no build. Verificando logs..."
    npm run build --verbose
fi
