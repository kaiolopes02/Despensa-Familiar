/* ============================================================
   TOAST MANAGER — Notificações contextuais com ícones e progresso
   ============================================================ */

const ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

const DURATIONS = {
  success: 3200,
  error:   5000,
  warning: 4000,
  info:    3500,
};

export class ToastManager {
  constructor() {
    this._container = document.getElementById('toastContainer');
  }

  /**
   * Exibe um toast na tela.
   * @param {string} message - Mensagem a exibir
   * @param {'success'|'error'|'warning'|'info'} type - Tipo do toast
   * @param {number} [duration] - Duração em ms (usa padrão do tipo se omitido)
   */
  show(message, type = 'info', duration) {
    if (!this._container) return;

    const ms = duration ?? DURATIONS[type] ?? 3500;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${ICONS[type] ?? ICONS.info}</span>
      <span class="toast-msg">${message}</span>
      <div class="toast-progress" style="animation-duration: ${ms}ms"></div>
    `;

    this._container.appendChild(toast);

    // Inicia animação da barra de progresso no próximo frame
    requestAnimationFrame(() => {
      toast.querySelector('.toast-progress')?.classList.add('running');
    });

    // Auto-dismiss
    const timer = setTimeout(() => this._dismiss(toast), ms);

    // Clique para fechar imediatamente
    toast.addEventListener('click', () => {
      clearTimeout(timer);
      this._dismiss(toast);
    });
  }

  _dismiss(toast) {
    if (!toast.isConnected) return;
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    // Fallback caso animationend não dispare
    setTimeout(() => toast.remove(), 400);
  }

  success(msg, duration) { this.show(msg, 'success', duration); }
  error(msg, duration)   { this.show(msg, 'error',   duration); }
  warning(msg, duration) { this.show(msg, 'warning', duration); }
  info(msg, duration)    { this.show(msg, 'info',    duration); }
}