import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Dashboard.css';
import inventoryService from '../database/inventoryService';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const allProducts = await inventoryService.getProducts();
        setProducts(allProducts || []);
      } catch (err) {
        setError(err.message || 'حدث خطأ أثناء جلب البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        <i className="fas fa-exclamation-circle me-2"></i>
        {error}
      </div>
    );
  }

  // ----- إحصائيات -----
  const totalProducts = products.length;
  const outOfStockProducts = products.filter(p => p.stock_quantity === 0).length;
  const lowStockProducts = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10);
  const lowStockCount = lowStockProducts.length;
  const inStockProducts = products.filter(p => p.stock_quantity > 10).length;

  const totalValue = products.reduce((sum, p) => sum + (p.stock_quantity * (p.price || 0)), 0);

  // ----- إحصائيات الفئات -----
  const categoriesStats = products.reduce((acc, p) => {
    const category = p.category || 'غير مصنف';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const topCategories = Object.entries(categoriesStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="dashboard-container">
      {/* رأس لوحة التحكم */}
      <div className="dashboard-header mb-4">
        <div className="row align-items-center">
          <div className="col-md-8">
            <h2 className="dashboard-title">
              <i className="fas fa-chart-line me-3"></i>
              لوحة التحكم الرئيسية
            </h2>
            <p className="dashboard-subtitle text-muted">
              مرحباً بك في نظام إدارة المخزون - نظرة شاملة على أداء متجرك
            </p>
          </div>
          <div className="col-md-4 text-end">
            <div className="current-time-card">
              <i className="fas fa-clock me-2"></i>
              <span className="time-display">
                {currentTime.toLocaleTimeString('ar-DZ')}
              </span>
              <br />
              <small className="text-muted">
                {currentTime.toLocaleDateString('ar-DZ')}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات الرئيسية */}
      <div className="row g-4 mb-5">
        <StatCard
          title="إجمالي المنتجات"
          count={totalProducts}
          icon="fas fa-cubes"
          color="primary"
          subtitle="جميع المنتجات المسجلة"
        />
        <StatCard
          title="منتجات متوفرة"
          count={inStockProducts}
          icon="fas fa-check-double"
          color="success"
          subtitle={`مخزون جيد (+10) - ${((inStockProducts/totalProducts)*100).toFixed(1)}% من الإجمالي`}
        />
        <StatCard
          title="مخزون منخفض"
          count={lowStockCount}
          icon="fas fa-exclamation-circle"
          color="warning"
          subtitle="تحتاج إعادة تموين"
        />
        <StatCard
          title="نفد المخزون"
          count={outOfStockProducts}
          icon="fas fa-ban"
          color="danger"
          subtitle="بحاجة طلب فوري"
        />
      </div>

      {/* الصف الثاني من المحتوى */}
      <div className="row g-4 mb-4">
        <StockValueCard totalValue={totalValue} />
        <TopCategoriesCard topCategories={topCategories} totalProducts={totalProducts} />
      </div>

      {/* المنتجات منخفضة المخزون */}
      <LowStockProducts products={lowStockProducts} />

      {/* معلومات سريعة */}
      <div className="quick-info mt-4">
        <div className="row g-3">
          <div className="col-md-6">
            <InfoCard
              title="معلومة سريعة"
              icon="fas fa-info-circle"
              content={`متوسط قيمة المنتج الواحد: ${totalProducts > 0 ? (totalValue/totalProducts).toLocaleString('ar-DZ') : 0} د.ج`}
            />
          </div>
          <div className="col-md-6">
            <InfoCard
              title="حالة المخزون"
              icon="fas fa-chart-bar"
              content={lowStockCount === 0 ?
                '✅ وضع المخزون مثالي' :
                `⚠️ ${lowStockCount} منتج يحتاج انتباه`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- مكونات فرعية ----------

const StatCard = ({ title, count, icon, color, subtitle }) => (
  <div className="col-xl-3 col-md-6">
    <div className={`stats-card bg-gradient-${color}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="card-title text-white-50 mb-2">{title}</h6>
            <h2 className="display-4 fw-bold text-white mb-0">{count}</h2>
            <small className="text-white-50"><i className={`${icon} me-1`}></i>{subtitle}</small>
          </div>
          <div className="stats-icon">
            <i className={`${icon} fa-3x text-white-50`}></i>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StockValueCard = ({ totalValue }) => (
  <div className="col-md-4">
    <div className="value-card">
      <div className="card h-100 border-0 shadow-sm text-center">
        <div className="card-body">
          <div className="value-icon mb-3">
            <i className="fas fa-coins fa-3x text-warning"></i>
          </div>
          <h5 className="card-title text-muted">قيمة المخزون الإجمالية</h5>
          <h2 className="display-5 fw-bold text-primary mb-3">
            {totalValue.toLocaleString('ar-DZ')} <small className="fs-6 text-muted">د.ج</small>
          </h2>
          <div className="progress mb-2" style={{height: '6px'}}>
            <div className="progress-bar bg-warning" style={{width: '75%'}}></div>
          </div>
          <small className="text-muted">القيمة المقدرة للمخزون الحالي</small>
        </div>
      </div>
    </div>
  </div>
);

const TopCategoriesCard = ({ topCategories, totalProducts }) => (
  <div className="col-md-8">
    <div className="categories-card">
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-header bg-light border-0">
          <h5 className="mb-0"><i className="fas fa-chart-pie me-2 text-info"></i>أكثر الفئات المخزنة</h5>
        </div>
        <div className="card-body">
          {topCategories.length > 0 ? (
            topCategories.map(([category, count], index) => {
              const percentage = (count / totalProducts) * 100;
              const colors = ['primary', 'success', 'warning', 'info', 'secondary'];
              const color = colors[index] || 'secondary';
              return (
                <div key={category} className="category-item mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold">{category}</span>
                    <span className="text-muted">{count} منتج</span>
                  </div>
                  <div className="progress" style={{height: '8px'}}>
                    <div className={`progress-bar bg-${color}`} style={{width: `${percentage}%`}}></div>
                  </div>
                  <small className="text-muted">{percentage.toFixed(1)}% من الإجمالي</small>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted py-4">
              <i className="fas fa-folder-open fa-3x mb-3"></i>
              <p>لا توجد فئات محددة بعد</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const LowStockProducts = ({ products }) => {
  const count = products.length;
  return (
    <div className="row">
      <div className="col-12">
        <div className="low-stock-section">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-gradient-warning text-white">
              <div className="row align-items-center">
                <div className="col">
                  <h5 className="mb-0"><i className="fas fa-exclamation-triangle me-2"></i>المنتجات التي تحتاج إعادة تموين</h5>
                </div>
                <div className="col-auto">
                  <span className="badge bg-white text-warning fs-6">{count} منتج</span>
                </div>
              </div>
            </div>
            <div className="card-body">
              {count === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-check-circle fa-4x text-success mb-3"></i>
                  <h4 className="text-success">ممتاز! 🎉</h4>
                  <p className="text-muted fs-5">جميع المنتجات ضمن المستوى الآمن للمخزون</p>
                </div>
              ) : (
                <div className="row g-3">
                  {products.slice(0, 6).map(product => (
                    <div key={product.id} className="col-lg-4 col-md-6">
                      <div className="low-stock-item d-flex align-items-center">
                        <div className="product-avatar me-3">
                          <div className="avatar-circle bg-warning text-white">
                            {product.name.charAt(0)}
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-semibold">{product.name}</h6>
                          <div className="d-flex align-items-center">
                            <span className="badge bg-danger me-2">{product.stock_quantity} متبقي</span>
                            {product.category && <small className="text-muted">{product.category}</small>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {count > 6 && (
                    <div className="col-12 text-center mt-3">
                      <p className="text-muted">ويوجد {count - 6} منتج إضافي يحتاج إعادة تموين...</p>
                      <button className="btn btn-outline-warning">
                        عرض جميع المنتجات منخفضة المخزون <i className="fas fa-arrow-left me-2"></i>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ title, icon, content }) => (
  <div className="info-card bg-light p-3 rounded">
    <h6 className="text-muted mb-2"><i className={`${icon} me-1`}></i>{title}</h6>
    <p className="mb-0">{content}</p>
  </div>
);

export default Dashboard;
