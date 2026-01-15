var t = TrelloPowerUp.iframe();

// Estado global
var lists = []; 
var editingState = { listId: null, itemIndex: -1 }; // Controla quem está sendo editado

// Ícones
const ICONS = {
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  edit: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  notes: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
};

// --- RENDERIZAÇÃO ---
function render() {
  var container = document.getElementById('lists-container');
  container.innerHTML = "";

  lists.forEach(function(list) {
    // Cria o BOX (Cartão) da Checklist
    var listBlock = document.createElement('div');
    listBlock.className = 'checklist-block';
    
    // --- Header (Título + Delete) ---
    var header = document.createElement('div');
    header.className = 'block-header';
    header.innerHTML = `
      <input type="text" class="input-list-title" id="title-${list.id}" value="${escapeHtml(list.title)}" placeholder="Nome da Checklist (ex: Fase 1)">
      <button class="btn-delete-list" id="del-list-${list.id}" title="Excluir Lista Inteira">${ICONS.trash}</button>
    `;
    listBlock.appendChild(header);

    // --- Container de Itens ---
    var itemsContainer = document.createElement('div');
    
    if (list.items && list.items.length > 0) {
      list.items.forEach(function(item, idx) {
        var isEditing = (editingState.listId === list.id && editingState.itemIndex === idx);
        
        var row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
          <div class="item-view ${isEditing ? 'hidden' : ''}" style="${isEditing ? 'display:none' : ''}">
            <input type="checkbox" id="chk-${list.id}-${idx}" ${item.done ? 'checked' : ''}>
            <span class="item-title ${item.done ? 'done' : ''}" id="txt-${list.id}-${idx}">
              ${escapeHtml(item.title)}
              ${item.desc ? `<span class="desc-indicator" title="Ver nota">${ICONS.notes}</span>` : ''}
            </span>
            <button class="btn-icon" id="edt-${list.id}-${idx}">${ICONS.edit}</button>
            <button class="btn-icon" id="del-${list.id}-${idx}" style="color:#d32f2f">${ICONS.trash}</button>
          </div>

          <div class="item-edit ${isEditing ? 'visible' : ''}">
            <input class="edit-input" id="inp-title-${list.id}-${idx}" value="${escapeHtml(item.title)}">
            <textarea class="edit-textarea" id="inp-desc-${list.id}-${idx}" placeholder="Descrição...">${item.desc || ''}</textarea>
            <div style="text-align:right">
              <button class="btn-cancel" id="cncl-${list.id}-${idx}">Cancelar</button>
              <button class="btn-save" id="save-${list.id}-${idx}">Salvar</button>
            </div>
          </div>
        `;
        itemsContainer.appendChild(row);

        // Events do Item
        if (!isEditing) {
          // Checkbox
          row.querySelector(`#chk-${list.id}-${idx}`).addEventListener('change', function() {
            list.items[idx].done = this.checked;
            saveData();
          });
          // Entrar em Edição
          var enterEdit = function() {
            editingState = { listId: list.id, itemIndex: idx };
            render();
          };
          row.querySelector(`#edt-${list.id}-${idx}`).addEventListener('click', enterEdit);
          row.querySelector(`#txt-${list.id}-${idx}`).addEventListener('click', enterEdit);
          
          // Deletar Item
          row.querySelector(`#del-${list.id}-${idx}`).addEventListener('click', function() {
            if(confirm("Excluir item?")) {
              list.items.splice(idx, 1);
              saveData();
            }
          });
        } else {
          // Salvar Edição
          row.querySelector(`#save-${list.id}-${idx}`).addEventListener('click', function() {
            var newTitle = document.getElementById(`inp-title-${list.id}-${idx}`).value;
            var newDesc = document.getElementById(`inp-desc-${list.id}-${idx}`).value;
            if(newTitle.trim()) {
              list.items[idx].title = newTitle;
              list.items[idx].desc = newDesc;
              editingState = { listId: null, itemIndex: -1 };
              saveData();
            }
          });
          // Cancelar Edição
          row.querySelector(`#cncl-${list.id}-${idx}`).addEventListener('click', function() {
            editingState = { listId: null, itemIndex: -1 };
            render();
          });
        }
      });
    }
    listBlock.appendChild(itemsContainer);

    // --- Footer (Novo Item) ---
    var footer = document.createElement('div');
    footer.className = 'block-footer';
    footer.innerHTML = `
      <input type="text" class="input-new-item" id="new-${list.id}" placeholder="Adicionar item..." autocomplete="off">
      <button class="btn-icon" id="add-btn-${list.id}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    `;
    listBlock.appendChild(footer);

    // Events da Lista
    
    // Salvar Título da Lista ao perder foco ou Enter
    var titleInput = header.querySelector(`#title-${list.id}`);
    titleInput.addEventListener('blur', function() {
      if(this.value !== list.title) {
        list.title = this.value;
        saveData(true); // true = silent save (sem re-render total)
      }
    });
    titleInput.addEventListener('keypress', function(e) { if(e.key === 'Enter') this.blur(); });

    // Deletar Lista Inteira
    header.querySelector(`#del-list-${list.id}`).addEventListener('click', function() {
      if(confirm("Excluir esta Checklist inteira e todos os itens?")) {
        lists = lists.filter(l => l.id !== list.id);
        saveData();
      }
    });

    // Adicionar Novo Item na Lista
    var addItemToList = function() {
      var input = footer.querySelector(`#new-${list.id}`);
      var val = input.value.trim();
      if(val) {
        list.items.push({ title: val, desc: "", done: false });
        saveData();
      }
    };
    footer.querySelector(`#add-btn-${list.id}`).addEventListener('click', addItemToList);
    footer.querySelector(`#new-${list.id}`).addEventListener('keypress', function(e) {
      if(e.key === 'Enter') addItemToList();
    });

    // Adicionar ao DOM
    container.appendChild(listBlock);
  });

  t.sizeTo('#content');
}

// --- DADOS E PERSISTÊNCIA ---

function saveData(silent) {
  return t.set('card', 'shared', 'multiChecklists', lists)
    .then(function() {
      if(!silent) render();
    });
}

// Helper: ID Único
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Criar Nova Lista
document.getElementById('btn-new-list').addEventListener('click', function() {
  lists.push({
    id: generateId(),
    title: "", // Começa sem título
    items: []
  });
  saveData();
});

// Inicialização
t.render(function() {
  return t.get('card', 'shared', 'multiChecklists', [])
    .then(function(data) {
      // Migração simples: se o formato for novo, usa. Se for antigo ou vazio, inicia array.
      if (Array.isArray(data)) {
        lists = data;
      } else {
        lists = [];
      }
      render();
    });
});

function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}