/**
 * Form UI Controller
 * Gerencia estado e validação do formulário
 */

import { CONFIG } from '../core/config.js';
import { Utils } from '../core/utils.js';
import { Renderer } from './renderer.js';

export const FormUI = {
    elements: null,

    /**
     * Inicializa referências aos elementos do formulário
     */
    init: () => {
        FormUI.elements = {
            name: document.getElementById('itemName'),
            category: document.getElementById('itemCategory'),
            quantity: document.getElementById('itemQuantity'),
            editId: document.getElementById('editId'),
            addBtn: document.getElementById('addBtn'),
            qtyMinus: document.getElementById('qtyMinus'),
            qtyPlus: document.getElementById('qtyPlus')
        };

        FormUI._attachListeners();
    },

    /**
     * Attach event listeners do formulário
     */
    _attachListeners: () => {
        const { qtyMinus, qtyPlus, name } = FormUI.elements;

        qtyMinus?.addEventListener('click', () => {
            const el = FormUI.elements.quantity;
            if (el && parseInt(el.value) > CONFIG.VALIDATION.MIN_QUANTITY) {
                el.value = parseInt(el.value) - 1;
            }
        });

        qtyPlus?.addEventListener('click', () => {
            const el = FormUI.elements.quantity;
            if (el && parseInt(el.value) < CONFIG.VALIDATION.MAX_QUANTITY) {
                el.value = parseInt(el.value) + 1;
            }
        });

        name?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                FormUI._triggerSubmit();
            }
        });
    },

    /**
     * Trigger submit do formulário
     */
    _triggerSubmit: () => {
        FormUI.elements.addBtn?.click();
    },

    /**
     * Obtém valores do formulário
     * @returns {Object} Valores do form
     */
    getValues: () => {
        const { name, category, quantity, editId } = FormUI.elements;

        return {
            name: name?.value.trim() || '',
            category: category?.value || CONFIG.CATEGORIES[0],
            quantity: parseInt(quantity?.value) || 1,
            editId: editId?.value || null
        };
    },

    /**
     * Valida valores do formulário
     * @returns {Object} { valid, errors }
     */
    validate: () => {
        const values = FormUI.getValues();
        return Utils.validateItem(values.name, values.quantity);
    },

    /**
     * Limpa formulário para estado inicial
     */
    reset: () => {
        const { name, category, quantity, editId, addBtn } = FormUI.elements;

        if (name) name.value = '';
        if (category) category.value = CONFIG.CATEGORIES[0];
        if (quantity) quantity.value = CONFIG.VALIDATION.MIN_QUANTITY.toString();
        if (editId) editId.value = '';

        if (addBtn) {
            addBtn.innerHTML = '<i data-lucide="plus-circle"></i><span>Adicionar à Lista</span>';
            addBtn.classList.remove('editing');
        }

        if (window.lucide) window.lucide.createIcons();
        if (name) name.focus();
    },

    /**
     * Prepara formulário para edição
     * @param {Object} item - Item a ser editado
     */
    setEditMode: (item) => {
        const { name, category, quantity, editId, addBtn } = FormUI.elements;

        if (name) name.value = item.name;
        if (category) category.value = item.category;
        if (quantity) quantity.value = item.quantity.toString();
        if (editId) editId.value = item.id;

        if (addBtn) {
            addBtn.innerHTML = '<i data-lucide="save"></i><span>Salvar Alterações</span>';
            addBtn.classList.add('editing');
        }

        if (window.lucide) window.lucide.createIcons();

        if (name) {
            name.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    /**
     * Verifica se está em modo de edição
     * @returns {boolean}
     */
    isEditing: () => {
        const { editId } = FormUI.elements;
        return editId?.value && editId.value !== '';
    },

    /**
     * Cancela edição e retorna ao estado inicial
     */
    cancelEdit: () => {
        FormUI.reset();
    },

    /**
     * Focus no campo de nome
     */
    focusName: () => {
        FormUI.elements.name?.focus();
    },

    /**
     * Set quantity directly
     * @param {number} value 
     */
    setQuantity: (value) => {
        const { quantity } = FormUI.elements;
        const val = Math.max(
            CONFIG.VALIDATION.MIN_QUANTITY,
            Math.min(CONFIG.VALIDATION.MAX_QUANTITY, parseInt(value) || 1)
        );
        if (quantity) quantity.value = val.toString();
    }
};

export default FormUI;