import { pipeline } from '@xenova/transformers';

// Modelo local y gratis de embeddings (se descarga una sola vez, corre en tu propia PC, sin API key)
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

let extractorPromise = null;
function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', MODEL_NAME);
  }
  return extractorPromise;
}

/**
 * Genera embeddings para un texto o una lista de textos (soporta ambos, como pide la lección).
 * Devuelve un array de números (para un solo texto) o un array de arrays (para una lista).
 */
export async function generateEmbedding(textOrTexts) {
  const extractor = await getExtractor();
  const isBatch = Array.isArray(textOrTexts);
  const texts = isBatch ? textOrTexts : [textOrTexts];

  const results = [];
  for (const text of texts) {
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    results.push(Array.from(output.data));
  }

  return isBatch ? results : results[0];
}
