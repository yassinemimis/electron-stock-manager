const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let mainWindow;
let db;

// إعداد قاعدة البيانات
function createDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'inventory.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('خطأ في فتح قاعدة البيانات:', err.message);
    } else {
      console.log('تم الاتصال بقاعدة البيانات SQLite');
      initializeDatabase();
    }
  });
}

// إنشاء الجداول
function initializeDatabase() {
  db.serialize(() => {
    // جدول الفئات
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول الموردين
    db.run(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول المنتجات
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        barcode TEXT,
        category_id INTEGER,
        supplier_id INTEGER,
        unit_price REAL DEFAULT 0,
        selling_price REAL DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
      )
    `);

    // جدول العملاء
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول المعاملات
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL, -- 'purchase' or 'sale'
        reference_number TEXT,
        customer_id INTEGER,
        supplier_id INTEGER,
        total_amount REAL DEFAULT 0,
        notes TEXT,
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
      )
    `);

    // جدول تفاصيل المعاملات
    db.run(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES transactions (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);

    // جدول حركة المخزون
    db.run(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        movement_type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
        quantity INTEGER NOT NULL,
        reference_id INTEGER, -- ID من transactions أو adjustment
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);


  });
}


// إنشاء النافذة الرئيسية
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// === عمليات المنتجات ===
ipcMain.handle('products-get-all', async () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT p.*, c.name as category_name, s.name as supplier_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.name
    `, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('products-add', async (event, product) => {
  return new Promise((resolve, reject) => {
    const { name, sku, barcode, category_id, supplier_id, unit_price, selling_price, stock_quantity, min_stock_level, description } = product;
    db.run(`
      INSERT INTO products (name, sku, barcode, category_id, supplier_id, unit_price, selling_price, stock_quantity, min_stock_level, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, sku, barcode, category_id, supplier_id, unit_price, selling_price, stock_quantity, min_stock_level, description], 
    function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, ...product });
    });
  });
});

ipcMain.handle('products-update', async (event, id, product) => {
  return new Promise((resolve, reject) => {
    const { name, sku, barcode, category_id, supplier_id, unit_price, selling_price, stock_quantity, min_stock_level, description } = product;
    db.run(`
      UPDATE products SET name=?, sku=?, barcode=?, category_id=?, supplier_id=?, 
      unit_price=?, selling_price=?, stock_quantity=?, min_stock_level=?, description=?
      WHERE id=?
    `, [name, sku, barcode, category_id, supplier_id, unit_price, selling_price, stock_quantity, min_stock_level, description, id], 
    function(err) {
      if (err) reject(err);
      else resolve({ id, ...product });
    });
  });
});
ipcMain.handle('products-update-stock', async (event, { productId, quantity }) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`,
      [quantity, productId],
      function (err) {
        if (err) return reject(err);
        resolve({ success: true, changes: this.changes });
      }
    );
  });
});


ipcMain.handle('products-delete', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve({ deletedRows: this.changes });
    });
  });
});

// === عمليات الفئات ===
ipcMain.handle('categories-get-all', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM categories ORDER BY name', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('categories-add', async (event, category) => {
  return new Promise((resolve, reject) => {
    const { name, description } = category;
    db.run('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description], 
    function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, ...category });
    });
  });
});
// === تحديث الفئة ===
ipcMain.handle('categories-update', async (event, category) => {
  try {
    if (!category) throw new Error("الفئة غير معرفة");
    const { id, name, description } = category;
    if (!id) throw new Error("معرّف الفئة (id) مطلوب للتعديل");

    await db.run(
      `UPDATE categories SET name = ?, description = ? WHERE id = ?`,
      [name, description, id]
    );

    return { success: true };
  } catch (error) {
    console.error("خطأ في تحديث الفئة:", error.message);
    throw error;
  }
});

// === حذف الفئة ===
ipcMain.handle('categories-delete', async (event, id) => {
  return new Promise((resolve, reject) => {
    try {
      if (!id) {
        reject(new Error("معرّف الفئة (id) مطلوب للحذف"));
        return;
      }

      db.run(`DELETE FROM categories WHERE id = ?`, [id], function (err) {
        if (err) {
          console.error("خطأ في حذف الفئة:", err.message);
          reject(err);
        } else {
          resolve({ success: true, deletedRows: this.changes });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
});


// === عمليات الموردين ===
ipcMain.handle('suppliers-get-all', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM suppliers ORDER BY name', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('suppliers-add', async (event, supplier) => {
  return new Promise((resolve, reject) => {
    const { name, contact_person, phone, email, address } = supplier;
    db.run('INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)', 
    [name, contact_person, phone, email, address], 
    function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, ...supplier });
    });
  });
});
// === تحديث مورد ===
// === تحديث المورد ===
ipcMain.handle('suppliers-update', async (event, supplier) => {
  try {
    if (!supplier.id) throw new Error("معرّف المورد (id) مطلوب للتعديل");

    await db.run(
      `UPDATE suppliers 
       SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?
       WHERE id = ?`,
      [
        supplier.name,
        supplier.contact_person || '',
        supplier.phone || '',
        supplier.email || '',
        supplier.address || '',
        supplier.id
      ]
    );

    return { success: true };
  } catch (error) {
    console.error("خطأ في تحديث المورد:", error.message);
    throw error;
  }
});

// === حذف المورد ===
ipcMain.handle('suppliers-delete', async (event, id) => {
  try {
    if (!id) throw new Error("معرّف المورد (id) مطلوب للحذف");

    await db.run(
      `DELETE FROM suppliers WHERE id = ?`,
      [id]
    );

    return { success: true };
  } catch (error) {
    console.error("خطأ في حذف المورد:", error.message);
    throw error;
  }
});

// === عمليات العملاء ===
ipcMain.handle('customers-get-all', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM customers ORDER BY name', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('customers-add', async (event, customer) => {
  return new Promise((resolve, reject) => {
    const { name, phone, email, address } = customer;
    db.run(
      'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)', 
      [name, phone, email, address], 
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...customer });
      }
    );
  });
});

// تحديث عميل
ipcMain.handle('customers-update', async (event, id, customer) => {
  return new Promise((resolve, reject) => {
    const { name, phone, email, address } = customer;
    db.run(
      'UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?', 
      [name, phone, email, address, id], 
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, id, ...customer });
      }
    );
  });
});

// حذف عميل
ipcMain.handle('customers-delete', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM customers WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, id });
    });
  });
});

// === عمليات المعاملات ===
ipcMain.handle('transactions-add-sale', async (event, transaction) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // إدراج المعاملة
      db.run(`
        INSERT INTO transactions (type, reference_number, customer_id, total_amount, notes)
        VALUES ('sale', ?, ?, ?, ?)
      `, [transaction.reference_number, transaction.customer_id, transaction.total_amount, transaction.notes], 
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
        
        const transactionId = this.lastID;
        let itemsProcessed = 0;
        
        // معالجة العناصر
        transaction.items.forEach(item => {
          // إدراج عنصر المعاملة
          db.run(`
            INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, total_price)
            VALUES (?, ?, ?, ?, ?)
          `, [transactionId, item.product_id, item.quantity, item.unit_price, item.total_price]);
          
          // تحديث المخزون
          db.run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', 
          [item.quantity, item.product_id]);
          
          // إضافة حركة مخزون
          db.run(`
            INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes)
            VALUES (?, 'out', ?, ?, ?)
          `, [item.product_id, item.quantity, transactionId, 'بيع']);
          
          itemsProcessed++;
          if (itemsProcessed === transaction.items.length) {
            db.run('COMMIT');
            resolve({ id: transactionId, ...transaction });
          }
        });
      });
    });
  });
});
ipcMain.handle('transactions-get-all', async () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT t.id, t.reference_number, t.total_amount, t.transaction_date, c.name AS customer_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.type = 'sale'
      ORDER BY t.transaction_date DESC
    `, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});
ipcMain.handle('transactions-get-details-full', async (event, transactionId) => {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT t.id, t.reference_number, t.total_amount, t.transaction_date, t.notes,
             c.name AS customer_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.id = ?
    `, [transactionId], (err, transaction) => {
      if (err) return reject(err);
      if (!transaction) return resolve(null);

     db.all(`
  SELECT ti.id, ti.product_id, p.name AS product_name, ti.quantity, ti.unit_price, ti.total_price
  FROM transaction_items ti
  JOIN products p ON ti.product_id = p.id
  WHERE ti.transaction_id = ?
`, [transactionId], (err2, items) => {
  if (err2) return reject(err2);
  // التأكد أن items دائمًا مصفوفة
  resolve({ ...transaction, items: items || [] });
});

    });
  });
});


ipcMain.handle('transactions-delete', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // أولاً استرجاع العناصر لتحديث المخزون
      db.all(`SELECT product_id, quantity FROM transaction_items WHERE transaction_id = ?`, [id], (err, items) => {
        if (err) return reject(err);

        items.forEach(item => {
          db.run(`
            INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes)
            VALUES (?, 'in', ?, ?, 'حذف عملية بيع واسترجاع المخزون')
          `, [item.product_id, item.quantity, id]);
        });

        // حذف العناصر
        db.run(`DELETE FROM transaction_items WHERE transaction_id = ?`, [id], (err2) => {
          if (err2) return reject(err2);

          // حذف العملية
          db.run(`DELETE FROM transactions WHERE id = ?`, [id], (err3) => {
            if (err3) return reject(err3);
            resolve({ success: true });
          });
        });
      });
    });
  });
});
ipcMain.handle('transactions-return-item', async (event, { transactionId, productId, quantity }) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // جلب المنتج من تفاصيل الفاتورة
      db.get(
        `SELECT * FROM transaction_items WHERE transaction_id = ? AND product_id = ?`,
        [transactionId, productId],
        (err, item) => {
          if (err) return reject(err);
          if (!item) return reject(new Error("⚠️ المنتج غير موجود في الفاتورة"));

          if (quantity > item.quantity) {
            return reject(new Error("⚠️ الكمية المراد إرجاعها أكبر من كمية الشراء"));
          }

          // حساب الكمية الجديدة
          const newQuantity = item.quantity - quantity;
          const newTotalPrice = newQuantity * item.unit_price;

          // تحديث جدول transaction_items
          if (newQuantity === 0) {
            db.run(`DELETE FROM transaction_items WHERE id = ?`, [item.id]);
          } else {
            db.run(
              `UPDATE transaction_items SET quantity = ?, total_price = ? WHERE id = ?`,
              [newQuantity, newTotalPrice, item.id]
            );
          }

          // تحديث جدول transactions (المجموع الكلي)
          db.get(
            `SELECT SUM(total_price) AS total FROM transaction_items WHERE transaction_id = ?`,
            [transactionId],
            (err2, row) => {
              if (err2) return reject(err2);

              const newTotalAmount = row.total || 0;
              db.run(`UPDATE transactions SET total_amount = ? WHERE id = ?`, [newTotalAmount, transactionId]);

              // تحديث المخزون (products)
              db.run(
                `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`,
                [quantity, productId]
              );

              resolve({ success: true, newTotalAmount, newQuantity });
            }
          );
        }
      );
    });
  });
});


// === التقارير ===
ipcMain.handle('reports-low-stock', async () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock_quantity <= p.min_stock_level
      ORDER BY p.stock_quantity ASC
    `, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('reports-sales-summary', async (event, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        DATE(t.transaction_date) as date,
        COUNT(*) as transaction_count,
        SUM(t.total_amount) as total_sales
      FROM transactions t
      WHERE t.type = 'sale' AND DATE(t.transaction_date) BETWEEN ? AND ?
      GROUP BY DATE(t.transaction_date)
      ORDER BY date DESC
    `, [startDate, endDate], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});
ipcMain.handle('stock-movement-add', async (event, movement) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [
        movement.product_id,
        movement.movement_type,
        movement.quantity,
        movement.reference_id,
        movement.notes
      ],
      function (err) {
        if (err) return reject(err);
        resolve({ success: true, id: this.lastID });
      }
    );
  });
});


// أحداث التطبيق
app.whenReady().then(() => {
  createDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (db) {
    db.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});