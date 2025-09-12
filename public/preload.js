const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // المنتجات
  products: {
    getAll: () => ipcRenderer.invoke('products-get-all'),
    add: (product) => ipcRenderer.invoke('products-add', product),
    update: (product) => ipcRenderer.invoke('products-update', product), // ✅ نمرر object كامل
    delete: (id) => ipcRenderer.invoke('products-delete', id),
     updateStock: (productId, quantity) =>
    ipcRenderer.invoke('products-update-stock', { productId, quantity })
  },
   stockMovements: {
    add: (movement) => ipcRenderer.invoke('stock-movement-add', movement)
  },
  // الفئات
categories: {
  getAll: () => ipcRenderer.invoke('categories-get-all'),
  add: (category) => ipcRenderer.invoke('categories-add', category),
  update: (category) => ipcRenderer.invoke('categories-update', category), // ✅ هنا
  delete: (id) => ipcRenderer.invoke('categories-delete', id)              // ✅ وهنا
},

  // الموردين
  suppliers: {
    getAll: () => ipcRenderer.invoke('suppliers-get-all'),
    add: (supplier) => ipcRenderer.invoke('suppliers-add', supplier),
    update: (supplier) => ipcRenderer.invoke('suppliers-update', supplier),
    delete: (id) => ipcRenderer.invoke('suppliers-delete', id)
  },
  
  // العملاء
  customers: {
    getAll: () => ipcRenderer.invoke('customers-get-all'),
    add: (customer) => ipcRenderer.invoke('customers-add', customer),
    update: (id, customer) => ipcRenderer.invoke('customers-update', id, customer),
    delete: (id) => ipcRenderer.invoke('customers-delete', id)
  },
  
 // المعاملات
 transactions: {
    // إضافة عملية بيع جديدة
    addSale: (transaction) => ipcRenderer.invoke('transactions-add-sale', transaction),

    // جلب كل المبيعات
    getAll: () => ipcRenderer.invoke('transactions-get-all'),

    // حذف عملية بيع
    delete: (id) => ipcRenderer.invoke('transactions-delete', id),

    // جلب تفاصيل فاتورة كاملة (العناصر + بيانات الفاتورة)
    getDetailsFull: (transactionId) => ipcRenderer.invoke('transactions-get-details-full', transactionId),

    // جلب منتج محدد من فاتورة
    getItem: async (transactionId, productId) => {
      const items = await ipcRenderer.invoke('transactions-get-details', transactionId);
      return items.find(item => item.product_id === productId) || null;
    },

    // إرجاع منتج من فاتورة
    returnItem: (transactionId, productId, quantity) =>
      ipcRenderer.invoke("transactions-return-item", {
        transactionId,
        productId,
        quantity,
      })
  },

  // التقارير
  reports: {
    lowStock: () => ipcRenderer.invoke('reports-low-stock'),
    salesSummary: (startDate, endDate) => ipcRenderer.invoke('reports-sales-summary', startDate, endDate),
    topProducts: () => ipcRenderer.invoke('reports-top-products'),
    topCustomers: () => ipcRenderer.invoke('reports-top-customers')
  }
});
