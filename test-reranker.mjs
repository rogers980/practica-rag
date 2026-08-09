import { VectorIndex } from './vectorStore.mjs';
import { BM25Index } from './bm25.mjs';
import { Retriever } from './retriever.mjs';
import { rerankWithLLM } from './reranker.mjs';

// Mismo caso que la lección: un ID de incidente exacto aparece en 2 secciones,
// pero solo una es realmente relevante para "qué hizo el equipo de INGENIERÍA".
const chunks = [
  { id: 0, content: 'Análisis financiero: los ingresos del Q4 crecieron un 8% respecto al trimestre anterior, sin relación con INC-2023-Q4-011.' },
  { id: 1, content: 'Ciberseguridad: el incidente INC-2023-Q4-011 fue detectado por el equipo de seguridad, que bloqueó el acceso sospechoso y notificó a cumplimiento.' },
  { id: 2, content: 'Ingeniería de software: el equipo de ingeniería identificó la causa raíz de INC-2023-Q4-011 en el servicio de autenticación, escribió el parche, lo desplegó y agregó pruebas de regresión.' },
  { id: 3, content: 'Investigación médica: este año hubo avances en el estudio de un nuevo virus, sin relación con el incidente INC-2023-Q4-011.' }
];

const retriever = new Retriever(new VectorIndex(), new BM25Index());
for (const chunk of chunks) await retriever.addDocument(chunk);

const question = '¿Qué hizo el equipo de ingeniería con INC-2023-Q4-011?';
console.log(`Pregunta: "${question}"\n`);

const hybridResults = await retriever.search(question, 3);
console.log('--- Orden híbrido (BM25 + vectorial, RRF) ---');
for (const [doc, score] of hybridResults) {
  console.log(`  Sección ${doc.id} (score ${score.toFixed(4)}): ${doc.content.slice(0, 60)}...`);
}

const reranked = await rerankWithLLM(hybridResults, question, 3);
console.log('\n--- Orden final tras reranking con LLM ---');
reranked.forEach((doc, i) => {
  console.log(`  ${i + 1}. Sección ${doc.id}: ${doc.content.slice(0, 60)}...`);
});
