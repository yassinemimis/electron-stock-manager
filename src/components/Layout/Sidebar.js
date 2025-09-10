import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed, onLogout }) => {
  const menuItems = [
    {
      id: 'dashboard',
      name: 'لوحة التحكم',
      icon: 'fas fa-chart-line',
      description: 'نظرة عامة على النظام',
      badge: { text: 'جديد', color: 'success' }
    },
    {
      id: 'products',
      name: 'المنتجات',
      icon: 'fas fa-box-open',
      description: 'إدارة المنتجات',
      badge: { text: '12', color: 'primary' }
    },
    {
      id: 'categories',
      name: 'الفئات',
      icon: 'fas fa-tags',
      description: 'تصنيف المنتجات',
      badge: { text: '5', color: 'danger' }
    },
    {
      id: 'suppliers',
      name: 'الموردين',
      icon: 'fas fa-truck',
      description: 'إدارة الموردين',
      badge: { text: '3', color: 'info' }
    },
    {
      id: 'customers',
      name: 'العملاء',
      icon: 'fas fa-users',
      description: 'قاعدة بيانات العملاء',
      badge: { text: '50', color: 'secondary' }
    },
    {
      id: 'sales',
      name: 'المبيعات',
      icon: 'fas fa-shopping-cart',
      description: 'تسجيل وإدارة المبيعات',
      badge: { text: '7', color: 'warning' }
    },
    {
      id: 'reports',
      name: 'التقارير',
      icon: 'fas fa-chart-bar',
      description: 'التقارير والإحصائيات',
      badge: { text: '4', color: 'purple' }
    }
  ];

  return (
    <div
      className={`sidebar-container d-flex flex-column bg-dark text-white position-fixed ${isCollapsed ? 'collapsed' : ''}`}
      style={{
        width: isCollapsed ? '70px' : '280px',
        minHeight: '100vh',
        transition: 'width 0.3s ease',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}
    >
      {/* Header */}
      <div className="sidebar-header p-1 border-bottom border-secondary">
        <div className="d-flex align-items-center justify-content-between">
          {!isCollapsed && (
            <div className="brand-section d-flex align-items-center">
              <img
                src="/logo.png"
                alt="Logo"
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "contain",
                  marginRight: "10px"
                }}
              />
              <div>
                <h4 className="mb-0 fw-bold text-primary">
                  <i className="fas fa-store me-3"></i>
                  إدارة المخزون
                </h4>
                <small className="text-white">نظام متكامل للإدارة</small>
              </div>
            </div>
          )}

          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
          >
            <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav flex-grow-1 p-3">
        <div className="nav-section">
          {!isCollapsed && (
            <h6 className="nav-header text-white text-uppercase small mb-3">
              القائمة الرئيسية
            </h6>
          )}

          {menuItems.map(item => (
            <div key={item.id} className="nav-item mb-1 position-relative">
              <button
                className={`nav-link btn w-100 text-start d-flex align-items-center p-3 rounded ${
                  activeTab === item.id ? 'btn-primary text-white' : 'btn-dark text-light'
                }`}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.name : ''}
                style={{
                  transition: 'all 0.3s ease',
                  border: activeTab === item.id ? '1px solid var(--bs-primary)' : '1px solid transparent'
                }}
              >
                <i className={`${item.icon} ${isCollapsed ? 'fa-lg mx-auto' : 'me-3'}`}></i>

                {!isCollapsed && (
                  <div className="nav-content flex-grow-1">
                    <div className="nav-title fw-semibold">{item.name}</div>
                    <small className="nav-description text-white d-block">
                      {item.description}
                    </small>
                  </div>
                )}

                {/* Badge */}
                {item.badge && (
                  isCollapsed ? (
                    <span
                      className={`position-absolute top-50 end-0 translate-middle badge rounded-pill bg-${item.badge.color}`}
                      style={{
                        fontSize: '0.6rem',
                        transform: 'translate(-30%, -50%)'
                      }}
                    >
                      •
                    </span>
                  ) : (
                    <span className={`badge bg-${item.badge.color} ms-auto`}>
                      {item.badge.text}
                    </span>
                  )
                )}
              </button>
            </div>
          ))}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-top border-secondary">
        <button
          className="btn btn-danger w-100 d-flex align-items-center justify-content-center"
          onClick={onLogout}
        >
          <i className="fas fa-sign-out-alt me-2"></i>
          {!isCollapsed && "تسجيل الخروج"}
        </button>
      </div>

      {/* Extra CSS */}
      <style jsx>{`
        .nav-item .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-color: var(--bs-primary) !important;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
