// sprites.js — Carga sprite sheets, recorta sprites y quita el fondo magenta
const SpriteManager = {
  sprites: {},
  ready: false,

  sheets: [
    { url: 'assets/enemies.png', cols: 5, rows: 1, chroma: true,
      keys: ['goblin', 'bandit', 'skeleton', 'dark_knight', 'rogelio'] },
    { url: 'assets/towers.png', cols: 3, rows: 1, chroma: true,
      keys: ['archer', 'mage', 'cannon'] },
    { url: 'assets/icons.png', cols: 5, rows: 1, chroma: true,
      keys: ['heart', 'coin', 'skull', 'wave', 'time'] },
    { url: 'assets/tiles.png', cols: 4, rows: 1, chroma: false,
      keys: ['grass', 'path', 'path_edge', 'grass_flower'] }
  ],

  loadAll: function (callback) {
    let pending = this.sheets.length;
    this.sheets.forEach(sheet => {
      const img = new Image();
      img.onload = () => {
        this.processSheet(img, sheet);
        if (--pending === 0) { this.ready = true; if (callback) callback(); }
      };
      img.onerror = () => {
        sheet.keys.forEach(k => this.sprites[k] = this.createPlaceholder(k));
        if (--pending === 0) { this.ready = true; if (callback) callback(); }
      };
      img.src = sheet.url;
    });
  },

  init: function (cb) { this.loadAll(cb); },

  processSheet: function (img, sheet) {
    const cw = Math.floor(img.width / sheet.cols);
    const ch = Math.floor(img.height / sheet.rows);
    sheet.keys.forEach((key, i) => {
      const cx = (i % sheet.cols) * cw;
      const cy = Math.floor(i / sheet.cols) * ch;
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, cx, cy, cw, ch, 0, 0, 64, 64);
      if (sheet.chroma) this.removeMagenta(ctx);
      this.sprites[key] = canvas;
    });
  },

  removeMagenta: function (ctx) {
    const data = ctx.getImageData(0, 0, 64, 64);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i] > 150 && px[i + 2] > 150 && px[i + 1] < 120) px[i + 3] = 0;
    }
    ctx.putImageData(data, 0, 0);
  },

  getSprite: function (key) { return this.sprites[key]; },

  createPlaceholder: function (key) {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    let color = '#888888';
    if (key.includes('archer')) color = '#4CAF50';
    else if (key.includes('mage')) color = '#2196F3';
    else if (key.includes('cannon')) color = '#795548';
    else if (key.includes('goblin')) color = '#8BC34A';
    else if (key.includes('bandit')) color = '#FF5722';
    else if (key.includes('skeleton')) color = '#EEEEEE';
    else if (key.includes('dark_knight')) color = '#3F51B5';
    else if (key.includes('rogelio')) color = '#F44336';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);
    return canvas;
  },

  drawPixelPerfect: function (ctx, key, x, y, scale = 1) {
    const sprite = this.getSprite(key);
    if (!sprite) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, x, y, sprite.width * scale, sprite.height * scale);
    ctx.imageSmoothingEnabled = true;
  }
};
const Sprites = SpriteManager; // alias por si tu juego usa otro nombre
