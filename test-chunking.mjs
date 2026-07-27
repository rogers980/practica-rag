import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chunkByChar, chunkBySection, chunkBySentence } from './chunking.mjs';

const README_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'practica-herramientas', 'README.md');
const text = fs.readFileSync(README_PATH, 'utf-8');

console.log(`Documento real: ${README_PATH}`);
console.log(`Tamaño total: ${text.length} caracteres\n`);

function report(name, chunks) {
  console.log(`--- ${name}: ${chunks.length} fragmentos ---`);
  chunks.forEach((c, i) => {
    const preview = c.trim().replace(/\s+/g, ' ').slice(0, 90);
    console.log(`  [${i}] (${c.length} chars): "${preview}${c.length > 90 ? '...' : ''}"`);
  });
  console.log('');
}

report('1) Por tamaño (150 chars, solapamiento 20)', chunkByChar(text, { chunkSize: 150, chunkOverlap: 20 }));
report('2) Por estructura (secciones ## )', chunkBySection(text));
report('3) Por oración (5 oraciones, solapamiento 1)', chunkBySentence(text, { maxSentencesPerChunk: 5, overlapSentences: 1 }));
