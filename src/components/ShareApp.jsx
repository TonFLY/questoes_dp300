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
        className="btn btn-secondary"
      >
        <ShareIcon className="heroicon h-4 w-4 mr-2" />
        Compartilhar App
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Compartilhar App</h3>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.5rem' }}
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
                  className="btn btn-success"
                  style={{ width: '100%' }}
                >
                  <ShareIcon className="heroicon" />
                  Compartilhar Link
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(appUrl);
                    alert('Link copiado!');
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth="1.5" 
                    stroke="currentColor" 
                    className="heroicon"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" 
                    />
                  </svg>
                  Copiar Link
                </button>
              </div>

              {/* Instruções */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <DevicePhoneMobileIcon className="heroicon" />
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
