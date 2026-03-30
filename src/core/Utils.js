/* ============================================================
   UTILS — Funções utilitárias reutilizáveis
   ============================================================ */

export class Utils {
  /** Gera um ID único baseado em timestamp + aleatoriedade */
  static generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /** Escapa caracteres HTML para evitar XSS */
  static escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  /** Formata data para pt-BR legível */
  static formatDate(date = new Date()) {
    return new Intl.DateTimeFormat('pt-BR', {
      day:    'numeric',
      month:  'short',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Cria uma versão debounced de uma função.
   * Útil para buscas e inputs que chamam setState.
   */
  static debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Valida nome e quantidade de um item antes de adicionar/editar.
   * @returns { valid, errors, data }
   */
  static validateItem(name, quantity, maxLength = 100) {
    const errors = [];

    if (!name?.trim()) {
      errors.push('O nome do item é obrigatório');
    } else if (name.trim().length > maxLength) {
      errors.push(`Nome muito longo (máximo ${maxLength} caracteres)`);
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      errors.push('Quantidade mínima é 1');
    } else if (qty > 999) {
      errors.push('Quantidade máxima é 999');
    }

    return {
      valid: errors.length === 0,
      errors,
      data: { name: name?.trim(), quantity: isNaN(qty) ? 1 : qty },
    };
  }
}