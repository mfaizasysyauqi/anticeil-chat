import { GatewayProvider } from './types';

export const EMBEDDINGS_PROVIDERS: GatewayProvider[] = [
  {
    id: 'jina-ai',
    name: 'Jina AI',
    category: 'embeddings',
    authType: 'apikey',
    badge: 'Embeddings',
    description: 'Multilingual embeddings, reranker models (jina-reranker-v2), and Reader API for web grounding.',
    website: 'https://jina.ai',
    models: ['jina/jina-embeddings-v3', 'jina/jina-reranker-v2-base-multilingual'],
    requiresKey: true,
  },
  {
    id: 'voyage-ai',
    name: 'Voyage AI',
    category: 'embeddings',
    authType: 'apikey',
    badge: 'Embeddings',
    description: 'State-of-the-art embedding models and rerankers optimized for retrieval quality (Anthropic recommended).',
    website: 'https://voyageai.com',
    models: ['voyage/voyage-3', 'voyage/voyage-3-large', 'voyage/voyage-code-3'],
    requiresKey: true,
  },
];
