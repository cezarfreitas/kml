#!/bin/bash

# Script de deploy simplificado
set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy simplificado..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Não encontrado package.json"
    echo "📁 Diretório atual: $(pwd)"
    ls -la
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Build
echo "🔨 Fazendo build..."
npm run build

# Verificar se .next foi criado
if [ ! -d ".next" ]; then
    echo "❌ Erro: Build falhou - diretório .next não encontrado"
    exit 1
fi

echo "✅ Deploy concluído com sucesso!"
echo "🌐 Para iniciar: npm start"
