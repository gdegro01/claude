// QR-codes in Making Waves-stijl. Gebruikt qrcode-generator (qrcode.js) voor de matrix
// en tekent zelf de SVG: modules als verticale "blinds"-balkjes, afgeronde hoekogen,
// optioneel het MW-teken in het midden.
//
//   mwQR("ABCD2345", { style: "blinds", eye: "#CF1C7E" })  -> "<svg ...>"
//
// Stijlen: "square" (klassiek), "dots" (rondjes), "blinds" (verticale balkjes).
// De grenzen (balkdikte, logo, kleur) zijn getest met drie scanners, zie LEESMIJ.
(function () {
  const MW_MARK = "M182.73 50.957L0 50.957C0 50.957 35.877 0 93.276 0C150.675 0 182.726 50.957 182.726 50.957Z";

  function matrix(text, ecl, minVersion) {
    const mode = /^[0-9A-Z $%*+\-./:]*$/.test(text) ? "Alphanumeric" : "Byte";
    // versie 0 laat de bibliotheek zelf de kleinste passende versie kiezen
    const versions = minVersion ? Array.from({ length: 41 - minVersion }, (_, i) => minVersion + i) : [0];
    for (const v of versions) {
      try {
        const qr = qrcode(v, ecl);
        qr.addData(text, mode);
        qr.make();
        return qr;
      } catch (e) { /* te klein: volgende versie */ }
    }
    throw new Error("QR past niet");
  }

  function inFinder(r, c, n) {
    return (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8);
  }

  function finder(x, y, color, style) {
    if (style === "square") {
      return `<path fill="${color}" fill-rule="evenodd" d="M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5z"/>` +
        `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="${color}"/>`;
    }
    // afgeronde ring en een afgerond hart
    const ring = `M${x + 2} ${y}h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z` +
      `M${x + 2.2} ${y + 1}a1.2 1.2 0 0 0-1.2 1.2v2.6a1.2 1.2 0 0 0 1.2 1.2h2.6a1.2 1.2 0 0 0 1.2-1.2v-2.6a1.2 1.2 0 0 0-1.2-1.2z`;
    return `<path fill="${color}" fill-rule="evenodd" d="${ring}"/>` +
      `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.9" fill="${color}"/>`;
  }

  window.mwQR = function (text, opts) {
    const o = Object.assign({
      style: "blinds", ecl: "M", fg: "#2A2D35", eye: null, bg: "#FFFFFF",
      margin: 3, bar: 0.78, logo: false, logoSize: 0.22, logoColor: null, minVersion: 0,
    }, opts || {});
    const qr = matrix(text, o.logo ? "H" : o.ecl, o.logo ? Math.max(o.minVersion, 2) : o.minVersion);
    const n = qr.getModuleCount();
    const m = o.margin;
    const size = n + 2 * m;
    const eye = o.eye || o.fg;

    // middengebied vrijhouden voor het logo
    let clear = () => false;
    if (o.logo) {
      const k = Math.max(3, Math.round(n * o.logoSize) | 1);
      const a = (n - k) / 2, b = a + k;
      clear = (r, c) => r >= a - 0.5 && r < b - 0.5 && c >= a - 0.5 && c < b - 0.5;
    }
    const dark = (r, c) => r >= 0 && c >= 0 && r < n && c < n && qr.isDark(r, c) && !inFinder(r, c, n) && !clear(r, c);

    let body = "";
    if (o.style === "blinds") {
      const w = o.bar, inset = 0.07;
      for (let c = 0; c < n; c++) {
        let r = 0;
        while (r < n) {
          if (!dark(r, c)) { r++; continue; }
          const start = r;
          while (r < n && dark(r, c)) r++;
          const len = r - start;
          body += `<rect x="${(c + m + (1 - w) / 2).toFixed(3)}" y="${(start + m + inset).toFixed(3)}" ` +
            `width="${w}" height="${(len - 2 * inset).toFixed(3)}" rx="${(w / 2).toFixed(3)}"/>`;
        }
      }
    } else if (o.style === "dots") {
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        if (dark(r, c)) body += `<circle cx="${c + m + 0.5}" cy="${r + m + 0.5}" r="${o.bar / 2}"/>`;
      }
    } else {
      let d = "";
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        if (dark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
      }
      body = `<path d="${d}"/>`;
    }

    const eyes = finder(m, m, eye, o.style) + finder(m + n - 7, m, eye, o.style) + finder(m, m + n - 7, eye, o.style);

    let logo = "";
    if (o.logo) {
      const k = Math.max(3, Math.round(n * o.logoSize) | 1);
      const s = k - 1.2;              // het teken past in het vrije vlak, met wat lucht
      const scale = s / 182.73;
      const h = 152.5 * scale;
      const x = m + (n - s) / 2, y = m + (n - h) / 2;
      const color = o.logoColor || eye;
      logo = `<g transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${scale.toFixed(5)})" fill="${color}">` +
        `<path d="${MW_MARK}"/><path transform="translate(0 50.957)" d="${MW_MARK}"/>` +
        `<path transform="translate(0 101.543)" d="${MW_MARK}"/></g>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="geometricPrecision" role="img" aria-label="QR-code ${text}">` +
      `<rect width="${size}" height="${size}" fill="${o.bg}" rx="${o.bgRadius || 0}"/>` +
      `<g fill="${o.fg}">${body}</g>${eyes}${logo}</svg>`;
  };
})();
