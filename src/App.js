import React, { useEffect, useState } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard';
import ProductsManager from './components/ProductsManager';
import CategoriesManager from './components/CategoriesManager';
import SalesManager from './components/SalesManager';
import Reports from './components/Reports';
import SuppliersManager from './components/SuppliersManager';
import CustomersManager from './components/CustomersManager';
import InventoryService from './database/inventoryService';
import Login from './components/Login'; // ✅ استدعاء صفحة تسجيل الدخول
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // ✅ حالة تسجيل الدخول

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // تحميل البيانات
  const loadData = async () => {
    try {
      const prod = await InventoryService.getProducts();
      const cats = await InventoryService.getCategories();
      const cust = await InventoryService.getCustomers();
      const supp = await InventoryService.getSuppliers();
      const low = await InventoryService.getLowStockProducts();

      setProducts(prod);
      setCategories(cats);
      setCustomers(cust);
      setSuppliers(supp);
      setLowStockProducts(low);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) loadData(); // ✅ تحميل البيانات فقط بعد تسجيل الدخول
  }, [isLoggedIn]);

  // إذا لم يسجل الدخول → عرض صفحة Login
  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }
 const handleLogout = () => {
  console.log("تم تسجيل الخروج");

  // مسح بيانات المستخدم (اختياري)
  localStorage.removeItem("user"); 
  sessionStorage.clear();

  // تغيير حالة تسجيل الدخول → يرجع لـ Login
  setIsLoggedIn(false);
};

  return (
    <div className="app-container d-flex">
      {/* القائمة الجانبية */}
       <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onLogout={handleLogout}  
      />

      {/* المحتوى */}
      <div 
        className="content p-4 flex-grow-1"
        style={{
          marginLeft: isCollapsed ? "70px" : "280px",
          transition: "margin-left 0.3s ease"
        }}
      >
        {activeTab === 'dashboard' && (
          <Dashboard products={products} lowStockProducts={lowStockProducts} />
        )}
        {activeTab === 'products' && (
          <ProductsManager
            products={products}
            categories={categories}
            suppliers={suppliers}
            onRefresh={loadData}
          />
        )}
        {activeTab === 'categories' && (
          <CategoriesManager categories={categories} onRefresh={loadData} />
        )}
        {activeTab === 'suppliers' && (
          <SuppliersManager suppliers={suppliers} onRefresh={loadData} />
        )}
        {activeTab === 'customers' && (
          <CustomersManager customers={customers} onRefresh={loadData} />
        )}
        {activeTab === 'sales' && (
          <SalesManager
            products={products}
            customers={customers}
            onRefresh={loadData}
          />
        )}
        {activeTab === 'reports' && (
          <Reports products={products} lowStockProducts={lowStockProducts} />
        )}
      </div>
    </div>
  );
}

export default App;
