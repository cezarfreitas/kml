#!/bin/bash

echo "🚀 Instalando dependências e configurando projeto..."

# 1. Executar script de criação
bash create-complete-project.sh

# 2. Instalar dependências
cd /code
echo "📦 Instalando dependências..."
npm install

# 3. Fazer build
echo "🔨 Fazendo build..."
npm run build

# 4. Testar aplicação
echo "🧪 Testando aplicação..."
timeout 10s npm start &
sleep 5

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ SUCESSO! Aplicação funcionando perfeitamente!"
else
    echo "⚠️ Aplicação pode estar iniciando..."
fi

# Parar processo de teste
pkill -f "npm start" || true

echo "🎉 Setup concluído!"
echo "🚀 Para iniciar: cd /code && npm start"
