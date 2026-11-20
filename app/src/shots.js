// Fixed scenes for screenshots.
//
// A `?shot=` query puts the app into a known state for a screenshot instead
// of the default editor: `?shot=cover` hides the controls and shows the cover
// alone, `?shot=editor` shows the editor with a photo loaded. The other query
// parameters pick the scene:
//
//   layout   hero | strip | film
//   grade    sunset | neon | heat | noir
//   size     square | portrait | landscape
//   title    the chrome title
//   subtitle the small caps line under it
//   photos   five comma-separated photo ids, one per panel
//
// window.__shotReady is set once the scene has painted, so a screenshot tool
// can wait for it instead of guessing a delay.

/** The default five-panel photo line-up for a shot scene. */
const DEFAULT_PHOTOS = ['boulevard', 'sunset-bay', 'pier', 'neon-street', 'sunset-bay'];

/**
 * Applies a shot scene to the editor `app` (the object main.js builds):
 * state first, then a repaint, then the ready flag. Returns true when a shot
 * query was present.
 */
export async function runShot(app, query) {
  const shot = query.get('shot');
  if (!shot) return false;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const layout = query.get('layout');
  const grade = query.get('grade');
  const size = query.get('size');
  if (layout) app.setLayout(layout);
  if (grade) app.setGrade(grade);
  if (size) app.setSize(size);
  const title = query.get('title');
  const subtitle = query.get('subtitle');
  if (title !== null) app.setTitle(title);
  if (subtitle !== null) app.setSubtitle(subtitle);
  const photos = (query.get('photos') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const lineup = photos.length === 5 ? photos : DEFAULT_PHOTOS;
  app.setLineup(lineup);
  await document.fonts.ready;
  app.repaint();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
  return true;
}
