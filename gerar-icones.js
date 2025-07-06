// Script para gerar ícones PNG usando Canvas
// Execute este script no console do navegador

function generateIcon(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Fundo azul
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(0, 0, size, size);
  
  // Bordas arredondadas (aproximação)
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(0, 0, size, size);
  
  // Documento (proporcional ao tamanho)
  const scale = size / 192;
  const docWidth = 88 * scale;
  const docHeight = 112 * scale;
  const docX = (size - docWidth) / 2;
  const docY = (size - docHeight) / 2 + 10 * scale;
  
  // Fundo do documento
  ctx.fillStyle = 'white';
  ctx.fillRect(docX, docY, docWidth, docHeight);
  
  // Header do documento
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(docX, docY, docWidth, 24 * scale);
  
  // Linhas do texto
  ctx.fillStyle = '#cbd5e1';
  const lineHeight = 3 * scale;
  const lineSpacing = 10 * scale;
  const lineStartX = docX + 12 * scale;
  let lineY = docY + 32 * scale;
  
  ctx.fillRect(lineStartX, lineY, 64 * scale, lineHeight);
  lineY += lineSpacing;
  ctx.fillRect(lineStartX, lineY, 48 * scale, lineHeight);
  lineY += lineSpacing;
  ctx.fillRect(lineStartX, lineY, 56 * scale, lineHeight);
  
  // Alternativas (círculos)
  lineY += lineSpacing * 1.5;
  const circleRadius = 4 * scale;
  const circleX = docX + 16 * scale;
  
  // Primeira alternativa (selecionada)
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath();
  ctx.arc(circleX, lineY, circleRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(circleX + 12 * scale, lineY - lineHeight/2, 32 * scale, lineHeight);
  
  // Outras alternativas
  lineY += lineSpacing * 1.4;
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(circleX, lineY, circleRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(circleX + 12 * scale, lineY - lineHeight/2, 28 * scale, lineHeight);
  
  lineY += lineSpacing * 1.4;
  ctx.beginPath();
  ctx.arc(circleX, lineY, circleRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(circleX + 12 * scale, lineY - lineHeight/2, 36 * scale, lineHeight);
  
  // Texto DP-300
  ctx.fillStyle = 'white';
  ctx.font = `bold ${16 * scale}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('DP-300', size / 2, size - 27 * scale);
  
  return canvas.toDataURL('image/png');
}

// Gerar e baixar ícones
const icon192 = generateIcon(192);
const icon512 = generateIcon(512);

// Criar links de download
function downloadIcon(dataUrl, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

console.log('Gerando ícones PNG...');
downloadIcon(icon192, 'icon-192.png');
downloadIcon(icon512, 'icon-512.png');
console.log('Ícones baixados! Coloque-os na pasta public/');
