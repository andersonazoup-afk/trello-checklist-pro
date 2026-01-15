var t = TrelloPowerUp.iframe();

// Estado global
var lists = []; 
var editingState = { listId: null, itemIndex: -1 };
var expandedNotes = {}; // Guarda quais notas estão abertas: { "idLista-indexItem": true }

// Ícones
const ICONS = {
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  edit: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  // Ícone de Nota (Documento com linhas)
  note: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
};

function render() {
  var container = document.getElementById('lists-container');
  container.innerHTML = "";

  lists.forEach(function(list) {
    var listBlock = document.createElement('div');
    listBlock.className = 'checklist-block';
    
    // Header
    var header = document.createElement('div');
    header.className = 'block-header';
    header.innerHTML = `
      <input type="text" class="input-list-title" id="title-${list.id}" value="${escapeHtml(list.title)}" placeholder="Nome da Checklist...">
      <button class="btn-delete-list" id="del-list-${list.id}" title="Excluir Lista">${ICONS.trash}</button>
    `;
    listBlock.appendChild(header);

    // Items
    var itemsContainer = document.createElement('div');
    if (list.items && list.items.length > 0) {
      list.items.forEach(function(item, idx) {
        var isEditing = (editingState.listId === list.id && editingState.itemIndex === idx);
        var noteKey = list.id + '-' + idx;
        var isNoteExpanded = expandedNotes[noteKey];
        var hasDesc = item.desc && item.desc.trim().length > 0;

        var row = document.createElement('div');
        row.className = 'item-row';
        
        // HTML Condicional
        var html = `
          <div class="item-view ${isEditing ? 'hidden' : ''}" style="${isEditing ? 'display:none' : ''}">
            <input type="checkbox" id="chk-${list.id}-${idx}" ${item.done ? 'checked' : ''}>
            
            <span class="item-title ${item.done ? 'done' : ''}" id="txt-${list.id}-${idx}">
              ${escapeHtml(item.title)}
            </span>

            ${hasDesc ? `
              <button class="btn-note-toggle" id="toggle-${list.id}-${idx}" title="Ler descrição/nota">
                ${ICONS.note}
              </button>
            ` : ''}

            <button class="btn-icon" id="edt-${list.id}-${idx}" title="Editar">${ICONS.edit}</button>
            <button class="btn-icon" id="del-${list.id}-${idx}" style="color:#d32f2f; margin-left:auto;">${ICONS.trash}</button>
          </div>

          <div class="item-desc-preview ${isNoteExpanded ? 'visible' : ''}">
            ${escapeHtml(item.desc || '')}
          </div>

          <div class="item-edit ${isEditing ? 'visible' : ''}">
            <input class="edit-input" id="inp-title-${list.id}-${idx}" value="${escapeHtml(item.title)}">
            <textarea class="edit-textarea" id="inp-desc-${list.id}-${idx}" placeholder="Escreva a descrição detalhada aqui...">${item.desc || ''}</textarea>
            <div style="text-align:right; gap:5px; display:flex; justify-content:flex-end;">
              <button class="btn-cancel" id="cncl-${list.id}-${idx}">Cancelar</button>
              <button class="btn-save" id="save-${list.id}-${idx}">Salvar</button>
            </div>
          </div>
        `;
        row.innerHTML = html;
        itemsContainer.appendChild(row);

        // --- EVENTOS ---
        if (!isEditing) {
          // Checkbox
          row.querySelector(`#chk-${list.id}-${idx}`).addEventListener('change', function() {
            list.items[idx].done = this.checked;
            saveData(true);
          });
          
          // Toggle Nota (Se existir)
          if(hasDesc) {
            row.querySelector(`#toggle-${list.id}-${idx}`).addEventListener('click', function(e) {
              e.stopPropagation(); // Não ativa outros cliques
              if(expandedNotes[noteKey]) {
                delete expandedNotes[noteKey];
              } else {
                expandedNotes[noteKey] = true;
              }
              render();
            });
          }

          // Entrar em Edição
          var enterEdit = function() {
            editingState = { listId: list.id, itemIndex: idx };
            render();
          };
          row.querySelector(`#edt-${list.id}-${idx}`).addEventListener('click', enterEdit);
          row.querySelector(`#txt-${list.id}-${idx}`).addEventListener('click', enterEdit); // Clicar no texto também edita
          
          // Deletar
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
          // Cancelar
          row.querySelector(`#cncl-${list.id}-${idx}`).addEventListener('click', function() {
            editingState = { listId: null, itemIndex: -1 };
            render();
          });
        }
      });
    }
    listBlock.appendChild(itemsContainer);

    // Footer
    var footer = document.createElement('div');
    footer.className = 'block-footer';
    footer.innerHTML = `
      <input type="text" class="input-new-item" id="new-${list.id}" placeholder="Adicionar item..." autocomplete="off">
      <button class="btn-icon" id="add-btn-${list.id}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    `;
    listBlock.appendChild(footer);

    // Eventos de Lista
    var titleInput = header.querySelector(`#title-${list.id}`);
    titleInput.addEventListener('blur', function() {
      if(this.value !== list.title) { list.title = this.value; saveData(true); }
    });
    titleInput.addEventListener('keypress', function(e) { if(e.key === 'Enter') this.blur(); });

    header.querySelector(`#del-list-${list.id}`).addEventListener('click', function() {
      if(confirm("Excluir lista inteira?")) {
        lists = lists.filter(l => l.id !== list.id);
        saveData();
      }
    });

    var addItemToList = function() {
      var input = footer.querySelector(`#new-${list.id}`);
      var val = input.value.trim();
      if(val) {
        list.items.push({ title: val, desc: "", done: false });
        saveData();
      }
    };
    footer.querySelector(`#add-btn-${list.id}`).addEventListener('click', addItemToList);
    footer.querySelector(`#new-${list.id}`).addEventListener('keypress', function(e) { if(e.key === 'Enter') addItemToList(); });

    container.appendChild(listBlock);
  });

  t.sizeTo('#content');
}

function saveData(silent) {
  return t.set('card', 'shared', 'multiChecklists', lists).then(function() { if(!silent) render(); });
}
function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function escapeHtml(text) { if (!text) return ""; return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

document.getElementById('btn-new-list').addEventListener('click', function() {
  lists.push({ id: generateId(), title: "", items: [] });
  saveData();
});

t.render(function() {
  return t.get('card', 'shared', 'multiChecklists', []).then(function(data) {
    lists = Array.isArray(data) ? data : [];
    render();
  });
});