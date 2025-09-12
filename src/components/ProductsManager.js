import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './ProductsManager.css';
import InventoryService from '../database/inventoryService';

const ProductsManager = ({ products, categories, suppliers, onRefresh }) => {
  const [newProduct, setNewProduct] = useState({
    name: '',
    category_id: '',
    supplier_id: '',
    stock_quantity: 0,
    unit_price: '',
    selling_price: '',
    sku: '',
    description: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // تصفية المنتجات حسب البحث والفئة
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !filterCategory || product.category_id === parseInt(filterCategory);
    return matchesSearch && matchesCategory;
  });

  const handleAdd = async () => {
    if (!newProduct.name.trim()) {
      alert('يرجى إدخال اسم المنتج');
      return;
    }

    setLoading(true);
    try {
      await InventoryService.addProduct(newProduct);
      setNewProduct({
        name: '',
        category_id: '',
        supplier_id: '',
        stock_quantity: 0,
        unit_price: '',
        selling_price: '',
        sku: '',
        description: ''
      });
      setShowAddForm(false);
      onRefresh();

      // إشعار نجاح
      const successToast = document.createElement('div');
      successToast.className = 'alert alert-success position-fixed';
      successToast.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
      successToast.innerHTML = '✅ تم إضافة المنتج بنجاح';
      document.body.appendChild(successToast);
      setTimeout(() => document.body.removeChild(successToast), 3000);
    } catch (error) {
      alert('خطأ في إضافة المنتج: ' + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id, productName) => {
    if (!window.confirm(`هل أنت متأكد من حذف المنتج "${productName}"؟`)) return;
    setLoading(true);
    try {
      await InventoryService.deleteProduct(id);
      onRefresh();

      const successToast = document.createElement('div');
      successToast.className = 'alert alert-warning position-fixed';
      successToast.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
      successToast.innerHTML = '🗑️ تم حذف المنتج بنجاح';
      document.body.appendChild(successToast);
      setTimeout(() => document.body.removeChild(successToast), 3000);
    } catch (error) {
      alert('خطأ في حذف المنتج: ' + error.message);
    }
    setLoading(false);
  };
  const handleUpdate = async () => {
    if (!editingProduct.name.trim()) {
      alert("يرجى إدخال اسم المنتج");
      return;
    }

    setLoading(true);
    try {
      await InventoryService.updateProduct(editingProduct.id, editingProduct);
      setEditingProduct(null);
      onRefresh();

      // إشعار نجاح
      const successToast = document.createElement("div");
      successToast.className = "alert alert-info position-fixed";
      successToast.style.cssText = "top: 20px; right: 20px; z-index: 9999;";
      successToast.innerHTML = "✏️ تم تحديث المنتج بنجاح";
      document.body.appendChild(successToast);
      setTimeout(() => document.body.removeChild(successToast), 3000);
    } catch (error) {
      alert("خطأ في تحديث المنتج: " + error.message);
    }
    setLoading(false);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'نفد المخزون', class: 'danger' };
    if (stock <= 10) return { text: 'مخزون منخفض', class: 'warning' };
    return { text: 'متوفر', class: 'success' };
  };

  return (
    <div className="products-manager-container">
      {/* رأس القسم */}
      <div className="products-header mb-4">
        <div className="row align-items-center">
          <div className="col-md-6">
            <h3 className="products-title">
              <i className="fas fa-boxes me-2"></i>
              إدارة المنتجات
            </h3>
            <p className="text-muted mb-0">
              إجمالي المنتجات: <span className="fw-bold text-primary">{products.length}</span>
            </p>
          </div>
          <div className="col-md-6 text-end">
            <button
              className="btn btn-primary btn-lg shadow-sm"
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={loading}
            >
              <i className="fas fa-plus me-2"></i>
              {showAddForm ? 'إلغاء' : 'إضافة منتج جديد'}
            </button>
          </div>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="search-filter-bar mb-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body py-3">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-light border-0">
                    <i className="fas fa-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-0 bg-light"
                    placeholder="البحث في المنتجات (الاسم أو الرمز)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select border-0 bg-light"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">جميع الفئات</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <button
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('');
                  }}
                >
                  <i className="fas fa-eraser me-1"></i>
                  مسح
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* نموذج إضافة / تعديل المنتج */}
      {showAddForm && (
        <div className="add-product-form mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-gradient-primary text-white">
              <h5 className="mb-0">
                <i className={`fas ${editingProduct ? 'fa-edit' : 'fa-plus-circle'} me-2`}></i>
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">اسم المنتج *</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="أدخل اسم المنتج"
                    value={editingProduct ? editingProduct.name : newProduct.name}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({ ...editingProduct, name: e.target.value })
                        : setNewProduct({ ...newProduct, name: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">رمز المنتج (SKU)</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="مثل: PRD001"
                    value={editingProduct ? editingProduct.sku : newProduct.sku}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({ ...editingProduct, sku: e.target.value })
                        : setNewProduct({ ...newProduct, sku: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">الفئة</label>
                  <select
                    className="form-select form-select-lg"
                    value={editingProduct ? editingProduct.category_id : newProduct.category_id}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({ ...editingProduct, category_id: parseInt(e.target.value) })
                        : setNewProduct({ ...newProduct, category_id: parseInt(e.target.value) })
                    }
                  >
                    <option value="">اختر فئة</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">المورد</label>
                  <select
                    className="form-select form-select-lg"
                    value={editingProduct ? editingProduct.supplier_id : newProduct.supplier_id}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({ ...editingProduct, supplier_id: parseInt(e.target.value) })
                        : setNewProduct({ ...newProduct, supplier_id: parseInt(e.target.value) })
                    }
                  >
                    <option value="">اختر مورد</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">السعر (د.ج)</label>
                  <input
                    type="number"
                    className="form-control form-control-lg"
                    placeholder="0.00"
                    value={editingProduct ? editingProduct.unit_price : newProduct.unit_price}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({ ...editingProduct, unit_price: parseFloat(e.target.value) || 0 })
                        : setNewProduct({ ...newProduct, unit_price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">الكمية المتوفرة</label>
                  <input
                    type="number"
                    className="form-control form-control-lg"
                    placeholder="0"
                    value={editingProduct ? editingProduct.stock_quantity : newProduct.stock_quantity}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) || 0 })
                        : setNewProduct({ ...newProduct, stock_quantity: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">وصف المنتج</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="وصف اختياري للمنتج"
                    value={editingProduct ? editingProduct.description : newProduct.description}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({ ...editingProduct, description: e.target.value })
                        : setNewProduct({ ...newProduct, description: e.target.value })
                    }
                  ></textarea>
                </div>
              </div>

              <div className="form-actions mt-4 text-end">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProduct(null);
                  }}
                  disabled={loading}
                >
                  <i className="fas fa-times me-1"></i>
                  إلغاء
                </button>

                <button
                  type="button"
                  className={`btn ${editingProduct ? 'btn-warning' : 'btn-success'} btn-lg px-4`}
                  onClick={editingProduct ? handleUpdate : handleAdd}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {editingProduct ? 'جارٍ التحديث...' : 'جارٍ الإضافة...'}
                    </>
                  ) : (
                    <>
                      <i className={`fas ${editingProduct ? 'fa-save' : 'fa-check'} me-2`}></i>
                      {editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* جدول المنتجات */}
      <div className="products-table">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-light border-0">
            <div className="row align-items-center">
              <div className="col">
                <h6 className="mb-0 text-muted">
                  عرض {filteredProducts.length} من {products.length} منتج
                </h6>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-search fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">لا توجد منتجات مطابقة للبحث</h5>
                <p className="text-muted">جرب تغيير مصطلحات البحث أو إضافة منتج جديد</p>
              </div>
            ) : (
              <div
                className="table-responsive"
                style={{ maxHeight: "500px", overflowY: "auto" }} // ✅ تحديد الارتفاع مع سكرول
              >
                <table className="table table-hover mb-0">

                  <thead className="table-dark">
                    <tr>
                      <th className="ps-4">
                        <i className="fas fa-box me-2"></i>المنتج
                      </th>
                      <th>
                        <i className="fas fa-tag me-2"></i>الفئة
                      </th>
                      <th>
                        <i className="fas fa-truck me-2"></i>المورد
                      </th>
                      <th>
                        <i className="fas fa-dollar-sign me-2"></i>السعر
                      </th>
                      <th>
                        <i className="fas fa-warehouse me-2"></i>المخزون
                      </th>
                      <th>
                        <i className="fas fa-info-circle me-2"></i>الحالة
                      </th>
                      <th className="text-center">
                        <i className="fas fa-cogs me-2"></i>العمليات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock_quantity);

                      // الحصول على اسم الفئة والمورد من الـ ID
                      const categoryName = categories.find(c => c.id === product.category_id)?.name || 'غير محدد';
                      const supplierName = suppliers.find(s => s.id === product.supplier_id)?.name || 'غير محدد';

                      return (
                        <tr key={product.id} className="table-row-hover">
                          <td className="ps-4">
                            <div className="d-flex align-items-center">
                              <div className="product-avatar me-3">
                                <div className="avatar-circle bg-primary text-white">
                                  {product.name.charAt(0)}
                                </div>
                              </div>
                              <div>
                                <div className="fw-semibold text-dark">{product.name}</div>
                                {product.sku && <small className="text-muted">SKU: {product.sku}</small>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">{categoryName}</span>
                          </td>
                          <td>
                            <span className="text-muted">{supplierName}</span>
                          </td>
                          <td>
                            <span className="fw-semibold text-success">
                              {product.unit_price ? `${product.unit_price} د.ج` : '-'}
                            </span>
                          </td>
                          <td>
                            <span className="fw-bold fs-6">{product.stock_quantity}</span>
                          </td>
                          <td>
                            <span className={`badge bg-${stockStatus.class} bg-opacity-10 text-${stockStatus.class} border border-${stockStatus.class}`}>
                              {stockStatus.text}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                title="تعديل"
                                onClick={() => {
                                  setEditingProduct(product);
                                  setShowAddForm(true);   // ✅ فتح النموذج تلقائياً
                                }}

                              >
                                <i className="fas fa-edit"></i>
                              </button>

                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(product.id, product.name)}
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
            )}
          </div>
        </div>
      </div>

      {/* معلومات إضافية */}
      <div className="products-summary mt-4">
        <div className="row">
          <div className="col-md-3">
            <div className="card text-center border-0 bg-primary bg-opacity-10">
              <div className="card-body">
                <i className="fas fa-boxes fa-2x text-primary mb-2"></i>
                <h5 className="text-primary">{products.length}</h5>
                <small className="text-muted">إجمالي المنتجات</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-0 bg-success bg-opacity-10">
              <div className="card-body">
                <i className="fas fa-check-circle fa-2x text-success mb-2"></i>
                <h5 className="text-success">
                  {products.filter(p => p.stock_quantity > 10).length}
                </h5>
                <small className="text-muted">منتجات متوفرة</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-0 bg-warning bg-opacity-10">
              <div className="card-body">
                <i className="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
                <h5 className="text-warning">
                  {products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10).length}
                </h5>
                <small className="text-muted">مخزون منخفض</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-0 bg-danger bg-opacity-10">
              <div className="card-body">
                <i className="fas fa-times-circle fa-2x text-danger mb-2"></i>
                <h5 className="text-danger">
                  {products.filter(p => p.stock_quantity === 0).length}
                </h5>
                <small className="text-muted">نفد المخزون</small>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProductsManager;