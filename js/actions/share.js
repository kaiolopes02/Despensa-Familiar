/**
 * Share Actions
 * Gerencia compartilhamento via URL e clipboard
 */

import { state } from '../core/state.js';
import { ToastService } from '../ui/toast.js';
import { Utils } from '../core/utils.js';

export const ShareActions = {
    /**
     * Compartilha lista atual
     */
    share: () => {
        const items = state.items;

        if (items.length === 0) {
            ToastService.warning('A lista está vazia!');
            return;
        }

        const pending = items.filter(i => !i.checked);
        
        try {
            const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(items))));
            const link = `${window.location.origin}${window.location.pathname}?lista=${encoded}`;

            const text = 
                '🛒 *Minha Lista de Despensa*\n\n' +
                (pending.length 
                    ? pending.map(i => `• ${i.name} (${i.quantity})`).join('\n')
                    : '_(todos os itens já foram comprados)_') +
                `\n\n🔗 Acesse e edite: ${link}`;

            if (navigator.share) {
                navigator.share({ 
                    title: 'Lista de Despensa', 
                    text 
                }).catch(() => {
                    // User cancelled share
                });
            } else {
                navigator.clipboard.writeText(text)
                    .then(() => ToastService.success('Lista copiada!'))
                    .catch(() => ToastService.error('Não foi possível copiar.'));
            }
        } catch (error) {
            console.warn('[Share] Erro ao compartilhar:', error);
            ToastService.error('Erro ao compartilhar lista.');
        }
    },

    /**
     * Importa lista da URL
     * @returns {Array|null} Itens importados ou null
     */
    importFromUrl: () => {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get('lista');

        if (!encoded) return null;

        try {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(encoded))));
            
            if (!Array.isArray(decoded)) {
                console.warn('[Share] Dados importados não são um array');
                return null;
            }

            if (decoded.length === 0) {
                console.warn('[Share] Lista importada está vazia');
                return null;
            }

            // Valida estrutura dos itens
            const validItems = decoded.every(item => 
                item && 
                typeof item.name === 'string' && 
                item.name.trim().length > 0
            );

            if (!validItems) {
                console.warn('[Share] Itens importados com estrutura inválida');
                return null;
            }

            if (confirm('Você recebeu uma lista compartilhada. Deseja carregar?')) {
                // Limpa URL sem recarregar
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Retorna itens com novos IDs
                return decoded.map(item => ({
                    ...item,
                    id: Utils.generateId(),
                    checked: item.checked || false
                }));
            }
        } catch (error) {
            console.warn('[Share] Falha ao importar:', error);
            ToastService.error('Lista compartilhada inválida.');
        }

        return null;
    },

    /**
     * Exporta lista como JSON
     * @returns {string} JSON string
     */
    exportToJson: () => {
        const items = state.items;
        
        if (items.length === 0) {
            ToastService.warning('A lista está vazia!');
            return null;
        }

        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            items: items.map(item => ({
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                checked: item.checked
            }))
        };

        return JSON.stringify(exportData, null, 2);
    },

    /**
     * Download da lista como arquivo JSON
     */
    downloadJson: () => {
        const json = ShareActions.exportToJson();
        
        if (!json) return;

        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `despensa-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        ToastService.success('Lista exportada!');
    },

    /**
     * Importa lista de arquivo JSON
     * @param {File} file 
     * @returns {Promise<Array>} Itens importados
     */
    importFromJson: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (!data.items || !Array.isArray(data.items)) {
                        reject(new Error('Formato inválido'));
                        return;
                    }

                    const validItems = data.items.filter(item => 
                        item && 
                        typeof item.name === 'string' && 
                        item.name.trim().length > 0
                    );

                    if (validItems.length === 0) {
                        reject(new Error('Nenhum item válido'));
                        return;
                    }

                    resolve(validItems.map(item => ({
                        id: Utils.generateId(),
                        name: item.name.trim(),
                        category: item.category || 'Outros',
                        quantity: parseInt(item.quantity) || 1,
                        checked: item.checked || false
                    })));
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    }
};

export default ShareActions;