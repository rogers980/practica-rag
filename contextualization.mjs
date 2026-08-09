import 'dotenv/config';
import OpenAI from 'openai';

const NVIDIA_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b';
const llm = new OpenAI({ apiKey: process.env.NVIDIA_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' });

const PROVIDE_CONTEXT_TOOL = {
  type: 'function',
  function: {
    name: 'provide_context',
    description: 'Registra el fragmento breve de contexto que sitúa un trozo de texto dentro de su documento fuente.',
    parameters: {
      type: 'object',
      properties: {
        context: { type: 'string', description: 'Contexto breve y conciso (1-2 frases), sin explicar el razonamiento ni repetir el fragmento original.' }
      },
      required: ['context']
    }
  }
};

/**
 * Le pide al modelo un contexto breve que "sitúe" el fragmento dentro del documento,
 * y lo antepone al texto original del fragmento. Usa tool_choice forzado en vez de
 * texto libre: probado que sin esto, el modelo a veces devuelve su razonamiento
 * interno completo en inglés en vez de solo el contexto pedido.
 */
export async function situateChunk(chunk, contextText) {
  const prompt = `Escribe un fragmento breve y conciso de contexto para situar este trozo dentro del documento fuente completo, con el fin de mejorar la recuperación en la búsqueda.

<document>
${contextText}
</document>

<chunk>
${chunk}
</chunk>

Llama a provide_context con ese contexto breve.`;

  const response = await llm.chat.completions.create({
    model: NVIDIA_MODEL,
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
    tools: [PROVIDE_CONTEXT_TOOL],
    tool_choice: { type: 'function', function: { name: 'provide_context' } }
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];
  if (!toolCall) {
    // Nemotron razona en "reasoning_content" antes de llamar a la herramienta — si se corta
    // por max_tokens a mitad del razonamiento, no llega a emitir el tool_call.
    const finishReason = response.choices[0].finish_reason;
    throw new Error(`El modelo no llamó a provide_context (finish_reason: ${finishReason}) — probablemente se quedó sin tokens razonando. Subí max_tokens si vuelve a pasar.`);
  }

  const { context } = JSON.parse(toolCall.function.arguments);
  return { context, contextualizedContent: `${context}\n${chunk}` };
}

/**
 * Contextualiza todos los fragmentos de una vez. Para documentos grandes, en vez de
 * mandar el documento completo a cada llamada, usa los primeros N fragmentos (suelen
 * traer el resumen) + los M fragmentos anteriores al actual (contexto local).
 */
export async function contextualizeChunks(chunks, { numStartChunks = 2, numPrevChunks = 2 } = {}) {
  const results = [];
  for (let i = 0; i < chunks.length; i++) {
    const startParts = chunks.slice(0, Math.min(numStartChunks, chunks.length));
    const prevParts = chunks.slice(Math.max(0, i - numPrevChunks), i);
    const contextText = [...new Set([...startParts, ...prevParts])].join('\n') || chunks[i];

    results.push(await situateChunk(chunks[i], contextText));
  }
  return results;
}
