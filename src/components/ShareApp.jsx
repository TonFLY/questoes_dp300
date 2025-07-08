import { useState } from 'react';
import { QrCodeIcon, ShareIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

export function ShareApp() {
  const [showModal, setShowModal] = useState(false);
  const appUrl = window.location.origin;
  
  const shareData = {
    title: 'DP-300 Questões',
    text: 'App de questões para certificação DP-300 Microsoft',
    url: appUrl
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        console.log('Compartilhamento cancelado');
      }
    } else {
      // Fallback: copiar link
      navigator.clipboard.writeText(appUrl);
      alert('Link copiado para a área de transferência!');
    }
  };

  const generateQRCodeUrl = (url) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <ShareIcon className="w-5 h-5" />
        Compartilhar App
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Compartilhar App</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* QR Code */}
              <div className="text-center">
                <img
                  src={generateQRCodeUrl(appUrl)}
                  alt="QR Code do App"
                  className="mx-auto mb-2"
                />
                <p className="text-sm text-gray-600">
                  Escaneie com a câmera do celular
                </p>
              </div>

              {/* Botões de ação */}
              <div className="space-y-2">
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <ShareIcon className="w-5 h-5" />
                  Compartilhar Link
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(appUrl);
                    alert('Link copiado!');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  📋 Copiar Link
                </button>
              </div>

              {/* Instruções */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <DevicePhoneMobileIcon className="w-5 h-5" />
                  Como instalar no celular:
                </h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <div>
                    <strong>Android (Chrome):</strong>
                    <br />• Abra o link no Chrome
                    <br />• Toque em "Instalar app" ou menu ⋮ → "Adicionar à tela inicial"
                  </div>
                  <div>
                    <strong>iPhone (Safari):</strong>
                    <br />• Abra o link no Safari
                    <br />• Toque em 📤 → "Adicionar à Tela de Início"
                  </div>
                </div>
              </div>

              {/* Link para download */}
              <div className="text-center">
                <a
                  href={appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  {appUrl}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
