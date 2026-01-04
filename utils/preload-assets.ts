import { Asset } from 'expo-asset';

import { cardImages } from '@/assets/images';

export async function preloadCardAssets() {
  try {
    await Asset.loadAsync(cardImages);
  } catch {
    // Non-fatal; continue without blocking
  }
}
