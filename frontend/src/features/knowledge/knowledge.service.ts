
import apiClient from '@/src/lib/api';

export interface Document {
  id: string;
  workspace_id: string;
  collection_id: string;
  title: string;
  source_url?: string;
  status: string;
  created_at: string;
  meta?: {
      original_filename?: string;
      cloudinary_public_id?: string;
  }
}

export const uploadDocument = async (workspaceId: string, collectionId: string, file: File): Promise<Document> => {
  const formData = new FormData();
  formData.append('workspace_id', workspaceId);
  formData.append('collection_id', collectionId);
  formData.append('file', file);

  // No process=true in FormData by default, matching new requirement "do not create embedding" on upload
  // If we wanted to process, we'd append('process', 'true'); but user said upload does NOT create embedding.
  
  const response = await apiClient.post('/knowledge/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    // timeout: 120000, // 2 minutes timeout for large uploads
  });
  return response.data;
};

export const getDocuments = async (workspaceId: string): Promise<Document[]> => {
  const response = await apiClient.get('/knowledge', {
    params: { workspace_id: workspaceId }
  });
  return response.data;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  await apiClient.delete(`/knowledge/${documentId}`);
};
