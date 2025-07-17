#!/bin/bash

echo "🚨 Correção de emergência - Node.js"

# Parar todos os processos Node.js
pkill -f node || true
pkill -f npm || true

# Remover Node.js completamente
apt-get remove --purge -y nodejs npm
apt-get autoremove -y

# Limpar repositórios antigos
rm -f /etc/apt/sources.list.d/nodesource.list
rm -f /etc/apt/trusted.gpg.d/nodesource.gpg

# Atualizar sistema
apt-get update

# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

# Verificar instalação
echo "Versão do Node.js: $(node --version)"
echo "Versão do NPM: $(npm --version)"

# Ir para o projeto
cd /code

# Limpeza completa
rm -rf node_modules package-lock.json .next
rm -rf ~/.npm
npm cache clean --force

# Configurar npm para usar registry oficial
npm config set registry https://registry.npmjs.org/

# Instalar dependências
npm install --no-optional --no-audit

# Build
npm run build

echo "✅ Correção de emergência concluída!"
