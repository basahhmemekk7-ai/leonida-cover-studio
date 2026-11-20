// Photo loading and per-panel state for Leonida Cover Studio.
//
// Photos come from two places only: the bundled samples under samples/, and
// files the person picks on their own machine (read with FileReader into an
// object URL). Nothing is ever uploaded anywhere.

export const SAMPLE_PHOTOS = [
  { id: 'boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', name: 'Pier', src: 'samples/pier.jpg' },
  { id: 'sunset', name: 'Sunset Bay', src: 'samples/sunset.jpg' },
  { id: 'neon', name: 'Neon Street', src: 'samples/neon.jpg' },
];

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

export class PhotoStore {
  constructor() {
    this.photos = new Map();
    this.uploadCount = 0;
  }

  has(id) {
    return this.photos.has(id);
  }

  get(id) {
    return this.photos.get(id);
  }

  list() {
    return [...this.photos.values()];
  }

  async loadSample(sample) {
    if (this.photos.has(sample.id)) return this.photos.get(sample.id);
    const img = await loadImage(sample.src);
    const photo = { id: sample.id, name: sample.name, img, sample: true };
    this.photos.set(sample.id, photo);
    return photo;
  }

  async loadSamples() {
    return Promise.all(SAMPLE_PHOTOS.map((s) => this.loadSample(s)));
  }

  // Reads a user-picked file locally and registers it as a photo.
  async loadFile(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      this.uploadCount += 1;
      const id = `upload-${this.uploadCount}`;
      const photo = { id, name: file.name.replace(/\.[^.]+$/, ''), img, objectUrl: url };
      this.photos.set(id, photo);
      return photo;
    } catch (err) {
      URL.revokeObjectURL(url);
      throw err;
    }
  }
}

// One panel's view of its photo: which photo, how far zoomed, where panned.
// panX/panY are fractions of the available slack (-1..1), so any photo fits.
export function defaultPanelView(photoId) {
  return { photoId, zoom: 1, panX: 0, panY: 0 };
}

export function clonePanelViews(views) {
  return views.map((v) => ({ ...v }));
}
