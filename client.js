var t = TrelloPowerUp.iframe();

// Variável para controlar qual item está sendo editado (pelo índice)
// -1 significa que nenhum está sendo editado
var editingIndex = -1;

function renderList(items) {
  var container = document.getElementById('checklist-container');
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = "<div style='color:#6b778c; font-style:italic; padding:10px;'>Nenhum item na lista ainda.</div>";
  }

  items.forEach(function(item, index) {
    var isEditing = (index === editingIndex);
    var div = document.createElement('div');
    div.className = 'item-row';

    // HTML condicional: Mostra Form de Edição OU Linha Normal
    var html = `
      <div class="item-view ${isEditing ? 'hidden' : ''}">
        <input type="checkbox" id="check-${index}" ${item.done ? 'checked' : ''}>
        
        <span class="item-title ${item.done ? 'done' : ''}" id="title-click-${index}">
          ${escapeHtml(item.title)} 
          ${item.desc ? '<span title="Possui descrição" class="desc-indicator">📝</span>' : ''}
        </span>

        <button class="action-btn" id="btn-edit-${index}" title="Editar">✏️</button>
        <button class="action-btn" id="btn-del-${index}" title="Excluir" style="color:#d32f2f;">🗑️</button>
      </div>

      <div class="item-edit ${isEditing ? 'visible' : ''}">
        <label style="font-size:12px; font-weight:bold;">Título:</label>
        <input type="text" class="edit-input" id="edit-title-${index}" value="${escapeHtml(item.title)}">
        
        <label style="font-size:12px; font-weight:bold;">Descrição / Observações:</label>
        <textarea class="edit-textarea" id="edit-desc-${index}" placeholder="Escreva os detalhes aqui...">${item.desc || ''}</textarea>
        
        <div class="btn-group">
          <button class="btn-save" id="btn-save-${index}">Salvar</button>
          <button class="btn-cancel" id="btn-cancel-${index}">Cancelar</button>
        </div>
      </div>
    `;

    div.innerHTML = html;
    container.appendChild(div);

    // --- EVENTOS ---

    if (!isEditing) {
      // Checkbox
      div.querySelector(`#check-${index}`).addEventListener('change', function() {
        items[index].done = this.checked;
        save(items);
      });
      // Botão Editar
      div.querySelector(`#btn-edit-${index}`).addEventListener('click', function() {
        editingIndex = index;
        renderList(items); // Re-renderiza para abrir o editor
      });
      // Botão Excluir
      div.querySelector(`#btn-del-${index}`).addEventListener('click', function() {
        if(confirm("Excluir este item?")) {
            items.splice(index, 1);
            save(items);
        }
      });
    } else {
      // Botão Salvar Edição
      div.querySelector(`#btn-save-${index}`).addEventListener('click', function() {
        var newTitle = document.getElementById(`edit-title-${index}`).value;
        var newDesc = document.getElementById(`edit-desc-${index}`).value;
        
        if(newTitle.trim() !== "") {
          items[index].title = newTitle;
          items[index].desc = newDesc;
          editingIndex = -1; // Sai do modo edição
          save(items);
        }
      });
      // Botão Cancelar Edição
      div.querySelector(`#btn-cancel-${index}`).addEventListener('click', function() {
        editingIndex = -1;
        renderList(items);
      });
    }
  });

  // Força o ajuste de altura do iframe
  t.sizeTo('#content');
}

// Salva no Trello
function save(items) {
  return t.set('card', 'shared', 'checklistData', items)
    .then(function() {
      renderList(items);
    });
}

// Função auxiliar para evitar injeção de código (XSS)
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Inicialização
t.render(function() {
  return t.get('card', 'shared', 'checklistData', [])
    .then(function(items) {
      renderList(items);
    });
});

// Adicionar Novo Item
document.getElementById('btn-add').addEventListener('click', function() {
  var input = document.getElementById('new-item-input');
  var title = input.value.trim();

  if (title) {
    t.get('card', 'shared', 'checklistData', [])
      .then(function(items) {
        items.push({
          title: title,
          desc: "",  // Descrição começa vazia
          done: false
        });
        input.value = "";
        save(items);
      });
  }
});

// Adicionar apertando Enter
document.getElementById('new-item-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      document.getElementById('btn-add').click();
    }
});