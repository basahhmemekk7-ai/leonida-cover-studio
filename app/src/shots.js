// Fixed scenes for screenshots: ?shot=cover shows one exported cover alone,
// full-bleed, at the screenshot's own size; ?shot=editor shows the editor
// with the demo cover loaded. Query parameters pick the size, layout, grade
// and caption. window.__shotReady is set once the scene has painted.

import { SIZE_PRESETS } from './layouts.js';

function shotSize(query) {
  const key = query.get('size') ?? 'wide';
  return SIZE_PRESETS[key] ?? SIZE_PRESETS.wide;
}

export async function runShotMode(query, api) {
  const shot = query.get('shot');
  if (!shot) return false;

  const caption = query.get('caption');
  const subtitle = query.get('subtitle');
  const layout = query.get('layout');
  const grade = query.get('grade');
  const size = query.get('size');

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    await api.loadDemoCover({ caption, subtitle, layout, grade, size });
    const preset = shotSize(query);
    api.renderCoverAt(preset.width, preset.height);
  } else if (shot === 'editor') {
    await api.loadDemoCover({ caption, subtitle, layout, grade, size });
    api.setStatus('Demo cover loaded. Click a panel, pick a photo, drag to position it.');
  } else {
    return false;
  }

  await document.fonts.ready;
  if (shot === 'editor') api.renderPreview();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
  return true;
}
