import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chunkBySection } from './chunking.mjs';
import { VectorIndex } from './vectorStore.mjs';
import { BM25Index } from './bm25.mjs';
import { Retriever } from './retriever.mjs';

const README_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'practica-herramientas', 'README.md');
const text = fs.readFileSync(README_PATH, 'utf-8');

// Le damos un id explícito a cada fragmento para poder juntar resultados de ambos índices.
const chunks = chunkBySection(text).map((content, id) => ({ id, content }));

const retriever = new Retriever(new VectorIndex(), new BM25Index());

console.log('Indexando en ambos motores (semántico + BM25)...');
for (const chunk of chunks) {
  await retriever.addDocument(chunk);
}

const query = process.argv.slice(2).join(' ') || '¿Qué relación tiene process.cwd() con el bug?';
console.log(`\nPregunta: "${query}"\n`);

const results = await retriever.search(query, 3);

console.log('--- Resultado HÍBRIDO (RRF, más alto = más relevante) ---');
results.forEach(([doc, score], i) => {
  const heading = doc.content.trim().split('\n')[0];
  console.log(`${i + 1}) [score ${score.toFixed(4)}] ${heading}`);
});
