/**
 * خدمة إدارة المخزون المحسنة
 * تتضمن معالجة الأخطاء، التحقق من البيانات، والتخزين المؤقت
 */
class InventoryService {
  constructor() {
    this.cache = new Map(); // التخزين المؤقت
    this.cacheTimeout = 5 * 60 * 1000; // 5 دقائق
  }

  /**
   * التحقق من توفر Electron API
   */
  checkAPI() {
    if (!window.electronAPI) {
      throw new Error('Electron API غير متوفر - تأكد من تشغيل التطبيق في بيئة Electron');
    }
  }

  /**
   * معالج الأخطاء المركزي
   */
  handleError(error, operation) {
    console.error(`خطأ في ${operation}:`, error);

    // تصنيف الأخطاء
    if (error.message.includes('UNIQUE constraint failed')) {
      throw new Error('هذا العنصر موجود بالفعل');
    } else if (error.message.includes('FOREIGN KEY constraint failed')) {
      throw new Error('خطأ في الربط بين البيانات');
    } else if (error.message.includes('NOT NULL constraint failed')) {
      throw new Error('يرجى ملء جميع الحقول المطلوبة');
    } else {
      throw new Error(`خطأ في ${operation}: ${error.message}`);
    }
  }

  /**
   * إدارة التخزين المؤقت
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * التحقق من صحة البيانات
   */
  validateProduct(product) {
    if (!product.name || product.name.trim() === '') {
      throw new Error('اسم المنتج مطلوب');
    }
    if (product.stock < 0) {
      throw new Error('الكمية لا يمكن أن تكون سالبة');
    }
    if (product.price && product.price < 0) {
      throw new Error('السعر لا يمكن أن يكون سالباً');
    }
    return true;
  }

  validateCategory(category) {
    if (!category.name || category.name.trim() === '') {
      throw new Error('اسم الفئة مطلوب');
    }
    return true;
  }

  validateSupplier(supplier) {
    if (!supplier.name || supplier.name.trim() === '') {
      throw new Error('اسم المورد مطلوب');
    }
    if (supplier.email && !this.isValidEmail(supplier.email)) {
      throw new Error('عنوان البريد الإلكتروني غير صحيح');
    }
    return true;
  }

  validateCustomer(customer) {
    if (!customer.name || customer.name.trim() === '') {
      throw new Error('اسم العميل مطلوب');
    }
    if (customer.email && !this.isValidEmail(customer.email)) {
      throw new Error('عنوان البريد الإلكتروني غير صحيح');
    }
    return true;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ==================== المنتجات ====================

  async getProducts(useCache = true) {
    try {
      this.checkAPI();

      if (useCache) {
        const cached = this.getCache('products');
        if (cached) return cached;
      }

      const products = await window.electronAPI.products.getAll();
      this.setCache('products', products);
      return products;
    } catch (error) {
      this.handleError(error, 'جلب المنتجات');
    }
  }

  async getProductById(id) {
    try {
      this.checkAPI();
      const products = await this.getProducts();
      const product = products.find(p => p.id === id);
      if (!product) {
        throw new Error('المنتج غير موجود');
      }
      return product;
    } catch (error) {
      this.handleError(error, 'جلب المنتج');
    }
  }

  async addProduct(product) {
    try {
      this.checkAPI();
      this.validateProduct(product);

      // تنظيف البيانات
      const cleanProduct = {
        ...product,
        name: product.name.trim(),
        sku: product.sku?.trim() || '',
        barcode: product.barcode?.trim() || '',
        description: product.description?.trim() || '',
        stock: parseInt(product.stock) || 0,
        price: parseFloat(product.price) || 0,
        min_stock_level: parseInt(product.min_stock_level) || 0
      };

      const result = await window.electronAPI.products.add(cleanProduct);
      this.clearCache(); // مسح التخزين المؤقت بعد التعديل
      return result;
    } catch (error) {
      this.handleError(error, 'إضافة المنتج');
    }
  }

  async updateProduct(id, product) {
    try {
      this.checkAPI();
      this.validateProduct(product);

      const cleanProduct = {
        ...product,
        name: product.name.trim(),
        sku: product.sku?.trim() || '',
        barcode: product.barcode?.trim() || '',
        description: product.description?.trim() || '',
        stock: parseInt(product.stock) || 0,
        price: parseFloat(product.price) || 0,
        min_stock_level: parseInt(product.min_stock_level) || 0
      };

      const result = await window.electronAPI.products.update(id, cleanProduct);
      this.clearCache();
      return result;
    } catch (error) {
      this.handleError(error, 'تحديث المنتج');
    }
  }

  async deleteProduct(id) {
    try {
      this.checkAPI();
      const result = await window.electronAPI.products.delete(id);
      this.clearCache();
      return result;
    } catch (error) {
      this.handleError(error, 'حذف المنتج');
    }
  }

  async searchProducts(searchTerm, category = '', supplier = '') {
    try {
      const products = await this.getProducts();
      return products.filter(product => {
        const matchesSearch = !searchTerm ||
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = !category || product.category === category;
        const matchesSupplier = !supplier || product.supplier === supplier;

        return matchesSearch && matchesCategory && matchesSupplier;
      });
    } catch (error) {
      this.handleError(error, 'البحث في المنتجات');
    }
  }

  // ==================== الفئات ====================

  async getCategories(useCache = true) {
    try {
      this.checkAPI();

      if (useCache) {
        const cached = this.getCache('categories');
        if (cached) return cached;
      }

      const categories = await window.electronAPI.categories.getAll();
      this.setCache('categories', categories);
      return categories;
    } catch (error) {
      this.handleError(error, 'جلب الفئات');
    }
  }

  async addCategory(category) {
    try {
      this.checkAPI();
      this.validateCategory(category);

      const cleanCategory = {
        ...category,
        name: category.name.trim(),
        description: category.description?.trim() || ''
      };

      const result = await window.electronAPI.categories.add(cleanCategory);
      this.clearCache();
      return result;
    } catch (error) {
      this.handleError(error, 'إضافة الفئة');
    }
  }

  async updateCategory(category) {
    try {
      this.checkAPI();
      this.validateCategory(category);

      if (!category.id) {
        throw new Error("معرّف الفئة (id) مطلوب للتعديل");
      }

      const cleanCategory = {
        ...category,
        id: category.id,
        name: category.name.trim(),
        description: category.description?.trim() || ''
      };

      const result = await window.electronAPI.categories.update(cleanCategory);
      this.clearCache();
      return result;
    } catch (error) {
      this.handleError(error, "تعديل الفئة");
    }
  }


  async deleteCategory(id) {
    try {
      this.checkAPI();

      if (!id) {
        throw new Error("معرّف الفئة (id) مطلوب للحذف");
      }

      const result = await window.electronAPI.categories.delete(id);
      this.clearCache(); // ✅ نحذف الكاش باش تتجدد البيانات
      return result;
    } catch (error) {
      this.handleError(error, "حذف الفئة");
    }
  }

  // ==================== الموردين ====================

  async getSuppliers(useCache = true) {
    try {
      this.checkAPI();

      if (useCache) {
        const cached = this.getCache('suppliers');
        if (cached) return cached;
      }

      const suppliers = await window.electronAPI.suppliers.getAll();
      this.setCache('suppliers', suppliers);
      return suppliers;
    } catch (error) {
      this.handleError(error, 'جلب الموردين');
    }
  }

  async addSupplier(supplier) {
    try {
      this.checkAPI();
      this.validateSupplier(supplier);

      const cleanSupplier = {
        ...supplier,
        name: supplier.name.trim(),
        contact_person: supplier.contact_person?.trim() || '',
        phone: supplier.phone?.trim() || '',
        email: supplier.email?.trim() || '',
        address: supplier.address?.trim() || ''
      };

      const result = await window.electronAPI.suppliers.add(cleanSupplier);
      this.clearCache();
      return result;
    } catch (error) {
      this.handleError(error, 'إضافة المورد');
    }
  }
  async updateSupplier(supplier) {
    try {
      this.checkAPI();
      this.validateSupplier(supplier);

      if (!supplier.id) {
        throw new Error("معرّف المورد (id) مطلوب للتعديل");
      }

      const cleanSupplier = {
        ...supplier,
        name: supplier.name.trim(),
        contact_person: supplier.contact_person?.trim() || '',
        phone: supplier.phone?.trim() || '',
        email: supplier.email?.trim() || '',
        address: supplier.address?.trim() || ''
      };

      const result = await window.electronAPI.suppliers.update(cleanSupplier);
      this.clearCache();
      return result;
    } catch (error) {
      this.handleError(error, 'تحديث المورد');
    }
  }
  async deleteSupplier(id) {
    try {
      this.checkAPI();

      if (!id) {
        throw new Error("معرّف المورد (id) مطلوب للحذف");
      }

      const result = await window.electronAPI.suppliers.delete(id);
      this.clearCache(); // نمسح الكاش باش تتجدد البيانات
      return result;
    } catch (error) {
      this.handleError(error, "حذف المورد");
    }
  }

  // ==================== العملاء ====================

  async getCustomers(useCache = true) {
    try {
      this.checkAPI();

      if (useCache) {
        const cached = this.getCache('customers');
        if (cached) return cached;
      }

      const customers = await window.electronAPI.customers.getAll();
      this.setCache('customers', customers);
      return customers;
    } catch (error) {
      this.handleError(error, 'جلب العملاء');
    }
  }

  async addCustomer(customer) {
    try {
      this.checkAPI();
      this.validateCustomer(customer);

      const cleanCustomer = {
        ...customer,
        name: customer.name.trim(),
        phone: customer.phone?.trim() || '',
        email: customer.email?.trim() || '',
        address: customer.address?.trim() || ''
      };

      const result = await window.electronAPI.customers.add(cleanCustomer);
      this.clearCache();
      return result;
    } catch (error) {
      this.handleError(error, 'إضافة العميل');
    }
  }
  async updateCustomer(id, customer) {
    try {
      this.checkAPI();
      this.validateCustomer(customer);

      const cleanCustomer = {
        ...customer,
        name: customer.name.trim(),
        phone: customer.phone?.trim() || '',
        email: customer.email?.trim() || '',
        address: customer.address?.trim() || ''
      };

      const result = await window.electronAPI.customers.update(id, cleanCustomer);
      this.clearCache();
      return result;
    } catch (error) {
      this.handleError(error, 'تحديث العميل');
    }
  }

  async deleteCustomer(id) {
    try {
      this.checkAPI();
      const result = await window.electronAPI.customers.delete(id);
      this.clearCache();
      return result;
    } catch (error) {
      this.handleError(error, 'حذف العميل');
    }
  }
  // ==================== المعاملات ====================


  // إضافة عملية بيع جديدة
  async addSale(transaction) {
    try {
      this.checkAPI();

      if (!transaction.items || transaction.items.length === 0) {
        throw new Error('يجب إضافة منتجات للبيع');
      }

      // التحقق من توفر الكمية
      for (let item of transaction.items) {
        const product = await this.getProductById(item.product_id);
        if (product.stock_quantity < item.quantity) {
          throw new Error(`الكمية المطلوبة من ${product.name} غير متوفرة. المتوفر: ${product.stock_quantity}`);
        }
      }

      const result = await window.electronAPI.transactions.addSale(transaction);
      this.clearCache(); // مسح التخزين المؤقت لتحديث المخزون
      return result;
    } catch (error) {
      this.handleError(error, 'إضافة عملية بيع');
    }
  }

  // جلب كل المبيعات
  async getAll() {
    try {
      this.checkAPI();
      const sales = await window.electronAPI.transactions.getAll();
      return sales;
    } catch (error) {
      this.handleError(error, 'جلب كل المبيعات');
    }
  }

  // حذف عملية بيع
  async delete(id) {
    try {
      this.checkAPI();
      const result = await window.electronAPI.transactions.delete(id);
      this.clearCache();
      return result;
    } catch (error) {
      this.handleError(error, 'حذف عملية بيع');
    }
  }

  // جلب تفاصيل فاتورة كاملة (بيانات الفاتورة + العناصر)
  async getDetailsFull(transactionId) {
    try {
      this.checkAPI();
      const fullInvoice = await window.electronAPI.transactions.getDetailsFull(transactionId);
      return fullInvoice;
    } catch (error) {
      this.handleError(error, 'جلب تفاصيل الفاتورة الكاملة');
    }
  }

  // جلب منتج محدد من فاتورة
  async getItem(transactionId, productId) {
    try {
      const fullInvoice = await this.getDetailsFull(transactionId);
      if (!fullInvoice) return null;
      return fullInvoice.items.find(item => item.product_id === productId) || null;
    } catch (error) {
      this.handleError(error, 'جلب منتج من الفاتورة');
    }
  }

 async returnItem(transactionId, productId, quantity) {
    try {
      const result = await window.electronAPI.transactions.returnItem(
      transactionId,
      productId,
      quantity
    );

      if (result.success) {
        console.log("🔄 تم إرجاع المنتج بنجاح:", result);
      } else {
        console.warn("⚠️ لم يتم إرجاع المنتج:", result);
      }

      return result;
    } catch (error) {
      console.error("❌ خطأ أثناء إرجاع المنتج:", error);
      throw error;
    }
  }


  // ==================== التقارير ====================

  async getLowStockProducts(useCache = false) {
        try {
          this.checkAPI();

          if (useCache) {
            const cached = this.getCache('lowStock');
            if (cached) return cached;
          }

          const lowStock = await window.electronAPI.reports.lowStock();
          if (useCache) {
            this.setCache('lowStock', lowStock);
          }
          return lowStock;
        } catch (error) {
          this.handleError(error, 'جلب المنتجات منخفضة المخزون');
        }
      }

  async getSalesSummary(startDate, endDate) {
        try {
          this.checkAPI();

          if (!startDate || !endDate) {
            throw new Error('يرجى تحديد تواريخ البداية والنهاية');
          }

          if (new Date(startDate) > new Date(endDate)) {
            throw new Error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
          }

          return await window.electronAPI.reports.salesSummary(startDate, endDate);
        } catch (error) {
          this.handleError(error, 'جلب تقرير المبيعات');
        }
      }

  // ==================== وظائف مساعدة ====================

  /**
   * حساب قيمة المخزون الإجمالية
   */
  async calculateTotalStockValue() {
        try {
          const products = await this.getProducts();
          return products.reduce((total, product) => {
            return total + (product.stock * (product.price || 0));
          }, 0);
        } catch (error) {
          this.handleError(error, 'حساب قيمة المخزون');
        }
      }

  /**
   * الحصول على إحصائيات شاملة
   */
  async getInventoryStats() {
        try {
          const products = await this.getProducts();
          const lowStockProducts = await this.getLowStockProducts();

          const stats = {
            totalProducts: products.length,
            inStockProducts: products.filter(p => p.stock > 0).length,
            outOfStockProducts: products.filter(p => p.stock === 0).length,
            lowStockProducts: lowStockProducts.length,
            totalStockValue: await this.calculateTotalStockValue(),
            avgProductValue: products.length > 0 ?
              (await this.calculateTotalStockValue()) / products.length : 0,
            categoriesCount: [...new Set(products.map(p => p.category).filter(Boolean))].length,
            suppliersCount: [...new Set(products.map(p => p.supplier).filter(Boolean))].length
          };

          return stats;
        } catch (error) {
          this.handleError(error, 'حساب الإحصائيات');
        }
      }

  /**
   * تصدير البيانات إلى JSON
   */
  async exportData() {
        try {
          const [products, categories, suppliers, customers] = await Promise.all([
            this.getProducts(),
            this.getCategories(),
            this.getSuppliers(),
            this.getCustomers()
          ]);

          const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            data: {
              products,
              categories,
              suppliers,
              customers
            }
          };

          return JSON.stringify(exportData, null, 2);
        } catch (error) {
          this.handleError(error, 'تصدير البيانات');
        }
      }

      /**
       * إنشاء رقم SKU تلقائي
       */
      generateSKU(categoryName, productName) {
        const categoryPrefix = categoryName ? categoryName.substring(0, 3).toUpperCase() : 'GEN';
        const productPrefix = productName.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        return `${categoryPrefix}-${productPrefix}-${timestamp}`;
      }

  /**
   * تحديث المخزون (إضافة أو خصم)
   */
  async updateStock(productId, quantity, operation = 'add') {
        try {
          const product = await this.getProductById(productId);
          const newStock = operation === 'add' ?
            product.stock + quantity :
            product.stock - quantity;

          if (newStock < 0) {
            throw new Error('الكمية المتبقية لا يمكن أن تكون سالبة');
          }

          return await this.updateProduct(productId, {
            ...product,
            stock: newStock
          });
        } catch (error) {
          this.handleError(error, 'تحديث المخزون');
        }
      }
    }

export default new InventoryService();