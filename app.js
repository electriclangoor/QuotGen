document.addEventListener('DOMContentLoaded', () => {
  // --- Tab Switching Logic ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active to clicked
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // --- Generator Logic Setup ---
  // A generic function that initializes state and events for a specific tab
  const setupGenerator = (prefix) => {
    const formElements = {
      clientName: document.getElementById(`${prefix}-client-name`),
      clientCompany: document.getElementById(`${prefix}-client-company`),
      clientEmail: document.getElementById(`${prefix}-client-email`),
      clientAddress: document.getElementById(`${prefix}-client-address`),
      projectName: document.getElementById(`${prefix}-project-name`),
      docNo: document.getElementById(`${prefix}-no`),
      docDate: document.getElementById(`${prefix}-date`),
      docValid: document.getElementById(`${prefix}-valid`),
      projectType: document.getElementById(`${prefix}-project-type`),
      taxName: document.getElementById(`${prefix}-tax-name`),
      taxRate: document.getElementById(`${prefix}-tax-rate`)
    };

    const docElements = {
      clientName: document.getElementById(`doc-${prefix}-client-name`),
      clientCompany: document.getElementById(`doc-${prefix}-client-company`),
      clientEmail: document.getElementById(`doc-${prefix}-client-email`),
      clientAddress: document.getElementById(`doc-${prefix}-client-address`),
      projectName: document.getElementById(`doc-${prefix}-project-name`),
      docNo: document.getElementById(`doc-${prefix}-no`),
      docDate: document.getElementById(`doc-${prefix}-date`),
      docValid: document.getElementById(`doc-${prefix}-valid`),
      taxLabel: document.getElementById(`doc-${prefix}-tax-label`)
    };

    const tbody = document.getElementById(`doc-${prefix}-items-tbody`);
    const addBtn = document.getElementById(`${prefix}-add-item-btn`);
    const printBtn = document.getElementById(`${prefix}-print-btn`);
    const itemsContainer = document.getElementById(`${prefix}-items-container`);

    let items = [];
    let nextId = 1;

    // Initialize Dates
    const today = new Date();
    const validUntil = new Date();
    // Default valid/due time: Quote = 30 days, Invoice = 30 days
    validUntil.setDate(today.getDate() + 30); 

    formElements.docDate.valueAsDate = today;
    formElements.docValid.valueAsDate = validUntil;
    
    const docPrefixStr = prefix === 'quote' ? 'Q' : 'INV';
    formElements.docNo.value = `${docPrefixStr}-${today.getFullYear()}${String(today.getMonth()+1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`;

    // Bind Standard Inputs
    const bindInput = (input, output) => {
      if (!input || !output) return;
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
    bindInput(formElements.docNo, docElements.docNo);
    bindInput(formElements.taxName, docElements.taxLabel);

    const formatDate = (dateString) => {
      if(!dateString) return '-';
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    ['docDate', 'docValid'].forEach(key => {
      if(!formElements[key]) return;
      formElements[key].addEventListener('input', () => {
        docElements[key].innerText = formatDate(formElements[key].value);
      });
      docElements[key].innerText = formatDate(formElements[key].value);
    });

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount);
    };

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

      const taxRateVal = parseFloat(formElements.taxRate.value) || 0;
      const taxAmount = (subtotal * taxRateVal) / 100;
      const grandTotal = subtotal + taxAmount;

      document.getElementById(`doc-${prefix}-subtotal`).innerText = formatCurrency(subtotal);
      
      const taxRow = document.getElementById(`${prefix}-tax-row`);
      if (taxRateVal > 0) {
        taxRow.style.display = 'flex';
        document.getElementById(`doc-${prefix}-tax-amount`).innerText = formatCurrency(taxAmount);
      } else {
        taxRow.style.display = 'none';
      }

      document.getElementById(`doc-${prefix}-total`).innerText = formatCurrency(grandTotal);
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
      editor.querySelector('.item-desc').focus();
      renderDocItems();
    };

    addBtn.addEventListener('click', addItem);
    printBtn.addEventListener('click', () => {
      const originalTitle = document.title;
      
      const safeStr = (str) => (str || 'Unspecified').trim().replace(/[\/\\?%*:|"<>]/g, '-');
      
      const docNo = safeStr(formElements.docNo.value);
      const companyName = safeStr(formElements.clientCompany.value.trim() || formElements.clientName.value.trim());
      const projectName = safeStr(formElements.projectName.value);
      const projectType = safeStr(formElements.projectType.value);
      
      document.title = `${docNo}_${companyName}_${projectName}_${projectType}`;
      
      window.print();
      
      document.title = originalTitle;
    });

    // Start with 1 empty item
    addItem();
  };

  // Setup Quotation Generator
  setupGenerator('quote');
  // Setup Invoice Generator
  setupGenerator('invoice');

});
