#!/bin/bash

# Script de Health Check
echo "🏥 Verificando saúde da aplicação..."

# Verificar se o processo está rodando
if supervisorctl status nextjs-server | grep -q "RUNNING"; then
    echo "✅ Processo: OK"
else
    echo "❌ Processo: FALHOU"
    exit 1
fi

# Verificar se a aplicação responde
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ API: OK"
else
    echo "❌ API: FALHOU"
    exit 1
fi

# Verificar uso de memória
MEMORY_USAGE=$(ps aux | grep nextjs-server | grep -v grep | awk '{print $4}')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "⚠️ Uso de memória alto: ${MEMORY_USAGE}%"
else
    echo "✅ Memória: ${MEMORY_USAGE}%"
fi

echo "🎉 Sistema saudável!"
