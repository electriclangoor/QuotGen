document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const formElements = {
    clientName: document.getElementById('client-name'),
    clientCompany: document.getElementById('client-company'),
    clientEmail: document.getElementById('client-email'),
    clientAddress: document.getElementById('client-address'),
    projectName: document.getElementById('project-name'),
    quoteNo: document.getElementById('quote-no'),
    quoteDate: document.getElementById('quote-date'),
    quoteValid: document.getElementById('quote-valid'),
    taxName: document.getElementById('tax-name'),
    taxRate: document.getElementById('tax-rate')
  };

  const docElements = {
    clientName: document.getElementById('doc-client-name'),
    clientCompany: document.getElementById('doc-client-company'),
    clientEmail: document.getElementById('doc-client-email'),
    clientAddress: document.getElementById('doc-client-address'),
    projectName: document.getElementById('doc-project-name'),
    quoteNo: document.getElementById('doc-quote-no'),
    quoteDate: document.getElementById('doc-date'),
    quoteValid: document.getElementById('doc-valid'),
    taxLabel: document.getElementById('doc-tax-label')
  };

  const tbody = document.getElementById('doc-items-tbody');
  const addBtn = document.getElementById('add-item-btn');
  const printBtn = document.getElementById('print-btn');
  const itemsContainer = document.getElementById('items-container');

  // State
  let items = [];
  let nextId = 1;

  // Initialize Dates
  const today = new Date();
  const validUntil = new Date();
  validUntil.setDate(today.getDate() + 30); // Valid for 30 days default

  formElements.quoteDate.valueAsDate = today;
  formElements.quoteValid.valueAsDate = validUntil;
  formElements.quoteNo.value = `Q-${today.getFullYear()}${String(today.getMonth()+1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`;

  // Bind Standard Inputs
  const bindInput = (input, output) => {
    const update = () => {
      output.innerText = input.value.trim() || '-';
    };
    input.addEventListener('input', update);
    update();
  };

  bindInput(formElements.clientName, docElements.clientName);
  bindInput(formElements.clientCompany, docElements.clientCompany);
  bindInput(formElements.clientEmail, docElements.clientEmail);
  bindInput(formElements.clientAddress, docElements.clientAddress);
  bindInput(formElements.projectName, docElements.projectName);
  bindInput(formElements.quoteNo, docElements.quoteNo);
  bindInput(formElements.taxName, docElements.taxLabel);

  // Date Binders (Formatting)
  const formatDate = (dateString) => {
    if(!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  ['quoteDate', 'quoteValid'].forEach(key => {
    formElements[key].addEventListener('input', () => {
      docElements[key].innerText = formatDate(formElements[key].value);
    });
    docElements[key].innerText = formatDate(formElements[key].value);
  });

  // Numbers Formatting
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Line Item Management
  const renderDocItems = () => {
    tbody.innerHTML = '';
    let subtotal = 0;

    items.forEach(item => {
      const tr = document.createElement('tr');
      const amount = item.qty * item.rate;
      subtotal += amount;

      tr.innerHTML = `
        <td>
          <div class="item-title">${item.desc || 'Service Description'}</div>
        </td>
        <td class="col-qty">${item.qty}</td>
        <td class="col-rate">${formatCurrency(item.rate)}</td>
        <td class="col-amount">${formatCurrency(amount)}</td>
      `;
      tbody.appendChild(tr);
    });

    // Calculate Taxes & Totals
    const taxRateVal = parseFloat(formElements.taxRate.value) || 0;
    const taxAmount = (subtotal * taxRateVal) / 100;
    const grandTotal = subtotal + taxAmount;

    document.getElementById('doc-subtotal').innerText = formatCurrency(subtotal);
    
    const taxRow = document.getElementById('tax-row');
    if (taxRateVal > 0) {
      taxRow.style.display = 'flex';
      document.getElementById('doc-tax-amount').innerText = formatCurrency(taxAmount);
    } else {
      taxRow.style.display = 'none';
    }

    document.getElementById('doc-total').innerText = formatCurrency(grandTotal);
  };

  formElements.taxRate.addEventListener('input', renderDocItems);

  const createItemEditor = (id) => {
    const div = document.createElement('div');
    div.className = 'item-entry';
    div.dataset.id = id;

    div.innerHTML = `
      <button class="btn-remove-item" type="button" aria-label="Remove">&times;</button>
      <div class="input-field">
        <label>Description</label>
        <input type="text" class="item-desc" placeholder="e.g. Video Editing">
      </div>
      <div class="input-group-2">
        <div class="input-field">
          <label>Quantity / Hrs</label>
          <input type="number" class="item-qty" value="1" min="1" step="0.5">
        </div>
        <div class="input-field">
          <label>Rate (₹)</label>
          <input type="number" class="item-rate" value="0" min="0">
        </div>
      </div>
    `;

    // Bind events
    const updateData = () => {
      const index = items.findIndex(i => i.id === id);
      if(index > -1) {
        items[index].desc = div.querySelector('.item-desc').value;
        items[index].qty = parseFloat(div.querySelector('.item-qty').value) || 0;
        items[index].rate = parseFloat(div.querySelector('.item-rate').value) || 0;
        renderDocItems();
      }
    };

    div.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', updateData);
    });

    div.querySelector('.btn-remove-item').addEventListener('click', () => {
      div.remove();
      items = items.filter(i => i.id !== id);
      renderDocItems();
    });

    return div;
  };

  const addItem = () => {
    const defaultRate = items.length === 0 ? 5000 : 0;
    const newItem = { id: nextId++, desc: '', qty: 1, rate: defaultRate };
    items.push(newItem);
    
    const editor = createItemEditor(newItem.id);
    if(defaultRate > 0) editor.querySelector('.item-rate').value = defaultRate;
    
    itemsContainer.appendChild(editor);
    
    // Focus new description
    editor.querySelector('.item-desc').focus();
    
    renderDocItems();
  };

  addBtn.addEventListener('click', addItem);
  printBtn.addEventListener('click', () => {
    window.print();
  });

  // initial empty item
  addItem();
});
