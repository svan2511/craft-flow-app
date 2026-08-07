export const CLOUDINARY_CLOUD_NAME = 'du33cvn3j';
export const CLOUDINARY_UPLOAD_PRESET = 'craft-flow-orders';
export const CLOUDINARY_FOLDER = 'craft-flow/orders';

export class CloudinaryUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CloudinaryUploadError';
  }
}

export async function uploadImageToCloudinary(fileUri: string): Promise<string> {
  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new CloudinaryUploadError('Cloudinary upload preset is not configured.');
  }

  const formData = new FormData();
  const parts = fileUri.split('/');
  const fileName = parts[parts.length - 1] || `upload-${Date.now()}.jpg`;
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: 'image/jpeg',
  } as unknown as Blob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', CLOUDINARY_FOLDER);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      },
    );

    const payload = (await response.json()) as {
      secure_url?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new CloudinaryUploadError(
        payload.error?.message ?? `Cloudinary upload failed (${response.status}).`,
      );
    }

    if (!payload.secure_url) {
      throw new CloudinaryUploadError('Cloudinary did not return an image URL.');
    }

    return payload.secure_url;
  } catch (e) {
    if (e instanceof CloudinaryUploadError) {
      throw e;
    }
    if (e instanceof Error && e.name === 'AbortError') {
      throw new CloudinaryUploadError('Cloudinary upload timed out.');
    }
    throw new CloudinaryUploadError(
      e instanceof Error ? e.message : 'Could not reach Cloudinary.',
    );
  } finally {
    clearTimeout(timer);
  }
}
