import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './SuppliersManager.css';
import InventoryService from '../database/inventoryService';

const SuppliersManager = ({ suppliers, onRefresh }) => {
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  // فلترة الموردين حسب البحث
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.includes(searchTerm) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e) => {
    setNewSupplier({ ...newSupplier, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!newSupplier.name.trim()) {
      alert('اسم المورد مطلوب');
      return false;
    }
    if (newSupplier.email && !isValidEmail(newSupplier.email)) {
      alert('عنوان البريد الإلكتروني غير صحيح');
      return false;
    }
    if (newSupplier.phone && !isValidPhone(newSupplier.phone)) {
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
      if (editingSupplier) {
        await InventoryService.updateSupplier(editingSupplier.id, newSupplier);
        setEditingSupplier(null);
        showSuccessToast('تم تحديث المورد بنجاح');
      } else {
        await InventoryService.addSupplier(newSupplier);
        showSuccessToast('تم إضافة المورد بنجاح');
      }
      
      resetForm();
      onRefresh();
    } catch (error) {
      alert('خطأ: ' + error.message);
    }
    setLoading(false);
  };

  const handleEdit = (supplier) => {
    setNewSupplier({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || ''
    });
    setEditingSupplier(supplier);
    setShowAddForm(true);
  };

  const handleDelete = async (id, supplierName) => {
    if (!window.confirm(`هل أنت متأكد من حذف المورد "${supplierName}"؟\nسيؤثر هذا على جميع المنتجات المرتبطة بهذا المورد.`)) {
      return;
    }

    setLoading(true);
    try {
      await InventoryService.deleteSupplier(id);
      onRefresh();
      showSuccessToast('تم حذف المورد بنجاح');
    } catch (error) {
      alert('خطأ في حذف المورد: ' + error.message);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setNewSupplier({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: ''
    });
    setShowAddForm(false);
    setEditingSupplier(null);
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

  const getSupplierAvatar = (name) => {
    return name.charAt(0).toUpperCase();
  };

  const getSupplierColor = (index) => {
    const colors = [
      'primary', 'success', 'warning', 'info', 'secondary', 
      'danger', 'dark', 'primary', 'success', 'warning'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="suppliers-manager-container">
      {/* رأس القسم */}
      <div className="suppliers-header mb-4">
        <div className="row align-items-center">
          <div className="col-md-6">
            <h3 className="suppliers-title">
              <i className="fas fa-truck me-3"></i>
              إدارة الموردين
            </h3>
            <p className="text-muted mb-0">
              إجمالي الموردين: <span className="fw-bold text-primary">{suppliers.length}</span>
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
              {showAddForm ? 'إلغاء' : 'إضافة مورد جديد'}
            </button>
          </div>
        </div>
      </div>

      {/* شريط البحث */}
      <div className="search-bar mb-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body py-3">
            <div className="row align-items-center">
              <div className="col-md-8">
                <div className="input-group">
                  <span className="input-group-text bg-light border-0">
                    <i className="fas fa-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-0 bg-light"
                    placeholder="البحث في الموردين (الاسم، الهاتف، البريد الإلكتروني)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4 text-end">
                <small className="text-muted">
                  عرض {filteredSuppliers.length} من {suppliers.length} مورد
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* نموذج إضافة/تعديل المورد */}
      {showAddForm && (
        <div className="add-supplier-form mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-gradient-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-plus-circle me-2"></i>
                {editingSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">اسم المورد *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control form-control-lg"
                    placeholder="اسم الشركة أو المورد"
                    value={newSupplier.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">اسم المسؤول</label>
                  <input
                    type="text"
                    name="contact_person"
                    className="form-control form-control-lg"
                    placeholder="اسم الشخص المسؤول"
                    value={newSupplier.contact_person}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">رقم الهاتف</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control form-control-lg"
                    placeholder="0xx-xxx-xxxx"
                    value={newSupplier.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">البريد الإلكتروني</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control form-control-lg"
                    placeholder="supplier@example.com"
                    value={newSupplier.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">العنوان</label>
                  <input
                    type="text"
                    name="address"
                    className="form-control form-control-lg"
                    placeholder="العنوان الكامل"
                    value={newSupplier.address}
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
                  disabled={loading || !newSupplier.name.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {editingSupplier ? 'جارٍ التحديث...' : 'جارٍ الإضافة...'}
                    </>
                  ) : (
                    <>
                      <i className={`fas fa-${editingSupplier ? 'save' : 'check'} me-2`}></i>
                      {editingSupplier ? 'تحديث المورد' : 'إضافة المورد'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* عرض الموردين */}
      <div className="suppliers-display">
        {filteredSuppliers.length === 0 ? (
          <div className="empty-state">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <i className="fas fa-truck fa-4x text-muted mb-3"></i>
                <h5 className="text-muted">
                  {suppliers.length === 0 ? 'لا يوجد موردين بعد' : 'لا توجد نتائج مطابقة للبحث'}
                </h5>
                <p className="text-muted">
                  {suppliers.length === 0 ? 
                    'ابدأ بإضافة موردين لإدارة مصادر منتجاتك' : 
                    'جرب تغيير مصطلحات البحث'
                  }
                </p>
                {suppliers.length === 0 && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowAddForm(true)}
                  >
                    <i className="fas fa-plus me-2"></i>
                    إضافة مورد جديد
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
                {filteredSuppliers.map((supplier, index) => (
                  <div key={supplier.id} className="col-lg-4 col-md-6">
                    <div className="supplier-card">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body">
                          <div className="supplier-header mb-3">
                            <div className="d-flex align-items-center">
                              <div className={`supplier-avatar bg-${getSupplierColor(index)} me-3`}>
                                {getSupplierAvatar(supplier.name)}
                              </div>
                              <div className="flex-grow-1">
                                <h5 className="supplier-name mb-1">{supplier.name}</h5>
                                <small className="text-muted">
                                  تم التسجيل: {new Date(supplier.created_at).toLocaleDateString('ar-DZ')}
                                </small>
                              </div>
                            </div>
                          </div>
                          
                          <div className="supplier-details">
                            {supplier.contact_person && (
                              <div className="detail-item mb-2">
                                <i className="fas fa-user text-muted me-2"></i>
                                <small className="text-muted">المسؤول:</small>
                                <span className="ms-2">{supplier.contact_person}</span>
                              </div>
                            )}
                            {supplier.phone && (
                              <div className="detail-item mb-2">
                                <i className="fas fa-phone text-success me-2"></i>
                                <small className="text-muted">الهاتف:</small>
                                <span className="ms-2 fw-semibold">{supplier.phone}</span>
                              </div>
                            )}
                            {supplier.email && (
                              <div className="detail-item mb-2">
                                <i className="fas fa-envelope text-info me-2"></i>
                                <small className="text-muted">البريد:</small>
                                <span className="ms-2">{supplier.email}</span>
                              </div>
                            )}
                            {supplier.address && (
                              <div className="detail-item mb-2">
                                <i className="fas fa-map-marker-alt text-warning me-2"></i>
                                <small className="text-muted">العنوان:</small>
                                <span className="ms-2">{supplier.address}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="supplier-actions mt-3">
                            <div className="btn-group w-100" role="group">
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleEdit(supplier)}
                                disabled={loading}
                                title="تعديل المورد"
                              >
                                <i className="fas fa-edit me-1"></i>
                                تعديل
                              </button>
                              <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDelete(supplier.id, supplier.name)}
                                disabled={loading}
                                title="حذف المورد"
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
                ))}
              </div>
            ) : (
              // عرض الجدول
              <div className="suppliers-table">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th className="ps-4">
                              <i className="fas fa-truck me-2"></i>المورد
                            </th>
                            <th>
                              <i className="fas fa-user me-2"></i>المسؤول
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
                            <th className="text-center">
                              <i className="fas fa-cogs me-2"></i>العمليات
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSuppliers.map((supplier, index) => (
                            <tr key={supplier.id} className="table-row-hover">
                              <td className="ps-4">
                                <div className="d-flex align-items-center">
                                  <div className={`supplier-avatar-sm bg-${getSupplierColor(index)} me-3`}>
                                    {getSupplierAvatar(supplier.name)}
                                  </div>
                                  <div>
                                    <div className="fw-semibold text-dark">{supplier.name}</div>
                                    <small className="text-muted">
                                      {new Date(supplier.created_at).toLocaleDateString('ar-DZ')}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td>{supplier.contact_person || '-'}</td>
                              <td>
                                {supplier.phone ? (
                                  <span className="fw-semibold text-success">{supplier.phone}</span>
                                ) : '-'}
                              </td>
                              <td>
                                {supplier.email ? (
                                  <a href={`mailto:${supplier.email}`} className="text-decoration-none">
                                    {supplier.email}
                                  </a>
                                ) : '-'}
                              </td>
                              <td>{supplier.address || '-'}</td>
                              <td className="text-center">
                                <div className="btn-group" role="group">
                                  <button 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleEdit(supplier)}
                                    disabled={loading}
                                    title="تعديل"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDelete(supplier.id, supplier.name)}
                                    disabled={loading}
                                    title="حذف"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
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

      {/* إحصائيات الموردين */}
      <div className="suppliers-stats mt-5">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-light border-0">
            <h6 className="mb-0">
              <i className="fas fa-chart-bar me-2 text-info"></i>
              إحصائيات الموردين
            </h6>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-3">
                <div className="stat-card bg-primary bg-opacity-10 p-3 rounded">
                  <i className="fas fa-truck fa-2x text-primary mb-2"></i>
                  <h4 className="text-primary">{suppliers.length}</h4>
                  <small className="text-muted">إجمالي الموردين</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card bg-success bg-opacity-10 p-3 rounded">
                  <i className="fas fa-phone fa-2x text-success mb-2"></i>
                  <h4 className="text-success">
                    {suppliers.filter(s => s.phone).length}
                  </h4>
                  <small className="text-muted">لديهم هاتف</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card bg-info bg-opacity-10 p-3 rounded">
                  <i className="fas fa-envelope fa-2x text-info mb-2"></i>
                  <h4 className="text-info">
                    {suppliers.filter(s => s.email).length}
                  </h4>
                  <small className="text-muted">لديهم بريد إلكتروني</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card bg-warning bg-opacity-10 p-3 rounded">
                  <i className="fas fa-map-marker-alt fa-2x text-warning mb-2"></i>
                  <h4 className="text-warning">
                    {suppliers.filter(s => s.address).length}
                  </h4>
                  <small className="text-muted">لديهم عنوان</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuppliersManager;