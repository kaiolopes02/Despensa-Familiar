/* ============================================================
   FORM COMPONENT — Adição e edição de itens
   ============================================================ */

import { Utils }   from '../core/Utils.js';
import { CONFIG }  from '../core/Config.js';

export class FormComponent {
  constructor(stateManager, toastManager) {
    this.state = stateManager;
    this.toast = toastManager;
    this._els  = {};
    this._init();
  }

  _init() {
    this._cacheElements();
    this._attachListeners();

    // Escuta evento de edição disparado pelo ListComponent
    document.addEventListener('edit-item', (e) => {
      if (e.detail) this._enterEditMode(e.detail);
    });
  }

  _cacheElements() {
    const ids = [
      'itemName', 'itemCategory', 'itemQuantity',
      'editId', 'addBtn', 'cancelEditBtn', 'btnText',
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) this._els[id] = el;
    });
    this._els.stepperBtns   = document.querySelectorAll('.stepper-btn');
    this._els.formSection   = document.querySelector('.form-section');
    this._els.filterChips   = document.getElementById('filterChips');
    this._els.searchInput   = document.getElementById('searchInput');
    this._els.searchClear   = document.getElementById('searchClear');
  }

  _attachListeners() {
    // ── Adicionar / salvar ──────────────────────────────────
    this._els.addBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });

    // ── Cancelar edição ─────────────────────────────────────
    this._els.cancelEditBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this._resetForm();
    });

    // ── Stepper de quantidade ───────────────────────────────
    this._els.stepperBtns?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const input = this._els.itemQuantity;
        if (!input) return;
        let val = parseInt(input.value) || 1;
        if (btn.dataset.action === 'plus'  && val < 999) val++;
        if (btn.dataset.action === 'minus' && val > 1)   val--;
        input.value = val;
        // Micro-animação de feedback
        input.style.transform = 'scale(1.18)';
        setTimeout(() => { input.style.transform = ''; }, 130);
      });
    });

    // ── Enter no campo nome ─────────────────────────────────
    this._els.itemName?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this._handleSubmit(); }
    });

    // ── Filtros de categoria (delegação) ────────────────────
    this._els.filterChips?.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      document.querySelectorAll('.chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      this.state.setState({ filter: chip.dataset.filter });
    });

    // ── Busca com debounce ──────────────────────────────────
    if (this._els.searchInput) {
      const debouncedSearch = Utils.debounce((val) => {
        this.state.setState({ searchQuery: val });
      }, CONFIG.VALIDATION.DEBOUNCE_MS);

      this._els.searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        debouncedSearch(val);
        // Mostrar/ocultar botão de limpar busca
        if (this._els.searchClear) {
          this._els.searchClear.classList.toggle('hidden', val.length === 0);
        }
      });
    }

    // ── Limpar busca ────────────────────────────────────────
    this._els.searchClear?.addEventListener('click', () => {
      if (this._els.searchInput) this._els.searchInput.value = '';
      this._els.searchClear?.classList.add('hidden');
      this.state.setState({ searchQuery: '' });
      this._els.searchInput?.focus();
    });
  }

  _handleSubmit() {
    const name     = this._els.itemName?.value?.trim();
    const category = this._els.itemCategory?.value || CONFIG.CATEGORIES[0].id;
    const quantity = parseInt(this._els.itemQuantity?.value) || 1;
    const editId   = this._els.editId?.value;

    const validation = Utils.validateItem(name, quantity, CONFIG.VALIDATION.MAX_NAME_LENGTH);

    if (!validation.valid) {
      this.toast.warning(validation.errors[0]);
      this._shakeInput(this._els.itemName);
      return;
    }

    if (editId) {
      // ── Modo edição ─────────────────────────────────────
      const items = this.state.state.items.map(item =>
        item.id === editId
          ? { ...item, name: validation.data.name, category, quantity: validation.data.quantity, updatedAt: Date.now() }
          : item
      );
      this.state.setState({ items });
      this.toast.success('Item atualizado com sucesso!');
      this._resetForm();
    } else {
      // ── Modo adição ──────────────────────────────────────
      const exists = this.state.state.items.some(
        i => i.name.toLowerCase() === validation.data.name.toLowerCase()
      );
      if (exists) {
        this.toast.warning('Este item já está na lista!');
        this._shakeInput(this._els.itemName);
        return;
      }

      const newItem = {
        id:        Utils.generateId(),
        name:      validation.data.name,
        category,
        quantity:  validation.data.quantity,
        checked:   false,
        createdAt: Date.now(),
      };

      this.state.setState({ items: [...this.state.state.items, newItem] });
      this.toast.success('Item adicionado! ✓');
      this._resetForm();
    }
  }

  _shakeInput(input) {
    if (!input) return;
    input.classList.add('input-error');
    input.focus();
    setTimeout(() => input.classList.remove('input-error'), 600);
  }

  _enterEditMode(item) {
    if (this._els.itemName)     this._els.itemName.value     = item.name;
    if (this._els.itemCategory) this._els.itemCategory.value = item.category;
    if (this._els.itemQuantity) this._els.itemQuantity.value = item.quantity;
    if (this._els.editId)       this._els.editId.value       = item.id;

    // Atualiza o botão para modo de edição
    if (this._els.addBtn) {
      this._els.addBtn.innerHTML = `
        <span class="btn-emoji" aria-hidden="true">💾</span>
        <span id="btnText">Salvar Alterações</span>
      `;
      // Re-registra a referência ao btnText
      this._els.btnText = document.getElementById('btnText');
    }

    this._els.cancelEditBtn?.classList.remove('hidden');
    this._els.formSection?.classList.add('editing');
    this._els.itemName?.focus();

    // Scroll suave para o formulário
    this._els.formSection?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  _resetForm() {
    if (this._els.itemName)     this._els.itemName.value     = '';
    if (this._els.itemCategory) this._els.itemCategory.value = CONFIG.CATEGORIES[0].id;
    if (this._els.itemQuantity) this._els.itemQuantity.value = '1';
    if (this._els.editId)       this._els.editId.value       = '';

    if (this._els.addBtn) {
      this._els.addBtn.innerHTML = `
        <span class="btn-emoji" aria-hidden="true">➕</span>
        <span id="btnText">Adicionar à Lista</span>
      `;
      this._els.btnText = document.getElementById('btnText');
    }

    this._els.cancelEditBtn?.classList.add('hidden');
    this._els.formSection?.classList.remove('editing');
    this._els.itemName?.focus();
  }
}