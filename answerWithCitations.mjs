import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();
const MODEL = 'claude-sonnet-5';

/**
 * Cierra el círculo del RAG: toma los fragmentos ya recuperados (paso 5) y le pide
 * a Claude una respuesta final, citando exactamente qué texto de qué fragmento usó.
 */
export async function answerWithCitations(question, retrievedChunks) {
  const content = [
    ...retrievedChunks.map(chunk => ({
      type: 'document',
      source: { type: 'text', media_type: 'text/plain', data: chunk.content },
      title: `Sección ${chunk.id}`,
      citations: { enabled: true }
    })),
    { type: 'text', text: question }
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content }]
  });

  return response.content;
}
