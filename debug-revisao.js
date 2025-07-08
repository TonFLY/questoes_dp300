// Debug script - cole isso no console do navegador
console.log('=== DEBUG QUESTÕES MÚLTIPLA ESCOLHA ===');

// Verificar uma questão da revisão
const questionElements = document.querySelectorAll('.revision-question');
if (questionElements.length > 0) {
  console.log('Questões encontradas na tela:', questionElements.length);
  
  // Pegar dados de uma questão via React
  const reactFiber = questionElements[0]._reactInternalFiber || 
                     questionElements[0].__reactInternalInstance;
  
  if (reactFiber) {
    console.log('React Fiber encontrado');
  }
}

// Verificar dados no localStorage ou sessionStorage
const keys = Object.keys(localStorage);
console.log('Chaves no localStorage:', keys);

// Se você conseguir acessar os dados das questões, execute:
// console.log('Questão atual:', question);

console.log('=== Execute: revisaoUtils.listarSimples() para ver questões ===');
