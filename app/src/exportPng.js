// PNG export for Leonida Cover Studio.
//
// Each export renders the cover at its full post size on an offscreen canvas
// (the same renderCover the preview uses) and downloads the PNG the browser
// writes. Nothing leaves the machine.

import { SIZE_PRESETS } from './layouts.js';
import { renderCover } from './renderCover.js';

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG encoding failed'));
    }, 'image/png');
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function coverFilename(state, sizeKey) {
  const caption = (state.caption || 'cover').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cover';
  return `leonida-${caption}-${sizeKey}.png`;
}

// Renders and downloads one size. Returns the PNG's dimensions and byte size.
export async function exportCoverPng(state, photos, sizeKey) {
  const preset = SIZE_PRESETS[sizeKey] ?? SIZE_PRESETS.square;
  const canvas = document.createElement('canvas');
  canvas.width = preset.width;
  canvas.height = preset.height;
  renderCover(canvas, { ...state, size: sizeKey }, photos, { selection: false });
  const blob = await canvasToBlob(canvas);
  downloadBlob(blob, coverFilename(state, sizeKey));
  return { width: preset.width, height: preset.height, bytes: blob.size, size: sizeKey };
}

// Exports every post size in turn, with a short pause so the browser keeps
// each download.
export async function exportAllSizes(state, photos) {
  const results = [];
  for (const sizeKey of Object.keys(SIZE_PRESETS)) {
    results.push(await exportCoverPng(state, photos, sizeKey));
    await new Promise((r) => setTimeout(r, 350));
  }
  return results;
}
