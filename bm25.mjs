// Búsqueda léxica BM25 — encuentra coincidencias EXACTAS de términos, en vez de significado

const K1 = 1.5;
const B = 0.75;

function tokenize(text) {
  return (text.toLowerCase().match(/\w+/g) || []);
}

export class BM25Index {
  constructor() {
    this.documents = []; // { content, tokens, termFreq: Map }
  }

  addDocument(doc) {
    const tokens = tokenize(doc.content);
    const termFreq = new Map();
    for (const t of tokens) {
      termFreq.set(t, (termFreq.get(t) || 0) + 1);
    }
    this.documents.push({ ...doc, tokens, termFreq });
  }

  _documentFrequency(term) {
    return this.documents.filter(d => d.termFreq.has(term)).length;
  }

  _avgDocLength() {
    const total = this.documents.reduce((sum, d) => sum + d.tokens.length, 0);
    return total / this.documents.length;
  }

  search(query, topK = 2) {
    const queryTerms = tokenize(query);
    const N = this.documents.length;
    const avgDocLength = this._avgDocLength();

    const scored = this.documents.map(doc => {
      let score = 0;
      for (const term of queryTerms) {
        const df = this._documentFrequency(term);
        if (df === 0) continue;

        const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
        const f = doc.termFreq.get(term) || 0;
        const denom = f + K1 * (1 - B + B * (doc.tokens.length / avgDocLength));
        score += idf * ((f * (K1 + 1)) / (denom || 1));
      }
      return { doc, score };
    });

    scored.sort((a, b) => b.score - a.score); // más alto = más relevante (al revés que la distancia coseno)
    return scored.slice(0, topK).map(({ doc, score }) => [doc, score]);
  }
}
