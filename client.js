var t = TrelloPowerUp.iframe();
var editingIndex = -1;

// --- ÍCONES SVG (Strings) ---
const ICONS = {
  edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  notes: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
};

function render(data) {
  var items = data.items || [];
  var title = data.title || "";

  // Atualiza o título da Checklist (apenas se não estiver focado para não atrapalhar digitação)
  var titleInput = document.getElementById('checklist-title');
  if (document.activeElement !== titleInput) {
    titleInput.value = title;
  }

  var container = document.getElementById('checklist-container');
  container.innerHTML = "";

  items.forEach(function(item, index) {
    var isEditing = (index === editingIndex);
    var div = document.createElement('div');
    div.className = 'item-row'; // Container da linha

    // HTML Condicional
    var html = `
      <div class="item-view ${isEditing ? 'hidden' : ''}">
        <input type="checkbox" id="check-${index}" ${item.done ? 'checked' : ''}>
        
        <span class="item-title ${item.done ? 'done' : ''}" id="title-click-${index}">
          ${escapeHtml(item.title)}
          ${item.desc ? `<span class="desc-indicator" title="Ver notas">${ICONS.notes}</span>` : ''}
        </span>

        <button class="btn-icon" id="btn-edit-${index}" title="Editar">${ICONS.edit}</button>
        <button class="btn-icon" id="btn-del-${index}" title="Excluir" style="color:var(--text-sub);">${ICONS.trash}</button>
      </div>

      <div class="item-edit ${isEditing ? 'visible' : ''}">
        <label class="edit-label">Item</label>
        <input type="text" class="edit-input" id="edit-title-${index}" value="${escapeHtml(item.title)}">
        
        <label class="edit-label">Descrição / Detalhes</label>
        <textarea class="edit-textarea" id="edit-desc-${index}">${item.desc || ''}</textarea>
        
        <div class="btn-group">
          <button class="btn-cancel" id="btn-cancel-${index}">Cancelar</button>
          <button class="btn-save" id="btn-save-${index}">Salvar Alterações</button>
        </div>
      </div>
    `;

    div.innerHTML = html;
    container.appendChild(div);

    // --- EVENTOS DE CLIQUE ---
    
    if (!isEditing) {
      // Checkbox
      div.querySelector(`#check-${index}`).addEventListener('change', function() {
        items[index].done = this.checked;
        saveItems(items);
      });
      // Botão Editar e Clique no Título
      var openEdit = function() {
        editingIndex = index;
        render({ items: items, title: titleInput.value });
      };
      div.querySelector(`#btn-edit-${index}`).addEventListener('click', openEdit);
      
      // Botão Excluir
      div.querySelector(`#btn-del-${index}`).addEventListener('click', function() {
        if(confirm("Remover este item?")) {
            items.splice(index, 1);
            saveItems(items);
        }
      });
    } else {
      // Salvar Edição
      div.querySelector(`#btn-save-${index}`).addEventListener('click', function() {
        var newTitle = document.getElementById(`edit-title-${index}`).value;
        var newDesc = document.getElementById(`edit-desc-${index}`).value;
        if(newTitle.trim()) {
          items[index].title = newTitle;
          items[index].desc = newDesc;
          editingIndex = -1;
          saveItems(items);
        }
      });
      // Cancelar
      div.querySelector(`#btn-cancel-${index}`).addEventListener('click', function() {
        editingIndex = -1;
        render({ items: items, title: titleInput.value });
      });
    }
  });

  t.sizeTo('#content');
}

// --- FUNÇÕES DE SALVAMENTO ---

function saveItems(items) {
  return t.set('card', 'shared', 'checklistItems', items)
    .then(function() {
      // Busca o título atual para não perdê-lo na renderização
      return t.get('card', 'shared', 'checklistTitle', "");
    })
    .then(function(title) {
      render({ items: items, title: title });
    });
}

function saveTitle(title) {
  return t.set('card', 'shared', 'checklistTitle', title);
}

// --- INICIALIZAÇÃO E LISTENERS ---

// Listener para o Título da Checklist (Salva ao perder o foco ou dar Enter)
var titleInput = document.getElementById('checklist-title');
titleInput.addEventListener('blur', function() {
  saveTitle(this.value);
});
titleInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') this.blur();
});

// Listener para Adicionar Item
document.getElementById('btn-add').addEventListener('click', addItem);
document.getElementById('new-item-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') addItem();
});

function addItem() {
  var input = document.getElementById('new-item-input');
  var val = input.value.trim();
  if (!val) return;

  t.get('card', 'shared', 'checklistItems', [])
    .then(function(items) {
      items.push({ title: val, desc: "", done: false });
      input.value = "";
      saveItems(items);
    });
}

// Carregar Dados Iniciais
t.render(function() {
  return t.getAll()
    .then(function(data) {
      var items = data.card ? data.card.shared.checklistItems : [];
      var title = data.card ? data.card.shared.checklistTitle : "";
      render({ items: items || [], title: title || "" });
    });
});

// Helper XSS
function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}