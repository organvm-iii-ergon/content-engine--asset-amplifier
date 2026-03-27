import sharp from 'sharp';
import { DesignFormat } from './formats.js';
import { DesignAnalysis } from './analyzer.js';

/**
 * Resizes a design to a target format using smart cropping based on analysis.
 */
export async function resizeToFormat(params: {
  buffer: Buffer;
  format: DesignFormat;
  analysis: DesignAnalysis;
}): Promise<Buffer> {
  const { buffer, format } = params;

  return sharp(buffer)
    .resize(format.width, format.height, {
      fit: 'cover',
      position: sharp.strategy.entropy // Use entropy-based cropping for MVP
    })
    .toBuffer();
}
