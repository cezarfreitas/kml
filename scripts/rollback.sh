#!/bin/bash

# Script de Rollback
echo "🔄 Iniciando rollback..."

cd /code

# Verificar se existe backup
if [ ! -d "/code/backup" ]; then
    echo "❌ Erro: Backup não encontrado!"
    exit 1
fi

# Parar serviço
echo "⏹️ Parando serviço..."
supervisorctl stop nextjs-server

# Restaurar backup
echo "📦 Restaurando backup..."
cp -r /code/backup/* /code/

# Reiniciar serviço
echo "🔄 Reiniciando serviço..."
supervisorctl start nextjs-server

# Verificar se está funcionando
sleep 5
if supervisorctl status nextjs-server | grep -q "RUNNING"; then
    echo "✅ Rollback concluído com sucesso!"
else
    echo "❌ Erro no rollback"
    exit 1
fi
