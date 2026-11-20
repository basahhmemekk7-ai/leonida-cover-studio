// PNG export for Leonida Cover Studio.
//
// Export renders the current cover offscreen at a post size's full resolution
// and downloads it as a PNG. The offscreen canvas is thrown away after each
// export, so exporting never disturbs the preview. All three sizes export the
// same state — only the canvas dimensions and the layout geometry change.

import { drawCover } from './render.js';
import { SIZES, sizeById } from './layouts.js';

/** Renders `state` at `size` into a fresh canvas and returns it. */
export function renderOffscreen(state, size) {
  const canvas = document.createElement('canvas');
  drawCover(canvas, { ...state, size });
  return canvas;
}

/** The download filename for a cover at a size. */
export function exportName(size) {
  return `leonida-cover-${size.w}x${size.h}.png`;
}

/**
 * Downloads the cover at `sizeId` as a PNG. Resolves to the filename once the
 * download has started, or rejects when the canvas cannot produce a blob.
 */
export function exportPng(state, sizeId) {
  const size = sizeById(sizeId);
  const canvas = renderOffscreen(state, size);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG export failed'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportName(size);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(exportName(size));
    }, 'image/png');
  });
}

/**
 * Downloads the cover at all three post sizes, one after another with a short
 * pause between them so the browser keeps each download.
 */
export async function exportAllSizes(state) {
  const names = [];
  for (const size of SIZES) {
    names.push(await exportPng(state, size.id));
    await new Promise((r) => setTimeout(r, 350));
  }
  return names;
}
