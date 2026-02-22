
import apiClient from '@/src/lib/api';

export interface Document {
  id: string;
  workspace_id: string;
  collection_id: string;
  title: string;
  source_type: string;
  source_url?: string;
  status: string;
  language?: string;
  created_at: string;
  updated_at: string;
  meta?: {
      original_filename?: string;
      cloudinary_public_id?: string;
      tags?: string[];
      file_size?: number;
      content_type?: string;
      content_preview?: string;
      crawl_source?: string;
  }
}

export interface Collection {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  meta?: Record<string, any>;
  created_at: string;
  updated_at: string;
  document_count: number;
}

export interface ChunkResult {
  content: string;
  document_title: string;
  document_id: string;
  score: number;
}

export interface TestQueryResponse {
  query: string;
  results: ChunkResult[];
  suggested_improvements?: string;
}

// ─── Document APIs ───

export const uploadDocument = async (workspaceId: string, collectionId: string, file: File): Promise<Document> => {
  const formData = new FormData();
  formData.append('workspace_id', workspaceId);
  formData.append('collection_id', collectionId);
  formData.append('file', file);

  const response = await apiClient.post('/knowledge/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getDocuments = async (workspaceId: string, collectionId?: string): Promise<Document[]> => {
  const params: any = { workspace_id: workspaceId };
  if (collectionId) params.collection_id = collectionId;
  const response = await apiClient.get('/knowledge', { params });
  return response.data;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  await apiClient.delete(`/knowledge/${documentId}`);
};

export const processDocument = async (documentId: string): Promise<Document> => {
  const response = await apiClient.post(`/knowledge/${documentId}/process`);
  return response.data;
};

export const moveDocumentToCollection = async (documentId: string, collectionId: string): Promise<Document> => {
  const response = await apiClient.patch(`/knowledge/${documentId}/collection/${collectionId}`);
  return response.data;
};

// ─── Text Ingestion ───

export const ingestText = async (
  workspaceId: string, 
  collectionId: string, 
  title: string, 
  content: string, 
  contentType: string = 'text',
  tags?: string[]
): Promise<Document> => {
  const response = await apiClient.post('/knowledge/text', {
    workspace_id: workspaceId,
    collection_id: collectionId,
    title,
    content,
    content_type: contentType,
    tags,
  });
  return response.data;
};

// ─── Website Crawl ───

export const crawlWebsite = async (
  workspaceId: string, 
  collectionId: string, 
  url: string, 
  maxDepth: number = 2, 
  maxPages: number = 50
): Promise<{ status: string; message: string }> => {
  const response = await apiClient.post('/knowledge/crawl', {
    workspace_id: workspaceId,
    collection_id: collectionId,
    url,
    max_depth: maxDepth,
    max_pages: maxPages,
  });
  return response.data;
};

// ─── Collections ───

export const getCollections = async (workspaceId: string): Promise<Collection[]> => {
  const response = await apiClient.get('/knowledge/collections', {
    params: { workspace_id: workspaceId },
  });
  return response.data;
};

export const createCollection = async (workspaceId: string, name: string, description?: string): Promise<Collection> => {
  const response = await apiClient.post('/knowledge/collections', {
    workspace_id: workspaceId,
    name,
    description,
  });
  return response.data;
};

export const updateCollection = async (collectionId: string, data: { name?: string; description?: string }): Promise<Collection> => {
  const response = await apiClient.put(`/knowledge/collections/${collectionId}`, data);
  return response.data;
};

export const deleteCollection = async (collectionId: string): Promise<void> => {
  await apiClient.delete(`/knowledge/collections/${collectionId}`);
};

// ─── Test Query / Answer Preview ───

export const testQuery = async (workspaceId: string, query: string, collectionId?: string, limit: number = 5): Promise<TestQueryResponse> => {
  const response = await apiClient.post('/knowledge/test-query', {
    workspace_id: workspaceId,
    query,
    collection_id: collectionId || undefined,
    limit,
  });
  return response.data;
};
