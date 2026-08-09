import 'dotenv/config';
import OpenAI from 'openai';

// Reordena resultados ya combinados (RRF) pidiéndole al modelo que juzgue relevancia real,
// no solo similitud numérica. Mismo proveedor NVIDIA que practica-herramientas.
const NVIDIA_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b';
const llm = new OpenAI({ apiKey: process.env.NVIDIA_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' });

const SELECT_DOCS_TOOL = {
  type: 'function',
  function: {
    name: 'select_relevant_docs',
    description: 'Devuelve los IDs de los documentos más relevantes para la pregunta del usuario, ordenados de mayor a menor relevancia.',
    parameters: {
      type: 'object',
      properties: {
        document_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs de los documentos candidatos, en orden de relevancia decreciente (el primero es el más relevante para la pregunta).'
        }
      },
      required: ['document_ids']
    }
  }
};

/**
 * results: salida de Retriever.search(), un arreglo de [doc, score].
 * Devuelve los mismos docs, reordenados por relevancia real según el modelo (no solo RRF).
 */
export async function rerankWithLLM(results, queryText, k = results.length) {
  const docs = results.map(([doc]) => doc);

  const joinedDocs = docs
    .map((doc) => `<document><document_id>${doc.id}</document_id><document_content>${doc.content}</document_content></document>`)
    .join('\n');

  const prompt = `Encuentra los documentos más relevantes para la pregunta del usuario.

<user_question>
${queryText}
</user_question>

Estos son los documentos candidatos:
<documents>
${joinedDocs}
</documents>

Llama a select_relevant_docs con los ${k} documentos más relevantes, en orden de relevancia decreciente.`;

  const response = await llm.chat.completions.create({
    model: NVIDIA_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
    tools: [SELECT_DOCS_TOOL],
    tool_choice: { type: 'function', function: { name: 'select_relevant_docs' } }
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];
  if (!toolCall) {
    throw new Error('El modelo no llamó a select_relevant_docs — no se pudo reordenar.');
  }

  const { document_ids } = JSON.parse(toolCall.function.arguments);
  const byId = new Map(docs.map((doc) => [String(doc.id), doc]));

  return document_ids
    .map((id) => byId.get(String(id)))
    .filter(Boolean)
    .slice(0, k);
}
