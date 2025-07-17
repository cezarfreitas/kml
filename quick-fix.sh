#!/bin/bash

echo "🚀 Correção rápida - Atualizando Node.js..."

# Atualizar repositórios e instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verificar versão
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Limpar e reinstalar
cd /code
rm -rf node_modules package-lock.json .next
npm cache clean --force
npm install
npm run build

echo "✅ Correção concluída!"
