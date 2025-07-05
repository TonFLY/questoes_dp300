// Script para adicionar questões de exemplo ao Firestore
// Execute este código no console do navegador após fazer login

import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const questoesExemplo = [
  {
    enunciado: "No Microsoft SQL Server, qual comando é usado para criar um backup completo de um banco de dados?",
    alternativas: [
      "BACKUP DATABASE nome_banco TO DISK = 'caminho_arquivo'",
      "CREATE BACKUP nome_banco TO FILE = 'caminho_arquivo'", 
      "EXPORT DATABASE nome_banco TO 'caminho_arquivo'",
      "SAVE DATABASE nome_banco AS 'caminho_arquivo'"
    ],
    respostaCorreta: "A",
    comentario: "O comando BACKUP DATABASE é a forma correta de criar um backup completo no SQL Server. A sintaxe completa inclui o nome do banco de dados e o destino do arquivo de backup.",
    tags: ["SQL Server", "Backup", "DBA"],
    nivel: "intermediario",
    categoria: "Administração"
  },
  {
    enunciado: "Qual tipo de índice no SQL Server oferece melhor performance para consultas que retornam grandes volumes de dados?",
    alternativas: [
      "Índice Clustered",
      "Índice Non-Clustered", 
      "Índice Columnstore",
      "Índice Filtered"
    ],
    respostaCorreta: "C",
    comentario: "Índices Columnstore são otimizados para consultas analíticas que processam grandes volumes de dados, oferecendo melhor compressão e performance para esse tipo de workload.",
    tags: ["SQL Server", "Índices", "Performance"],
    nivel: "avançado",
    categoria: "Otimização"
  },
  {
    enunciado: "No Azure SQL Database, qual ferramenta fornece recomendações automáticas de otimização de performance?",
    alternativas: [
      "Azure Monitor",
      "Query Store", 
      "Automatic Tuning",
      "SQL Analytics"
    ],
    respostaCorreta: "C",
    comentario: "O Automatic Tuning do Azure SQL Database fornece recomendações automáticas e pode implementar automaticamente melhorias de performance, como criação de índices e correção de planos de execução.",
    tags: ["Azure", "SQL Database", "Automatic Tuning"],
    nivel: "intermediario",
    categoria: "Cloud"
  },
  {
    enunciado: "Qual é o nível de isolamento de transação padrão no SQL Server?",
    alternativas: [
      "READ UNCOMMITTED",
      "READ COMMITTED", 
      "REPEATABLE READ",
      "SERIALIZABLE"
    ],
    respostaCorreta: "B",
    comentario: "READ COMMITTED é o nível de isolamento padrão no SQL Server. Ele garante que uma transação não pode ler dados não confirmados de outras transações, evitando dirty reads.",
    tags: ["SQL Server", "Transações", "Isolamento"],
    nivel: "básico",
    categoria: "Conceitos"
  },
  {
    enunciado: "No contexto de Always On Availability Groups, quantas réplicas síncronas são recomendadas para alta disponibilidade?",
    alternativas: [
      "1 réplica síncrona",
      "2 réplicas síncronas", 
      "3 réplicas síncronas",
      "4 réplicas síncronas"
    ],
    respostaCorreta: "B",
    comentario: "É recomendado usar 2 réplicas síncronas para alta disponibilidade: uma primária e uma secundária síncrona. Isso garante que os dados sejam confirmados em ambas as réplicas antes do commit da transação.",
    tags: ["SQL Server", "Always On", "Alta Disponibilidade"],
    nivel: "avançado",
    categoria: "Alta Disponibilidade"
  }
];

export async function adicionarQuestoesExemplo() {
  try {
    console.log('Adicionando questões de exemplo...');
    
    for (const questao of questoesExemplo) {
      await addDoc(collection(db, 'questoes'), {
        ...questao,
        criadoEm: new Date(),
        ativo: true,
        autor: 'Sistema'
      });
    }
    
    console.log('Questões de exemplo adicionadas com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar questões:', error);
  }
}

// Para usar, execute no console:
// adicionarQuestoesExemplo();
