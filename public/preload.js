const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // المنتجات
  products: {
    getAll: () => ipcRenderer.invoke('products-get-all'),
    add: (product) => ipcRenderer.invoke('products-add', product),
    update: (id, product) => ipcRenderer.invoke('products-update', id, product),
    delete: (id) => ipcRenderer.invoke('products-delete', id)
  },
  
  // الفئات
  categories: {
    getAll: () => ipcRenderer.invoke('categories-get-all'),
    add: (category) => ipcRenderer.invoke('categories-add', category)
  },
  
  // الموردين
  suppliers: {
    getAll: () => ipcRenderer.invoke('suppliers-get-all'),
    add: (supplier) => ipcRenderer.invoke('suppliers-add', supplier)
  },
  
  // العملاء
  customers: {
    getAll: () => ipcRenderer.invoke('customers-get-all'),
    add: (customer) => ipcRenderer.invoke('customers-add', customer)
  },
  
  // المعاملات
  transactions: {
    addSale: (transaction) => ipcRenderer.invoke('transactions-add-sale', transaction)
  },
  
  // التقارير
  reports: {
    lowStock: () => ipcRenderer.invoke('reports-low-stock'),
    salesSummary: (startDate, endDate) => ipcRenderer.invoke('reports-sales-summary', startDate, endDate)
  }
});