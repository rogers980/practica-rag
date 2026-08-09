import { contextualizeChunks } from './contextualization.mjs';

// Mismo corpus sintético de test-reranker.mjs, para ver qué contexto genera el modelo
// para cada sección dentro del informe completo.
const chunks = [
  'Análisis financiero: los ingresos del Q4 crecieron un 8% respecto al trimestre anterior, sin relación con INC-2023-Q4-011.',
  'Ciberseguridad: el incidente INC-2023-Q4-011 fue detectado por el equipo de seguridad, que bloqueó el acceso sospechoso y notificó a cumplimiento.',
  'Ingeniería de software: el equipo de ingeniería identificó la causa raíz de INC-2023-Q4-011 en el servicio de autenticación, escribió el parche, lo desplegó y agregó pruebas de regresión.',
  'Investigación médica: este año hubo avances en el estudio de un nuevo virus, sin relación con el incidente INC-2023-Q4-011.'
];

const results = await contextualizeChunks(chunks, { numStartChunks: 1, numPrevChunks: 1 });

results.forEach(({ context, contextualizedContent }, i) => {
  console.log(`--- Fragmento ${i} ---`);
  console.log(`Contexto generado: ${context}`);
  console.log(`Fragmento contextualizado:\n${contextualizedContent}\n`);
});
