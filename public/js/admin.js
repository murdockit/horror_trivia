const form = document.getElementById('question-form');
const editIdField = document.getElementById('edit-id');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-edit-btn');
const filterSelect = document.getElementById('filter-category');

// Add / Update question
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    category_id: document.getElementById('q-category').value,
    question_text: document.getElementById('q-text').value,
    option_a: document.getElementById('q-opt-a').value,
    option_b: document.getElementById('q-opt-b').value,
    option_c: document.getElementById('q-opt-c').value,
    option_d: document.getElementById('q-opt-d').value,
    correct_option: document.getElementById('q-correct').value,
    difficulty: document.getElementById('q-difficulty').value,
  };

  const editId = editIdField.value;
  const url = editId ? `/admin/api/questions/${editId}` : '/admin/api/questions';
  const method = editId ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    window.location.reload();
  } else {
    const data = await res.json();
    alert(data.error || 'Something went wrong.');
  }
});

// Edit question
document.getElementById('questions-body').addEventListener('click', async (e) => {
  const row = e.target.closest('tr');
  if (!row) return;

  if (e.target.classList.contains('edit-btn')) {
    editIdField.value = row.dataset.id;
    document.getElementById('q-category').value = row.dataset.categoryId;
    document.getElementById('q-difficulty').value = row.dataset.difficulty;
    document.getElementById('q-text').value = row.querySelector('.q-text-cell').textContent;
    document.getElementById('q-opt-a').value = row.dataset.optA;
    document.getElementById('q-opt-b').value = row.dataset.optB;
    document.getElementById('q-opt-c').value = row.dataset.optC;
    document.getElementById('q-opt-d').value = row.dataset.optD;
    document.getElementById('q-correct').value = row.dataset.correct;

    formTitle.textContent = 'Edit Question';
    submitBtn.textContent = 'Update Question';
    cancelBtn.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth' });
  }

  if (e.target.classList.contains('delete-btn')) {
    if (!confirm('Delete this question?')) return;
    const res = await fetch(`/admin/api/questions/${row.dataset.id}`, { method: 'DELETE' });
    if (res.ok) {
      row.remove();
      updateTotal();
    }
  }
});

// Cancel edit
cancelBtn.addEventListener('click', () => {
  form.reset();
  editIdField.value = '';
  formTitle.textContent = 'Add Question';
  submitBtn.textContent = 'Add Question';
  cancelBtn.classList.add('hidden');
});

// Filter questions
filterSelect.addEventListener('change', () => {
  const val = filterSelect.value;
  document.querySelectorAll('#questions-body tr').forEach((row) => {
    if (val === 'all' || row.dataset.category === val) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
});

// Add category
document.getElementById('category-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('new-category').value.trim();
  if (!name) return;

  const res = await fetch('/admin/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (res.ok) {
    window.location.reload();
  } else {
    const data = await res.json();
    alert(data.error || 'Something went wrong.');
  }
});

function updateTotal() {
  const count = document.querySelectorAll('#questions-body tr').length;
  document.getElementById('question-total').textContent = count;
}

// Bulk import
const importFile = document.getElementById('import-file');
const importBtn = document.getElementById('import-btn');
const importResult = document.getElementById('import-result');

importFile.addEventListener('change', () => {
  importBtn.disabled = !importFile.files.length;
});

importBtn.addEventListener('click', async () => {
  const file = importFile.files[0];
  if (!file) return;

  importBtn.disabled = true;
  importBtn.textContent = 'Importing...';
  importResult.classList.add('hidden');

  try {
    const text = await file.text();
    let data = JSON.parse(text);

    // Support both { questions: [...] } and bare [...]
    if (Array.isArray(data)) data = { questions: data };

    const res = await fetch('/admin/api/questions/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    importResult.classList.remove('hidden');

    if (res.ok) {
      let msg = `Imported ${result.imported} question(s).`;
      if (result.errors && result.errors.length > 0) {
        msg += ` ${result.errors.length} skipped: ${result.errors.join('; ')}`;
      }
      importResult.textContent = msg;
      importResult.className = 'import-result import-success';
      if (result.imported > 0) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } else {
      importResult.textContent = result.error || 'Import failed.';
      importResult.className = 'import-result import-error';
    }
  } catch (e) {
    importResult.classList.remove('hidden');
    importResult.textContent = 'Invalid JSON file.';
    importResult.className = 'import-result import-error';
  }

  importBtn.disabled = false;
  importBtn.textContent = 'Import';
});
