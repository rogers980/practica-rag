import { generateEmbedding } from './embeddings.mjs';

// Base de datos vectorial simple, en memoria, con búsqueda por distancia coseno

function cosineDistance(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return 1 - similarity; // distancia: 0 = idéntico, más alto = menos parecido
}

export class VectorIndex {
  constructor() {
    this.vectors = [];
  }

  // Misma interfaz que BM25Index: recibe el documento con texto crudo, calcula el embedding por dentro.
  async addDocument(doc) {
    const embedding = await generateEmbedding(doc.content);
    this.vectors.push({ embedding, ...doc });
  }

  async search(queryText, topK = 2) {
    const queryEmbedding = await generateEmbedding(queryText);
    const scored = this.vectors.map(entry => ({
      doc: entry,
      distance: cosineDistance(queryEmbedding, entry.embedding)
    }));

    scored.sort((a, b) => a.distance - b.distance);
    return scored.slice(0, topK).map(({ doc, distance }) => [doc, distance]);
  }
}
