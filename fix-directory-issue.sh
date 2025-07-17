#!/bin/bash

echo "🔍 Diagnosticando problema de diretório..."

# 1. Verificar diretório atual
echo "📁 Diretório atual: $(pwd)"
echo "📋 Conteúdo do diretório atual:"
ls -la

# 2. Verificar se /code existe
if [ -d "/code" ]; then
    echo "✅ Diretório /code existe"
    echo "📋 Conteúdo de /code:"
    ls -la /code
else
    echo "❌ Diretório /code NÃO existe"
    echo "🔧 Criando diretório /code..."
    mkdir -p /code
fi

# 3. Verificar onde está o projeto my-app
echo "🔍 Procurando projeto my-app..."
find / -name "my-app" -type d 2>/dev/null | head -5

# 4. Verificar arquivos package.json
echo "🔍 Procurando package.json..."
find / -name "package.json" 2>/dev/null | head -5

# 5. Verificar processos Node.js
echo "🔍 Processos Node.js ativos:"
ps aux | grep node | grep -v grep

echo "🎯 Diagnóstico concluído!"
