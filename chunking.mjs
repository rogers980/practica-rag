// 3 estrategias de segmentación de texto para RAG (Recuperación Aumentada de Generación)

// 1) Por tamaño (con solapamiento) — la más simple y confiable, funciona con cualquier texto
export function chunkByChar(text, { chunkSize = 150, chunkOverlap = 20 } = {}) {
  const chunks = [];
  let startIdx = 0;

  while (startIdx < text.length) {
    const endIdx = Math.min(startIdx + chunkSize, text.length);
    chunks.push(text.slice(startIdx, endIdx));
    startIdx = endIdx < text.length ? endIdx - chunkOverlap : text.length;
  }

  return chunks;
}

// 2) Por estructura — divide por encabezados de sección Markdown ("## "). Solo sirve si el documento está bien formateado.
export function chunkBySection(documentText) {
  return documentText.split(/\n## /).map((chunk, i) => (i === 0 ? chunk : `## ${chunk}`));
}

// 3) Por oración (con solapamiento) — punto intermedio entre tamaño y estructura
export function chunkBySentence(text, { maxSentencesPerChunk = 5, overlapSentences = 1 } = {}) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());

  const chunks = [];
  let startIdx = 0;

  while (startIdx < sentences.length) {
    const endIdx = Math.min(startIdx + maxSentencesPerChunk, sentences.length);
    chunks.push(sentences.slice(startIdx, endIdx).join(' '));
    startIdx += maxSentencesPerChunk - overlapSentences;
    if (startIdx < 0) startIdx = 0;
  }

  return chunks;
}
