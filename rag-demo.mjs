import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chunkBySection } from './chunking.mjs';
import { generateEmbedding } from './embeddings.mjs';
import { VectorIndex } from './vectorStore.mjs';

const README_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'practica-herramientas', 'README.md');

// Paso 1: dividir el texto en fragmentos (por sección, ya sabemos que es lo mejor para este documento)
const text = fs.readFileSync(README_PATH, 'utf-8');
const chunks = chunkBySection(text);
console.log(`Paso 1 - ${chunks.length} fragmentos generados.\n`);

// Paso 2: generar embeddings para todos los fragmentos a la vez (batch)
console.log('Paso 2 - Generando embeddings locales (puede tardar unos segundos la primera vez, descarga el modelo)...');
const embeddings = await generateEmbedding(chunks);
console.log(`Listo. Cada embedding tiene ${embeddings[0].length} dimensiones.\n`);

// Paso 3: crear el almacén de vectores y guardar cada embedding con su texto original
const store = new VectorIndex();
for (let i = 0; i < embeddings.length; i++) {
  store.addVector(embeddings[i], { content: chunks[i] });
}
console.log(`Paso 3 - ${store.vectors.length} vectores guardados en el índice.\n`);

// Paso 4: generar embedding para la pregunta del usuario
const userQuestion = process.argv.slice(2).join(' ') || '¿Qué bug se encontró y se arregló en el proyecto?';
console.log(`Paso 4 - Pregunta del usuario: "${userQuestion}"`);
const userEmbedding = await generateEmbedding(userQuestion);

// Paso 5: buscar los fragmentos más relevantes
const results = store.search(userEmbedding, 2);
console.log(`\nPaso 5 - Los 2 fragmentos más relevantes:\n`);
for (const [doc, distance] of results) {
  console.log(`Distancia: ${distance.toFixed(4)}`);
  console.log(doc.content.trim().slice(0, 200) + '...\n');
}
