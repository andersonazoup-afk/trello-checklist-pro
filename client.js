var t = TrelloPowerUp.iframe();

// Função para renderizar a lista
function renderList(items) {
  var container = document.getElementById('checklist-container');
  container.innerHTML = ""; // Limpa a lista atual

  items.forEach(function(item, index) {
    var div = document.createElement('div');
    div.className = 'checklist-item ' + (item.done ? 'done' : '');
    
    // HTML do item
    div.innerHTML = `
      <div class="checklist-header">
        <input type="checkbox" id="check-${index}" ${item.done ? 'checked' : ''}>
        <span style="flex-grow:1">${item.title}</span>
        <button class="btn-delete" data-id="${index}" style="background:none;border:none;color:red;cursor:pointer;">🗑️</button>
      </div>
      <div class="checklist-desc">${item.desc}</div>
    `;
    container.appendChild(div);

    // Evento do Checkbox
    div.querySelector(`#check-${index}`).addEventListener('change', function() {
      items[index].done = this.checked;
      saveAndRender(items);
    });

    // Evento de Deletar
    div.querySelector(`.btn-delete`).addEventListener('click', function() {
        items.splice(index, 1);
        saveAndRender(items);
    });
  });

  // Redimensiona o iframe para caber tudo
  t.sizeTo('#content');
}

// Função para Salvar no Trello e atualizar a tela
function saveAndRender(items) {
  // Salva no escopo 'card' (visível para todos no card)
  return t.set('card', 'shared', 'myChecklistData', items)
    .then(function() {
      renderList(items);
    });
}

// Inicialização
t.render(function() {
  // Carrega os dados salvos
  return t.get('card', 'shared', 'myChecklistData', [])
    .then(function(items) {
      renderList(items);
    });
});

// Evento do Botão Adicionar
document.getElementById('btn-add').addEventListener('click', function() {
  var titleInput = document.getElementById('new-item-title');
  var descInput = document.getElementById('new-item-desc');

  if(titleInput.value.trim() === "") return;

  t.get('card', 'shared', 'myChecklistData', [])
    .then(function(items) {
      items.push({
        title: titleInput.value,
        desc: descInput.value,
        done: false
      });
      titleInput.value = "";
      descInput.value = "";
      return saveAndRender(items);
    });
});