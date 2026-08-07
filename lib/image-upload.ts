import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { uploadImageToCloudinary } from '@/lib/cloudinary';

const MAX_DIMENSION = 1280;
const COMPRESS_QUALITY = 0.6;

export async function resizeImage(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: MAX_DIMENSION, height: MAX_DIMENSION });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: COMPRESS_QUALITY,
  });
  return result.uri;
}

export async function prepareAndUploadImage(
  localUri: string,
  onProgress?: (stage: 'resizing' | 'uploading') => void,
): Promise<string> {
  onProgress?.('resizing');
  const resizedUri = await resizeImage(localUri);
  onProgress?.('uploading');
  return uploadImageToCloudinary(resizedUri);
}
