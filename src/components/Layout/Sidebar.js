import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', name: 'لوحة التحكم', icon: '📊' },
    { id: 'products', name: 'المنتجات', icon: '📦' },
    { id: 'categories', name: 'الفئات', icon: '🏷️' },
    { id: 'suppliers', name: 'الموردين', icon: '🏭' },
    { id: 'customers', name: 'العملاء', icon: '👥' },
    { id: 'sales', name: 'المبيعات', icon: '💰' },
    { id: 'reports', name: 'التقارير', icon: '📈' }
  ];

  return (
    <div className="d-flex flex-column p-3 bg-dark text-white" style={{ width: '250px', minHeight: '100vh' }}>
      <h2 className="text-center mb-4">🏪 إدارة المخزون</h2>
      <nav>
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`btn w-100 text-start mb-2 ${activeTab === item.id ? 'btn-primary' : 'btn-outline-light'}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="me-2">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
