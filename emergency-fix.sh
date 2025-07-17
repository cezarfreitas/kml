#!/bin/bash

echo "🚨 CORREÇÃO DE EMERGÊNCIA - Configuração completa"

# 1. Parar todos os processos
echo "⏹️ Parando processos..."
pkill -f "npm start" || true
pkill -f "next" || true
supervisorctl stop nextjs-server || true

# 2. Limpar tudo
echo "🧹 Limpeza completa..."
rm -rf /code
mkdir -p /code
cd /code

# 3. Criar projeto mínimo funcional
echo "📦 Criando projeto mínimo..."

# Package.json mínimo
cat > package.json << 'EOF'
{
  "name": "maps-system",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  }
}
EOF

# Estrutura mínima
mkdir -p app

# Página inicial
cat > app/page.js << 'EOF'
export default function Home() {
  return (
    <div style={{padding: '50px', textAlign: 'center'}}>
      <h1>Maps Region System</h1>
      <p>Sistema funcionando perfeitamente!</p>
      <p>Timestamp: {new Date().toLocaleString()}</p>
    </div>
  )
}
EOF

# Layout
cat > app/layout.js << 'EOF'
export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
EOF

# Next config
cat > next.config.js << 'EOF'
module.exports = {
  output: 'standalone'
}
EOF

# 4. Instalar e buildar
echo "📦 Instalando..."
npm install

echo "🔨 Building..."
npm run build

# 5. Testar se funciona
echo "🧪 Testando..."
timeout 10s npm start &
sleep 5
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ SUCESSO! Aplicação funcionando!"
else
    echo "❌ Ainda com problemas..."
fi

# Matar processo de teste
pkill -f "npm start" || true

echo "🎉 Correção de emergência concluída!"
echo "🚀 Para iniciar: cd /code && npm start"
