import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chunkBySection } from './chunking.mjs';
import { VectorIndex } from './vectorStore.mjs';
import { BM25Index } from './bm25.mjs';
import { Retriever } from './retriever.mjs';
import { answerWithCitations } from './answerWithCitations.mjs';

const README_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'practica-herramientas', 'README.md');
const text = fs.readFileSync(README_PATH, 'utf-8');
const chunks = chunkBySection(text).map((content, id) => ({ id, content }));

const retriever = new Retriever(new VectorIndex(), new BM25Index());
for (const chunk of chunks) {
  await retriever.addDocument(chunk);
}

const question = process.argv.slice(2).join(' ') || '¿Qué bug se encontró y cómo se arregló?';
console.log(`Pregunta: "${question}"\n`);

const topChunks = (await retriever.search(question, 2)).map(([doc]) => doc);
console.log(`Fragmentos recuperados: ${topChunks.map(c => `Sección ${c.id}`).join(', ')}\n`);

const answerBlocks = await answerWithCitations(question, topChunks);

for (const block of answerBlocks) {
  if (block.type === 'text') {
    console.log('Texto:', block.text);
    if (block.citations) {
      for (const cite of block.citations) {
        console.log(`  → cita: "${cite.cited_text}" (${cite.document_title})`);
      }
    }
  }
}
