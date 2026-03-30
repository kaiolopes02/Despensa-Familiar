/* ============================================================
   SHARE SERVICE — Compartilhamento e exportação de listas
   ============================================================ */

import { CONFIG } from '../core/Config.js';
import { CompressionService } from './CompressionService.js';

export class ShareService {
  constructor(stateManager, toastManager) {
    this.state = stateManager;
    this.toast = toastManager;
  }

  /** Compartilha a lista (itens pendentes) via URL comprimida */
  share() {
    const pending = this.state.state.items.filter(i => !i.checked);

    if (pending.length === 0) {
      this.toast.warning('Não há itens pendentes para compartilhar!');
      return;
    }

    const payload = {
      v: 2,
      items: pending.map(i => ({ n: i.name, c: i.category, q: i.quantity })),
      t: Date.now(),
    };

    const compressed = CompressionService.compressForURL(payload);
    if (!compressed) {
      this.toast.error('Erro ao gerar link de compartilhamento');
      return;
    }

    const base = `${window.location.origin}${window.location.pathname}`;
    const shareUrl = `${base}?d=${compressed}`;

    if (shareUrl.length > CONFIG.STORAGE.MAX_URL_LENGTH) {
      this.toast.warning('Lista muito grande para link. Use a exportação por arquivo.');
      return;
    }

    const text = [
      '🛒 Lista de Compras',
      '',
      ...pending.map(i => `• ${i.name} (${i.quantity}x)`),
      '',
      `🔗 ${shareUrl}`,
    ].join('\n');

    if (navigator.share) {
      navigator.share({ title: 'Lista de Compras', text, url: shareUrl })
        .catch(() => {}); // usuário pode cancelar
    } else {
      navigator.clipboard
        .writeText(text)
        .then(() => this.toast.success('Link copiado para a área de transferência!'))
        .catch(() => this.toast.error('Não foi possível copiar. Tente manualmente.'));
    }
  }

  /** Exporta todos os itens como arquivo JSON */
  exportToFile() {
    const items = this.state.state.items;

    if (items.length === 0) {
      this.toast.warning('A lista está vazia!');
      return;
    }

    const data = {
      version:    '2.0',
      exportedAt: new Date().toISOString(),
      items,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `despensa-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.toast.success('Arquivo exportado com sucesso!');
  }
}