/**
 * Sistema de Toast/Notificações
 */

import { CONFIG } from '../core/config.js';

export const ToastService = {
    show: (message, type = CONFIG.TOAST.TYPES.INFO, duration = CONFIG.TOAST.DURATION) => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        
        const icons = {
            [CONFIG.TOAST.TYPES.SUCCESS]: 'check-circle',
            [CONFIG.TOAST.TYPES.WARNING]: 'alert-circle',
            [CONFIG.TOAST.TYPES.ERROR]: 'x-circle',
            [CONFIG.TOAST.TYPES.INFO]: 'info'
        };

        toast.innerHTML = `<i data-lucide="${icons[type]}"></i><span>${message}</span>`;
        container.appendChild(toast);
        
        if (window.lucide) window.lucide.createIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success: (msg) => ToastService.show(msg, CONFIG.TOAST.TYPES.SUCCESS),
    warning: (msg) => ToastService.show(msg, CONFIG.TOAST.TYPES.WARNING),
    error: (msg) => ToastService.show(msg, CONFIG.TOAST.TYPES.ERROR),
    info: (msg) => ToastService.show(msg, CONFIG.TOAST.TYPES.INFO)
};

export default ToastService;