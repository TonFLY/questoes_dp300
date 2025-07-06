# Script para testar o PWA localmente no Windows

Write-Host "🚀 Fazendo build do projeto..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Iniciando servidor local para testar PWA..." -ForegroundColor Cyan
    Write-Host "📱 Para testar no Android:" -ForegroundColor Yellow
    Write-Host "   1. Conecte seu celular no mesmo WiFi" -ForegroundColor White
    Write-Host "   2. Descubra seu IP com: ipconfig" -ForegroundColor White
    Write-Host "   3. Acesse no celular: http://[SEU_IP]:4173" -ForegroundColor White
    Write-Host "   4. No Chrome mobile, acesse o site" -ForegroundColor White
    Write-Host "   5. Aparecerá o banner 'Adicionar à tela inicial'" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Pressione Ctrl+C para parar o servidor" -ForegroundColor Magenta
    Write-Host ""
    
    npm run preview
} else {
    Write-Host "❌ Erro no build!" -ForegroundColor Red
    exit 1
}
