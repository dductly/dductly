import { supabase } from '../lib/supabaseClient';

export interface Attachment {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  url: string;
}

const BUCKET_NAME = 'attachments';

export const storageService = {
  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: File,
    userId: string,
    recordType: 'expense' | 'income',
    recordId: string
  ): Promise<Attachment | null> {
    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      // Use the appropriate folder based on record type
      const folder = recordType === 'expense' ? 'expense-attachments' : 'income-attachments';
      const filePath = `${folder}/${userId}/${recordId}/${timestamp}_${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading file:', error);
        return null;
      }

      // Generate a signed URL that expires in 1 hour
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(data.path, 3600); // 3600 seconds = 1 hour

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
        return null;
      }

      return {
        id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        path: data.path,
        type: file.type,
        size: file.size,
        url: signedUrlData.signedUrl,
      };
    } catch (error) {
      console.error('Error in uploadFile:', error);
      return null;
    }
  },

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    userId: string,
    recordType: 'expense' | 'income',
    recordId: string
  ): Promise<Attachment[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, userId, recordType, recordId)
    );
    const results = await Promise.all(uploadPromises);
    return results.filter((r): r is Attachment => r !== null);
  },

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in deleteFile:', error);
      return false;
    }
  },

  /**
   * Delete multiple files
   */
  async deleteFiles(filePaths: string[]): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filePaths);

      if (error) {
        console.error('Error deleting files:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in deleteFiles:', error);
      return false;
    }
  },

  /**
   * Get a fresh signed URL for a file path (useful when stored URLs expire)
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }
      return data.signedUrl;
    } catch (error) {
      console.error('Error in getSignedUrl:', error);
      return null;
    }
  },

  /**
   * Get fresh signed URLs for multiple attachments
   */
  async refreshAttachmentUrls(attachments: Attachment[]): Promise<Attachment[]> {
    const refreshed = await Promise.all(
      attachments.map(async (attachment) => {
        const newUrl = await this.getSignedUrl(attachment.path);
        return {
          ...attachment,
          url: newUrl || attachment.url,
        };
      })
    );
    return refreshed;
  },
};
