// Combina varios índices de búsqueda (que compartan la misma interfaz addDocument/search)
// usando Reciprocal Rank Fusion (RRF).

export class Retriever {
  constructor(...indexes) {
    if (indexes.length === 0) {
      throw new Error('Hay que darle al menos un índice de búsqueda.');
    }
    this.indexes = indexes;
  }

  async addDocument(doc) {
    for (const index of this.indexes) {
      await index.addDocument(doc);
    }
  }

  async search(queryText, k = 2, kRrf = 60) {
    // Buscamos en TODOS los índices (más resultados de los que finalmente devolvemos,
    // para que el ranking cruzado tenga margen de sobra).
    const perIndexResults = await Promise.all(
      this.indexes.map(index => index.search(queryText, Math.max(k * 3, 10)))
    );

    const scoreById = new Map(); // id del fragmento -> { doc, score }

    perIndexResults.forEach(results => {
      results.forEach(([doc, _scoreOriginal], i) => {
        const rank = i + 1; // rank empieza en 1, como en el ejemplo de la lección
        const rrfContribution = 1 / (kRrf + rank);

        const existing = scoreById.get(doc.id);
        if (existing) {
          existing.score += rrfContribution;
        } else {
          scoreById.set(doc.id, { doc, score: rrfContribution });
        }
      });
    });

    const merged = Array.from(scoreById.values());
    merged.sort((a, b) => b.score - a.score); // más alto = más relevante

    return merged.slice(0, k).map(({ doc, score }) => [doc, score]);
  }
}
