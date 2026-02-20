(function () {
  const STORAGE_KEY = 'ledger-records';

  const $form = document.getElementById('recordForm');
  const $recordsList = document.getElementById('recordsList');
  const $emptyState = document.getElementById('emptyState');
  const $balance = document.getElementById('balance');
  const $totalIncome = document.getElementById('totalIncome');
  const $totalExpense = document.getElementById('totalExpense');
  const $amount = document.getElementById('amount');
  const $category = document.getElementById('category');
  const $note = document.getElementById('note');
  const $date = document.getElementById('date');
  const $typeIncome = document.getElementById('typeIncome');
  const $typeExpense = document.getElementById('typeExpense');

  let records = loadRecords();
  let currentFilter = 'all';

  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveRecords() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function formatMoney(n) {
    return Number(n).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function setDefaultDate() {
    const today = new Date().toISOString().slice(0, 10);
    if (!$date.value) $date.value = today;
  }

  function syncCategoryByType() {
    const isIncome = $typeIncome.checked;
    const options = Array.from($category.options);
    const firstReal = options.find(o => o.value && !o.disabled);
    $category.value = firstReal ? firstReal.value : '';
    $category.querySelectorAll('optgroup').forEach(opt => {
      const label = (opt.label || '').toLowerCase();
      opt.disabled = (isIncome && label.includes('支出')) || (!isIncome && label.includes('收入'));
    });
    if (!$category.value) {
      const firstEnabled = options.find(o => o.value && !o.disabled);
      if (firstEnabled) $category.value = firstEnabled.value;
    }
  }

  function getFilteredRecords() {
    if (currentFilter === 'income') return records.filter(r => r.type === 'income');
    if (currentFilter === 'expense') return records.filter(r => r.type === 'expense');
    return records;
  }

  function renderSummary() {
    const income = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const expense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const balance = income - expense;

    $totalIncome.textContent = formatMoney(income);
    $totalExpense.textContent = formatMoney(expense);
    $balance.textContent = formatMoney(balance);
    $balance.style.color = balance >= 0 ? 'var(--income)' : 'var(--expense)';
  }

  function renderList() {
    const list = getFilteredRecords();
    $recordsList.innerHTML = '';

    list.forEach(record => {
      const li = document.createElement('li');
      li.className = 'record-item';
      li.dataset.id = record.id;
      li.innerHTML =
        '<div class="record-info">' +
          '<div class="record-note">' + (record.note || record.category || '未命名') + '</div>' +
          '<div class="record-meta">' + record.category + ' · ' + record.date + '</div>' +
        '</div>' +
        '<span class="record-amount ' + record.type + '">' +
          (record.type === 'income' ? '+' : '-') + formatMoney(record.amount) +
        '</span>' +
        '<button type="button" class="record-delete" aria-label="删除">×</button>';
      $recordsList.appendChild(li);
    });

    $emptyState.classList.toggle('hidden', list.length > 0);
  }

  function addRecord(record) {
    record.id = 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    records.unshift(record);
    saveRecords();
    renderSummary();
    renderList();
  }

  function deleteRecord(id) {
    records = records.filter(r => r.id !== id);
    saveRecords();
    renderSummary();
    renderList();
  }

  $form.addEventListener('submit', function (e) {
    e.preventDefault();
    const type = $typeIncome.checked ? 'income' : 'expense';
    const amount = Math.abs(parseFloat($amount.value) || 0);
    if (amount <= 0) return;

    addRecord({
      type,
      amount,
      category: $category.value || (type === 'income' ? '其他收入' : '其他支出'),
      note: $note.value.trim(),
      date: $date.value
    });

    $amount.value = '';
    $note.value = '';
    setDefaultDate();
    syncCategoryByType();
  });

  $recordsList.addEventListener('click', function (e) {
    const btn = e.target.closest('.record-delete');
    if (!btn) return;
    const item = btn.closest('.record-item');
    if (item && item.dataset.id) deleteRecord(item.dataset.id);
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      renderList();
    });
  });

  $typeIncome.addEventListener('change', syncCategoryByType);
  $typeExpense.addEventListener('change', syncCategoryByType);

  setDefaultDate();
  syncCategoryByType();
  renderSummary();
  renderList();
})();
