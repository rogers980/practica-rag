import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chunkBySection } from './chunking.mjs';
import { generateEmbedding } from './embeddings.mjs';
import { VectorIndex } from './vectorStore.mjs';
import { BM25Index } from './bm25.mjs';

const README_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'practica-herramientas', 'README.md');
const text = fs.readFileSync(README_PATH, 'utf-8');
const chunks = chunkBySection(text);

const query = process.argv.slice(2).join(' ') || '¿Qué relación tiene process.cwd() con el bug?';
console.log(`Pregunta: "${query}"\n`);

// Búsqueda semántica
const embeddings = await generateEmbedding(chunks);
const vectorStore = new VectorIndex();
chunks.forEach((chunk, i) => vectorStore.addVector(embeddings[i], { content: chunk }));
const queryEmbedding = await generateEmbedding(query);
const semanticResults = vectorStore.search(queryEmbedding, 3);

console.log('--- Búsqueda SEMÁNTICA (distancia, más bajo = más parecido) ---');
semanticResults.forEach(([doc, distance], i) => {
  const heading = doc.content.trim().split('\n')[0];
  console.log(`${i + 1}) [${distance.toFixed(4)}] ${heading}`);
});

// Búsqueda BM25
const bm25Store = new BM25Index();
chunks.forEach(chunk => bm25Store.addDocument({ content: chunk }));
const bm25Results = bm25Store.search(query, 3);

console.log('\n--- Búsqueda BM25 (score, más alto = más relevante) ---');
bm25Results.forEach(([doc, score], i) => {
  const heading = doc.content.trim().split('\n')[0];
  console.log(`${i + 1}) [${score.toFixed(4)}] ${heading}`);
});
