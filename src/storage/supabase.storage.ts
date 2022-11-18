import { createReadStream } from 'fs';
import { UploadedFile } from 'adminjs';

import { BaseProvider } from '@adminjs/upload';
import { FileObject, StorageClient, StorageError } from '@supabase/storage-js';

export type SupabaseOptions = {
  bucket?: string;
  storageUrl?: string;
  serviceKey?: string;
};

export class SupabaseProvider extends BaseProvider {
  private supabase: StorageClient;

  constructor(options: SupabaseOptions) {
    super(options.bucket);
    const storageClient = new StorageClient(options.storageUrl, {
      apikey: options.serviceKey,
      Authorization: `Bearer ${options.serviceKey}`,
    });
    this.supabase = storageClient;
    console.log('constructor', this.supabase);
  }

  public async upload(
    file: UploadedFile,
    key: string,
  ): Promise<
    | {
        data: { path: string };
        error: null;
      }
    | {
        data: null;
        error: StorageError;
      }
  > {
    console.log('in upload', createReadStream);
    const tmpFile = createReadStream(file.path);
    console.log('in upload', this.bucket);
    return this.supabase.from(this.bucket).upload(key, tmpFile);
  }

  public async delete(
    key: string,
    bucket: string,
  ): Promise<
    | {
        data: FileObject[];
        error: null;
      }
    | {
        data: null;
        error: StorageError;
      }
  > {
    return this.supabase.from(bucket).remove([key]);
  }

  public async path(key: string, bucket: string): Promise<string> {
    const expireIn = 60;

    const { data } = await this.supabase
      .from(bucket)
      .createSignedUrl(key, expireIn);
    console.log('in path', data);
    if (data) {
      return data.signedUrl;
    }
    return '';
  }
}
