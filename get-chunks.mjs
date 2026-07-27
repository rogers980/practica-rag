import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chunkBySection } from './chunking.mjs';
import { VectorIndex } from './vectorStore.mjs';
import { BM25Index } from './bm25.mjs';
import { Retriever } from './retriever.mjs';

const README_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'practica-herramientas', 'README.md');
const text = fs.readFileSync(README_PATH, 'utf-8');
const chunks = chunkBySection(text).map((content, id) => ({ id, content }));

const retriever = new Retriever(new VectorIndex(), new BM25Index());
for (const chunk of chunks) {
  await retriever.addDocument(chunk);
}

const question = process.argv.slice(2).join(' ') || '¿Qué bug se encontró y cómo se arregló?';
const topChunks = (await retriever.search(question, 2)).map(([doc]) => ({ id: doc.id, content: doc.content }));

console.log(JSON.stringify({ question, topChunks }, null, 2));
