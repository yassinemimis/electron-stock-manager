import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CategoriesManager.css';
import InventoryService from '../database/inventoryService';

const CategoriesManager = ({ categories, onRefresh }) => {
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // فلترة الفئات حسب البحث
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newCategory.name.trim()) {
      alert('يرجى إدخال اسم الفئة');
      return;
    }

    setLoading(true);
    try {
      await InventoryService.addCategory(newCategory);
      setNewCategory({ name: '', description: '' });
      setShowAddForm(false);
      onRefresh();
      
      // إشعار نجاح
      showSuccessToast('تم إضافة الفئة بنجاح');
      
    } catch (error) {
      alert('خطأ في إضافة الفئة: ' + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id, categoryName) => {
    if (!window.confirm(`هل أنت متأكد من حذف الفئة "${categoryName}"؟\nسيؤثر هذا على جميع المنتجات في هذه الفئة.`)) {
      return;
    }

    setLoading(true);
    try {
      await InventoryService.deleteCategory(id);
      onRefresh();
      showSuccessToast('تم حذف الفئة بنجاح');
    } catch (error) {
      alert('خطأ في حذف الفئة: ' + error.message);
    }
    setLoading(false);
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

  const getCategoryIcon = (categoryName) => {
    const icons = {
      'إلكترونيات': '📱',
      'ملابس': '👕',
      'مواد غذائية': '🍎',
      'مكتبية': '📚',
      'أدوات': '🔧',
      'صحة وجمال': '💄',
      'رياضة': '⚽',
      'ألعاب': '🎮',
      'كتب': '📖',
      'أثاث': '🪑'
    };
    return icons[categoryName] || '📦';
  };

  const getCategoryColor = (index) => {
    const colors = [
      'primary', 'success', 'warning', 'info', 'secondary', 
      'danger', 'dark', 'primary', 'success', 'warning'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="categories-manager-container">
      {/* رأس القسم */}
      <div className="categories-header mb-4">
        <div className="row align-items-center">
          <div className="col-md-6">
            <h3 className="categories-title">
              <i className="fas fa-tags me-3"></i>
              إدارة الفئات
            </h3>
            <p className="text-muted mb-0">
              إجمالي الفئات: <span className="fw-bold text-primary">{categories.length}</span>
            </p>
          </div>
          <div className="col-md-6 text-end">
            <button 
              className="btn btn-primary btn-lg shadow-sm"
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={loading}
            >
              <i className="fas fa-plus me-2"></i>
              {showAddForm ? 'إلغاء' : 'إضافة فئة جديدة'}
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
                    placeholder="البحث في الفئات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4 text-end">
                <small className="text-muted">
                  عرض {filteredCategories.length} من {categories.length} فئة
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* نموذج إضافة الفئة */}
      {showAddForm && (
        <div className="add-category-form mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-gradient-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-plus-circle me-2"></i>
                إضافة فئة جديدة
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">اسم الفئة *</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="مثل: إلكترونيات، ملابس، مواد غذائية"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">وصف الفئة</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="وصف مختصر للفئة (اختياري)"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="form-actions mt-4 text-end">
                <button 
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={() => setShowAddForm(false)}
                  disabled={loading}
                >
                  <i className="fas fa-times me-1"></i>
                  إلغاء
                </button>
                <button 
                  type="button"
                  className="btn btn-success btn-lg px-4"
                  onClick={handleAdd}
                  disabled={loading || !newCategory.name.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      جارٍ الإضافة...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2"></i>
                      إضافة الفئة
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* عرض الفئات */}
      <div className="categories-display">
        {filteredCategories.length === 0 ? (
          <div className="empty-state">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <i className="fas fa-folder-open fa-4x text-muted mb-3"></i>
                <h5 className="text-muted">
                  {categories.length === 0 ? 'لا توجد فئات بعد' : 'لا توجد نتائج مطابقة للبحث'}
                </h5>
                <p className="text-muted">
                  {categories.length === 0 ? 
                    'ابدأ بإضافة فئات لتنظيم منتجاتك' : 
                    'جرب تغيير مصطلحات البحث'
                  }
                </p>
                {categories.length === 0 && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowAddForm(true)}
                  >
                    <i className="fas fa-plus me-2"></i>
                    إضافة فئة جديدة
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {filteredCategories.map((category, index) => (
              <div key={category.id} className="col-lg-4 col-md-6">
                <div className="category-card">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body d-flex flex-column">
                      <div className="category-header mb-3">
                        <div className="d-flex align-items-center">
                          <div className={`category-icon bg-${getCategoryColor(index)} bg-opacity-10 text-${getCategoryColor(index)} me-3`}>
                            <span className="category-emoji">
                              {getCategoryIcon(category.name)}
                            </span>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="category-name mb-1">{category.name}</h5>
                            <small className="text-muted">
                              تم الإنشاء: {new Date(category.created_at).toLocaleDateString('ar-DZ')}
                            </small>
                          </div>
                        </div>
                      </div>
                      
                      {category.description && (
                        <div className="category-description mb-3">
                          <p className="text-muted mb-0">{category.description}</p>
                        </div>
                      )}
                      
                      <div className="category-stats mb-3 flex-grow-1">
                        <div className="row text-center">
                          <div className="col-6">
                            <div className={`stat-item bg-${getCategoryColor(index)} bg-opacity-10 p-2 rounded`}>
                              <h6 className={`text-${getCategoryColor(index)} mb-0`}>--</h6>
                              <small className="text-muted">المنتجات</small>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className={`stat-item bg-${getCategoryColor(index)} bg-opacity-10 p-2 rounded`}>
                              <h6 className={`text-${getCategoryColor(index)} mb-0`}>--</h6>
                              <small className="text-muted">القيمة</small>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="category-actions">
                        <div className="btn-group w-100" role="group">
                          <button 
                            className={`btn btn-outline-${getCategoryColor(index)} btn-sm`}
                            title="تعديل الفئة"
                          >
                            <i className="fas fa-edit me-1"></i>
                            تعديل
                          </button>
                          <button 
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(category.id, category.name)}
                            disabled={loading}
                            title="حذف الفئة"
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
        )}
      </div>

      {/* إحصائيات سريعة */}
      <div className="categories-stats mt-5">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-light border-0">
            <h6 className="mb-0">
              <i className="fas fa-chart-bar me-2 text-info"></i>
              إحصائيات الفئات
            </h6>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-3">
                <div className="stat-card bg-primary bg-opacity-10 p-3 rounded">
                  <i className="fas fa-tags fa-2x text-primary mb-2"></i>
                  <h4 className="text-primary">{categories.length}</h4>
                  <small className="text-muted">إجمالي الفئات</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card bg-success bg-opacity-10 p-3 rounded">
                  <i className="fas fa-plus-circle fa-2x text-success mb-2"></i>
                  <h4 className="text-success">--</h4>
                  <small className="text-muted">فئات نشطة</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card bg-warning bg-opacity-10 p-3 rounded">
                  <i className="fas fa-boxes fa-2x text-warning mb-2"></i>
                  <h4 className="text-warning">--</h4>
                  <small className="text-muted">متوسط المنتجات</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card bg-info bg-opacity-10 p-3 rounded">
                  <i className="fas fa-chart-line fa-2x text-info mb-2"></i>
                  <h4 className="text-info">--</h4>
                  <small className="text-muted">الأكثر استخداماً</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesManager;