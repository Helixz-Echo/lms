/**
 * Upload and document-related type definitions
 */

export interface Document {
  id: number;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface TrainingDocument extends Document {
  session_id?: string;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  error?: string;
  document?: Document;
}
