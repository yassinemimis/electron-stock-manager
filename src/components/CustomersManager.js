import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CustomersManager.css';
import InventoryService from '../database/inventoryService';

const CustomersManager = ({ customers, onRefresh }) => {
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [filterType, setFilterType] = useState('all'); // 'all', 'hasPhone', 'hasEmail'

  // فلترة العملاء حسب البحث والنوع
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.address?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'hasPhone' && customer.phone) ||
      (filterType === 'hasEmail' && customer.email);

    return matchesSearch && matchesFilter;
  });

  const handleChange = (e) => {
    setNewCustomer({ ...newCustomer, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!newCustomer.name.trim()) {
      alert('اسم العميل مطلوب');
      return false;
    }
    if (newCustomer.email && !isValidEmail(newCustomer.email)) {
      alert('عنوان البريد الإلكتروني غير صحيح');
      return false;
    }
    if (newCustomer.phone && !isValidPhone(newCustomer.phone)) {
      alert('رقم الهاتف غير صحيح');
      return false;
    }
    return true;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingCustomer) {
        await InventoryService.updateCustomer(editingCustomer.id, newCustomer);
        setEditingCustomer(null);
        showSuccessToast('تم تحديث العميل بنجاح');
      } else {
        await InventoryService.addCustomer(newCustomer);
        showSuccessToast('تم إضافة العميل بنجاح');
      }
      
      resetForm();
      onRefresh();
    } catch (error) {
      alert('خطأ: ' + error.message);
    }
    setLoading(false);
  };

  const handleEdit = (customer) => {
    setNewCustomer({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || ''
    });
    setEditingCustomer(customer);
    setShowAddForm(true);
  };

  const handleDelete = async (id, customerName) => {
    if (!window.confirm(`هل أنت متأكد من حذف العميل "${customerName}"؟\nسيؤثر هذا على جميع المعاملات المرتبطة بهذا العميل.`)) {
      return;
    }

    setLoading(true);
    try {
      await InventoryService.deleteCustomer(id);
      onRefresh();
      showSuccessToast('تم حذف العميل بنجاح');
    } catch (error) {
      alert('خطأ في حذف العميل: ' + error.message);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      address: ''
    });
    setShowAddForm(false);
    setEditingCustomer(null);
  };

  const showSuccessToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'alert alert-success position-fixed';
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.innerHTML = `
      <i class="fas fa-check-circle me-2"></i>
      ${message}
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  };

  const getCustomerAvatar = (name) => {
    return name.charAt(0).toUpperCase();
  };

  const getCustomerColor = (index) => {
    const colors = [
      'primary', 'success', 'warning', 'info', 'secondary', 
      'danger', 'dark', 'primary', 'success', 'warning'
    ];
    return colors[index % colors.length];
  };

  const getCustomerType = (customer) => {
    if (customer.email && customer.phone) return { type: 'VIP', color: 'warning', icon: '👑' };
    if (customer.email) return { type: 'مميز', color: 'info', icon: '✉️' };
    if (customer.phone) return { type: 'عادي', color: 'success', icon: '📞' };
    return { type: 'بسيط', color: 'secondary', icon: '👤' };
  };

  return (
    <div className="customers-manager-container">
      {/* رأس القسم */}
      <div className="customers-header mb-4">
        <div className="row align-items-center">
          <div className="col-md-6">
            <h3 className="customers-title">
              <i className="fas fa-users me-3"></i>
              إدارة العملاء
            </h3>
            <p className="text-muted mb-0">
              إجمالي العملاء: <span className="fw-bold text-primary">{customers.length}</span>
            </p>
          </div>
          <div className="col-md-6 text-end">
            <div className="btn-group me-2">
              <button 
                className={`btn btn-outline-secondary ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
              >
                <i className="fas fa-th-large me-1"></i>
                بطاقات
              </button>
              <button 
                className={`btn btn-outline-secondary ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <i className="fas fa-table me-1"></i>
                جدول
              </button>
            </div>
            <button 
              className="btn btn-primary btn-lg shadow-sm"
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={loading}
            >
              <i className="fas fa-plus me-2"></i>
              {showAddForm ? 'إلغاء' : 'إضافة عميل جديد'}
            </button>
          </div>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="search-filter-bar mb-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body py-3">
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-light border-0">
                    <i className="fas fa-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-0 bg-light"
                    placeholder="البحث في العملاء (الاسم، الهاتف، البريد الإلكتروني، العنوان)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select border-0 bg-light"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">جميع العملاء</option>
                  <option value="hasPhone">العملاء مع هاتف</option>
                  <option value="hasEmail">العملاء مع بريد إلكتروني</option>
                </select>
              </div>
              <div className="col-md-2 text-end">
                <small className="text-muted">
                  {filteredCustomers.length} من {customers.length}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* نموذج إضافة/تعديل العميل */}
      {showAddForm && (
        <div className="add-customer-form mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-gradient-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-plus-circle me-2"></i>
                {editingCustomer ? 'تعديل العميل' : 'إضافة عميل جديد'}
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">اسم العميل *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control form-control-lg"
                    placeholder="الاسم الكامل للعميل"
                    value={newCustomer.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">رقم الهاتف</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control form-control-lg"
                    placeholder="0xx-xxx-xxxx"
                    value={newCustomer.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">البريد الإلكتروني</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control form-control-lg"
                    placeholder="customer@example.com"
                    value={newCustomer.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">العنوان</label>
                  <input
                    type="text"
                    name="address"
                    className="form-control form-control-lg"
                    placeholder="العنوان الكامل"
                    value={newCustomer.address}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="form-actions mt-4 text-end">
                <button 
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={resetForm}
                  disabled={loading}
                >
                  <i className="fas fa-times me-1"></i>
                  إلغاء
                </button>
                <button 
                  type="button"
                  className="btn btn-success btn-lg px-4"
                  onClick={handleAdd}
                  disabled={loading || !newCustomer.name.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {editingCustomer ? 'جارٍ التحديث...' : 'جارٍ الإضافة...'}
                    </>
                  ) : (
                    <>
                      <i className={`fas fa-${editingCustomer ? 'save' : 'check'} me-2`}></i>
                      {editingCustomer ? 'تحديث العميل' : 'إضافة العميل'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* عرض العملاء */}
      <div className="customers-display">
        {filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <i className="fas fa-users fa-4x text-muted mb-3"></i>
                <h5 className="text-muted">
                  {customers.length === 0 ? 'لا يوجد عملاء بعد' : 'لا توجد نتائج مطابقة للبحث'}
                </h5>
                <p className="text-muted">
                  {customers.length === 0 ? 
                    'ابدأ بإضافة عملاء لإدارة قاعدة بياناتك' : 
                    'جرب تغيير مصطلحات البحث أو الفلتر'
                  }
                </p>
                {customers.length === 0 && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowAddForm(true)}
                  >
                    <i className="fas fa-plus me-2"></i>
                    إضافة عميل جديد
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'cards' ? (
              // عرض البطاقات
              <div className="row g-4">
                {filteredCustomers.map((customer, index) => {
                  const customerType = getCustomerType(customer);
                  return (
                    <div key={customer.id} className="col-lg-4 col-md-6">
                      <div className="customer-card">
                        <div className="card h-100 border-0 shadow-sm">
                          <div className="card-body">
                            <div className="customer-header mb-3">
                              <div className="d-flex align-items-center">
                                <div className={`customer-avatar bg-${getCustomerColor(index)} me-3`}>
                                  {getCustomerAvatar(customer.name)}
                                </div>
                                <div className="flex-grow-1">
                                  <h5 className="customer-name mb-1">{customer.name}</h5>
                                  <div className="d-flex align-items-center">
                                    <span className={`badge bg-${customerType.color} bg-opacity-15 text-${customerType.color} me-2`}>
                                      {customerType.icon} {customerType.type}
                                    </span>
                                    <small className="text-muted">
                                      {new Date(customer.created_at).toLocaleDateString('ar-DZ')}
                                    </small>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="customer-details">
                              {customer.phone && (
                                <div className="detail-item mb-2">
                                  <i className="fas fa-phone text-success me-2"></i>
                                  <small className="text-muted">الهاتف:</small>
                                  <span className="ms-2 fw-semibold">{customer.phone}</span>
                                  <button 
                                    className="btn btn-sm btn-outline-success ms-2"
                                    onClick={() => window.open(`tel:${customer.phone}`)}
                                    title="اتصال"
                                  >
                                    <i className="fas fa-phone"></i>
                                  </button>
                                </div>
                              )}
                              {customer.email && (
                                <div className="detail-item mb-2">
                                  <i className="fas fa-envelope text-info me-2"></i>
                                  <small className="text-muted">البريد:</small>
                                  <span className="ms-2">{customer.email}</span>
                                  <button 
                                    className="btn btn-sm btn-outline-info ms-2"
                                    onClick={() => window.open(`mailto:${customer.email}`)}
                                    title="مراسلة"
                                  >
                                    <i className="fas fa-envelope"></i>
                                  </button>
                                </div>
                              )}
                              {customer.address && (
                                <div className="detail-item mb-2">
                                  <i className="fas fa-map-marker-alt text-warning me-2"></i>
                                  <small className="text-muted">العنوان:</small>
                                  <span className="ms-2">{customer.address}</span>
                                </div>
                              )}
                              {!customer.phone && !customer.email && !customer.address && (
                                <div className="text-center text-muted py-2">
                                  <i className="fas fa-info-circle me-1"></i>
                                  لا توجد تفاصيل إضافية
                                </div>
                              )}
                            </div>
                            
                            <div className="customer-actions mt-3">
                              <div className="btn-group w-100" role="group">
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => handleEdit(customer)}
                                  disabled={loading}
                                  title="تعديل العميل"
                                >
                                  <i className="fas fa-edit me-1"></i>
                                  تعديل
                                </button>
                                <button 
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDelete(customer.id, customer.name)}
                                  disabled={loading}
                                  title="حذف العميل"
                                >
                                  <i className="fas fa-trash me-1"></i>
                                  حذف
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // عرض الجدول
              <div className="customers-table">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th className="ps-4">
                              <i className="fas fa-user me-2"></i>العميل
                            </th>
                            <th>
                              <i className="fas fa-phone me-2"></i>الهاتف
                            </th>
                            <th>
                              <i className="fas fa-envelope me-2"></i>البريد الإلكتروني
                            </th>
                            <th>
                              <i className="fas fa-map-marker-alt me-2"></i>العنوان
                            </th>
                            <th>
                              <i className="fas fa-crown me-2"></i>النوع
                            </th>
                            <th className="text-center">
                              <i className="fas fa-cogs me-2"></i>العمليات
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCustomers.map((customer, index) => {
                            const customerType = getCustomerType(customer);
                            return (
                              <tr key={customer.id} className="table-row-hover">
                                <td className="ps-4">
                                  <div className="d-flex align-items-center">
                                    <div className={`customer-avatar-sm bg-${getCustomerColor(index)} me-3`}>
                                      {getCustomerAvatar(customer.name)}
                                    </div>
                                    <div>
                                      <div className="fw-semibold text-dark">{customer.name}</div>
                                      <small className="text-muted">
                                        {new Date(customer.created_at).toLocaleDateString('ar-DZ')}
                                      </small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  {customer.phone ? (
                                    <div className="d-flex align-items-center">
                                      <span className="fw-semibold text-success me-2">{customer.phone}</span>
                                      <button 
                                        className="btn btn-sm btn-outline-success"
                                        onClick={() => window.open(`tel:${customer.phone}`)}
                                        title="اتصال"
                                      >
                                        <i className="fas fa-phone"></i>
                                      </button>
                                    </div>
                                  ) : '-'}
                                </td>
                                <td>
                                  {customer.email ? (
                                    <div className="d-flex align-items-center">
                                      <span className="me-2">{customer.email}</span>
                                      <button 
                                        className="btn btn-sm btn-outline-info"
                                        onClick={() => window.open(`mailto:${customer.email}`)}
                                        title="مراسلة"
                                      >
                                        <i className="fas fa-envelope"></i>
                                      </button>
                                    </div>
                                  ) : '-'}
                                </td>
                                <td>{customer.address || '-'}</td>
                                <td>
                                  <span className={`badge bg-${customerType.color} bg-opacity-15 text-${customerType.color}`}>
                                    {customerType.icon} {customerType.type}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <div className="btn-group" role="group">
                                    <button 
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => handleEdit(customer)}
                                      disabled={loading}
                                      title="تعديل"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDelete(customer.id, customer.name)}
                                      disabled={loading}
                                      title="حذف"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* إحصائيات العملاء */}
      <div className="customers-stats mt-5">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-light border-0">
            <h6 className="mb-0">
              <i className="fas fa-chart-pie me-2 text-info"></i>
              إحصائيات العملاء
            </h6>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-3">
                <div className="stat-card bg-primary bg-opacity-10 p-3 rounded">
                  <i className="fas fa-users fa-2x text-primary mb-2"></i>
                  <h4 className="text-primary">{customers.length}</h4>
                  <small className="text-muted">إجمالي العملاء</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card bg-success bg-opacity-10 p-3 rounded">
                  <i className="fas fa-phone fa-2x text-success mb-2"></i>
                  <h4 className="text-success">
                    {customers.filter(c => c.phone).length}
                  </h4>
                  <small className="text-muted">لديهم هاتف</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card bg-info bg-opacity-10 p-3 rounded">
                  <i className="fas fa-envelope fa-2x text-info mb-2"></i>
                  <h4 className="text-info">
                    {customers.filter(c => c.email).length}
                  </h4>
                  <small className="text-muted">لديهم بريد إلكتروني</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card bg-warning bg-opacity-10 p-3 rounded">
                  <i className="fas fa-crown fa-2x text-warning mb-2"></i>
                  <h4 className="text-warning">
                    {customers.filter(c => c.phone && c.email).length}
                  </h4>
                  <small className="text-muted">عملاء VIP</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersManager;