import { deriveNaturalCenter } from '@cronus/natural-center';

export async function runNCDerivation(params: {
  brandId: string;
  assetIds: string[];
  toneDescription?: string;
}): Promise<void> {
  await deriveNaturalCenter(params);
}
