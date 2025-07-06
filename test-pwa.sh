#!/bin/bash

# Script para testar o PWA localmente

echo "🚀 Fazendo build do projeto..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo ""
    echo "🌐 Iniciando servidor local para testar PWA..."
    echo "📱 Para testar no Android:"
    echo "   1. Conecte seu celular no mesmo WiFi"
    echo "   2. Acesse: http://[SEU_IP]:4173"
    echo "   3. No Chrome mobile, acesse o site"
    echo "   4. Aparecerá o banner 'Adicionar à tela inicial'"
    echo ""
    echo "🔧 Pressione Ctrl+C para parar o servidor"
    echo ""
    
    npm run preview
else
    echo "❌ Erro no build!"
    exit 1
fi
