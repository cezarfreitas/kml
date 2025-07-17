#!/bin/bash

# Script de Deploy - Sistema de Mapas
echo "🚀 Iniciando deploy do Maps Region System..."

# Navegar para diretório do projeto
cd /code

# Verificar se o diretório existe
if [ ! -d "/code" ]; then
    echo "❌ Erro: Diretório /code não encontrado!"
    exit 1
fi

# Backup da versão anterior (opcional)
echo "📦 Criando backup da versão anterior..."
if [ -d "/code/backup" ]; then
    rm -rf /code/backup
fi
mkdir -p /code/backup
cp -r /code/node_modules /code/backup/ 2>/dev/null || true
cp -r /code/.next /code/backup/ 2>/dev/null || true

# Limpar cache e dependências antigas
echo "🧹 Limpando cache..."
rm -rf node_modules
rm -rf .next
rm -f package-lock.json

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se a instalação foi bem-sucedida
if [ $? -ne 0 ]; then
    echo "❌ Erro na instalação das dependências!"
    exit 1
fi

# Build da aplicação
echo "🔨 Construindo aplicação..."
npm run build

# Verificar se o build foi bem-sucedido
if [ $? -ne 0 ]; then
    echo "❌ Erro no build da aplicação!"
    echo "🔄 Restaurando backup..."
    cp -r /code/backup/* /code/ 2>/dev/null || true
    exit 1
fi

# Verificar se o serviço nextjs-server existe
echo "🔍 Verificando serviço nextjs-server..."
if supervisorctl status nextjs-server > /dev/null 2>&1; then
    echo "🔄 Reiniciando serviço nextjs-server..."
    supervisorctl restart nextjs-server
else
    echo "⚠️ Serviço nextjs-server não encontrado, iniciando..."
    supervisorctl start nextjs-server
fi

# Verificar se o serviço está rodando
sleep 5
if supervisorctl status nextjs-server | grep -q "RUNNING"; then
    echo "✅ Deploy concluído com sucesso!"
    echo "🌐 Aplicação disponível em: http://localhost:3000"
else
    echo "❌ Erro: Serviço não está rodando corretamente"
    supervisorctl status nextjs-server
    exit 1
fi

# Limpeza final
echo "🧹 Limpeza final..."
rm -rf /code/backup

echo "🎉 Deploy finalizado!"
