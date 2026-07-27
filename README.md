# Práctica: pipeline RAG completo

Proyecto de práctica del curso "Claude con la API" de Anthropic, sección de RAG (Retrieval-Augmented Generation). Implementa un pipeline completo con embeddings 100% locales y gratis — sin depender de un proveedor externo de pago.

## Qué hace

- **`chunking.mjs`** — 3 estrategias de segmentación de documentos (por tamaño fijo, por sección `##`, por oración). Probado con documentos reales: segmentar por estructura gana claramente cuando el documento ya tiene encabezados, mientras que segmentar por tamaño corta a mitad de palabra.
- **`embeddings.mjs`** — embeddings locales con `@xenova/transformers` (modelo `Xenova/all-MiniLM-L6-v2`, 384 dimensiones), soporta texto único o batch, sin llamadas a ninguna API externa.
- **`vectorStore.mjs`** (`VectorIndex`) — búsqueda semántica por distancia coseno.
- **`bm25.mjs`** (`BM25Index`) — búsqueda léxica BM25 propia (k1=1.5, b=0.75), sin dependencias externas.
- **`retriever.mjs`** (`Retriever`) — combina búsqueda semántica y BM25 con Reciprocal Rank Fusion (RRF).
- **`answerWithCitations.mjs`** — cierra el pipeline completo (retrieval → respuesta con citas verificables), usando la funcionalidad de citas nativa de la API de Anthropic.

## Cómo correrlo

```
npm install
npm run rag-demo
```

Todo funciona 100% gratis y local (chunking, embeddings, BM25, retriever) salvo `answerWithCitations.mjs`, que requiere una `ANTHROPIC_API_KEY` en `.env` (la función de citas es exclusiva de la API de Anthropic).

## Por qué existe este proyecto

Para entender de punta a punta cómo funciona un sistema RAG real — no solo "mandarle todo el documento a la IA" — sino segmentarlo bien, indexarlo por dos métodos distintos (semántico + léxico), combinarlos, y devolver respuestas con citas verificables al texto fuente exacto.
