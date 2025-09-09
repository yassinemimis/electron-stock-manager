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
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // تحميل البيانات من قاعدة البيانات
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
    loadData();
  }, []);

  return (
    <div className="app-container d-flex">
      {/* القائمة الجانبية */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* المحتوى */}
      <div className="content p-4 flex-grow-1">
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
