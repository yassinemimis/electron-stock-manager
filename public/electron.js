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

    // إدراج بيانات أساسية
    insertInitialData();
  });
}

// إدراج بيانات أولية
function insertInitialData() {
  // فئات أساسية
  const categories = [
    ['إلكترونيات', 'أجهزة إلكترونية ومعدات'],
    ['ملابس', 'ملابس وأزياء'],
    ['مواد غذائية', 'أطعمة ومشروبات'],
    ['مكتبية', 'أدوات مكتبية وقرطاسية']
  ];

  categories.forEach(category => {
    db.run('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)', category);
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
    db.run('INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)', 
    [name, phone, email, address], 
    function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, ...customer });
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