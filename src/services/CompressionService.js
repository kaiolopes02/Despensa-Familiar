/* ============================================================
   COMPRESSION SERVICE — Compressão LZ para compartilhamento via URL
   ============================================================ */

// Implementação inline do LZ-String (evita dependência externa)
const LZString = {
  compress(uncompressed) {
    if (!uncompressed) return '';
    let i, value,
      ctx_dict = {}, ctx_dictToCreate = {},
      ctx_c = '', ctx_wc = '', ctx_w = '',
      ctx_enlargeIn = 2, ctx_dictSize = 3, ctx_numBits = 2,
      ctx_data = [], ctx_data_val = 0, ctx_data_pos = 0, ii;

    for (ii = 0; ii < uncompressed.length; ii++) {
      ctx_c = uncompressed.charAt(ii);
      if (!Object.prototype.hasOwnProperty.call(ctx_dict, ctx_c)) {
        ctx_dict[ctx_c] = ctx_dictSize++;
        ctx_dictToCreate[ctx_c] = true;
      }
      ctx_wc = ctx_w + ctx_c;
      if (Object.prototype.hasOwnProperty.call(ctx_dict, ctx_wc)) {
        ctx_w = ctx_wc;
      } else {
        if (Object.prototype.hasOwnProperty.call(ctx_dictToCreate, ctx_w)) {
          if (ctx_w.charCodeAt(0) < 256) {
            for (i = 0; i < ctx_numBits; i++) {
              ctx_data_val = ctx_data_val << 1;
              if (ctx_data_pos === 15) { ctx_data_pos = 0; ctx_data.push(String.fromCharCode(ctx_data_val)); ctx_data_val = 0; } else ctx_data_pos++;
            }
            value = ctx_w.charCodeAt(0);
            for (i = 0; i < 8; i++) {
              ctx_data_val = (ctx_data_val << 1) | (value & 1);
              if (ctx_data_pos === 15) { ctx_data_pos = 0; ctx_data.push(String.fromCharCode(ctx_data_val)); ctx_data_val = 0; } else ctx_data_pos++;
              value >>= 1;
            }
          } else {
            value = 1;
            for (i = 0; i < ctx_numBits; i++) {
              ctx_data_val = (ctx_data_val << 1) | value;
              if (ctx_data_pos === 15) { ctx_data_pos = 0; ctx_data.push(String.fromCharCode(ctx_data_val)); ctx_data_val = 0; } else ctx_data_pos++;
              value = 0;
            }
            value = ctx_w.charCodeAt(0);
            for (i = 0; i < 16; i++) {
              ctx_data_val = (ctx_data_val << 1) | (value & 1);
              if (ctx_data_pos === 15) { ctx_data_pos = 0; ctx_data.push(String.fromCharCode(ctx_data_val)); ctx_data_val = 0; } else ctx_data_pos++;
              value >>= 1;
            }
          }
          ctx_enlargeIn--;
          if (ctx_enlargeIn === 0) { ctx_enlargeIn = Math.pow(2, ctx_numBits); ctx_numBits++; }
          delete ctx_dictToCreate[ctx_w];
        } else {
          value = ctx_dict[ctx_w];
          for (i = 0; i < ctx_numBits; i++) {
            ctx_data_val = (ctx_data_val << 1) | (value & 1);
            if (ctx_data_pos === 15) { ctx_data_pos = 0; ctx_data.push(String.fromCharCode(ctx_data_val)); ctx_data_val = 0; } else ctx_data_pos++;
            value >>= 1;
          }
        }
        ctx_enlargeIn--;
        if (ctx_enlargeIn === 0) { ctx_enlargeIn = Math.pow(2, ctx_numBits); ctx_numBits++; }
        ctx_dict[ctx_wc] = ctx_dictSize++;
        ctx_w = String(ctx_c);
      }
    }

    if (ctx_w !== '') {
      if (Object.prototype.hasOwnProperty.call(ctx_dictToCreate, ctx_w)) {
        if (ctx_w.charCodeAt(0) < 256) {
          for (i = 0; i < ctx_numBits; i++) {
            ctx_data_val <<= 1;
            if (ctx_data_pos === 15) { ctx_data_pos = 0; ctx_data.push(String.fromCharCode(ctx_data_val)); ctx_data_val = 0; } else ctx_data_pos++;
          }
          value = ctx_w.charCodeAt(0);
          for (i = 0; i < 8; i++) {
            ctx_data_val = (ctx_data_val << 1) | (value & 1);
            if (ctx_data_pos === 15) { ctx_data_pos = 0; ctx_data.push(String.fromCharCode(ctx_data_val)); ctx_data_val = 0; } else ctx_data_pos++;
            value >>= 1;
          }
        } else {
          value = 1;
          for (i = 0; i < ctx_numBits; i++) {
            ctx_data_val = (ctx_data_val << 1) | value;
            if (ctx_data_pos === 15) { ctx_data_pos = 0; ctx_data.push(String.fromCharCode(ctx_data_val)); ctx_data_val = 0; } else ctx_data_pos++;
            value = 0;
          }
          value = ctx_w.charCodeAt(0);
          for (i = 0; i < 16; i++) {
            ctx_data_val = (ctx_data_val << 1) | (value & 1);
            if (ctx_data_pos === 15) { ctx_data_pos = 0; ctx_data.push(String.fromCharCode(ctx_data_val)); ctx_data_val = 0; } else ctx_data_pos++;
            value >>= 1;
          }
        }
        ctx_enlargeIn--;
        if (ctx_enlargeIn === 0) { ctx_enlargeIn = Math.pow(2, ctx_numBits); ctx_numBits++; }
        delete ctx_dictToCreate[ctx_w];
      } else {
        value = ctx_dict[ctx_w];
        for (i = 0; i < ctx_numBits; i++) {
          ctx_data_val = (ctx_data_val << 1) | (value & 1);
          if (ctx_data_pos === 15) { ctx_data_pos = 0; ctx_data.push(String.fromCharCode(ctx_data_val)); ctx_data_val = 0; } else ctx_data_pos++;
          value >>= 1;
        }
      }
    }

    value = 2;
    for (i = 0; i < ctx_numBits; i++) {
      ctx_data_val = (ctx_data_val << 1) | (value & 1);
      if (ctx_data_pos === 15) { ctx_data_pos = 0; ctx_data.push(String.fromCharCode(ctx_data_val)); ctx_data_val = 0; } else ctx_data_pos++;
      value >>= 1;
    }
    while (true) {
      ctx_data_val <<= 1;
      if (ctx_data_pos === 15) { ctx_data.push(String.fromCharCode(ctx_data_val)); break; }
      else ctx_data_pos++;
    }
    return ctx_data.join('');
  },

  decompress(compressed) {
    if (!compressed) return '';
    let dict = [], next, enlargeIn = 4, dictSize = 4, numBits = 3,
      entry = '', result = [], i, w, bits, resb, maxpower, power, c,
      data = { val: compressed.charCodeAt(0), pos: 32768, idx: 1 };

    for (i = 0; i < 3; i++) dict[i] = i;
    bits = 0; maxpower = 4; power = 1;
    while (power !== maxpower) {
      resb = data.val & data.pos; data.pos >>= 1;
      if (data.pos === 0) { data.pos = 32768; data.val = compressed.charCodeAt(data.idx++); }
      bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
    }

    switch (next = bits) {
      case 0:
        bits = 0; maxpower = 256; power = 1;
        while (power !== maxpower) {
          resb = data.val & data.pos; data.pos >>= 1;
          if (data.pos === 0) { data.pos = 32768; data.val = compressed.charCodeAt(data.idx++); }
          bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
        }
        c = String.fromCharCode(bits); break;
      case 1:
        bits = 0; maxpower = 65536; power = 1;
        while (power !== maxpower) {
          resb = data.val & data.pos; data.pos >>= 1;
          if (data.pos === 0) { data.pos = 32768; data.val = compressed.charCodeAt(data.idx++); }
          bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
        }
        c = String.fromCharCode(bits); break;
      case 2: return '';
    }
    dict[3] = c; w = c; result.push(c);

    while (true) {
      if (data.idx > compressed.length) return '';
      bits = 0; maxpower = Math.pow(2, numBits); power = 1;
      while (power !== maxpower) {
        resb = data.val & data.pos; data.pos >>= 1;
        if (data.pos === 0) { data.pos = 32768; data.val = compressed.charCodeAt(data.idx++); }
        bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
      }
      switch (c = bits) {
        case 0:
          bits = 0; maxpower = 256; power = 1;
          while (power !== maxpower) {
            resb = data.val & data.pos; data.pos >>= 1;
            if (data.pos === 0) { data.pos = 32768; data.val = compressed.charCodeAt(data.idx++); }
            bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
          }
          dict[dictSize++] = String.fromCharCode(bits); c = dictSize - 1; enlargeIn--; break;
        case 1:
          bits = 0; maxpower = 65536; power = 1;
          while (power !== maxpower) {
            resb = data.val & data.pos; data.pos >>= 1;
            if (data.pos === 0) { data.pos = 32768; data.val = compressed.charCodeAt(data.idx++); }
            bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
          }
          dict[dictSize++] = String.fromCharCode(bits); c = dictSize - 1; enlargeIn--; break;
        case 2: return result.join('');
      }
      if (enlargeIn === 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
      if (dict[c]) entry = dict[c];
      else { if (c === dictSize) entry = w + w.charAt(0); else return null; }
      result.push(entry);
      dict[dictSize++] = w + entry.charAt(0);
      enlargeIn--;
      w = entry;
      if (enlargeIn === 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
    }
  },
};

export class CompressionService {
  /** Comprime dados para usar em uma URL */
  static compressForURL(data) {
    try {
      const json = JSON.stringify(data);
      const compressed = LZString.compress(json);
      // URL-safe base64
      return compressed
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } catch {
      return null;
    }
  }

  /** Descomprime dados vindos de uma URL */
  static decompressFromURL(str) {
    try {
      const restored = str
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const decompressed = LZString.decompress(restored);
      return JSON.parse(decompressed);
    } catch {
      return null;
    }
  }
}