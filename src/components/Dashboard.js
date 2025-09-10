import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Dashboard.css';
import inventoryService from '../database/inventoryService';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [salesData, setSalesData] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [quickActions, setQuickActions] = useState(false);

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
        
        // جلب بيانات المبيعات للأسبوع الماضي
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        try {
          const salesSummary = await inventoryService.getSalesSummary(startDate, endDate);
          setSalesData(salesSummary);
        } catch (salesError) {
          console.log('لا توجد بيانات مبيعات متاحة');
          setSalesData([]);
        }

        // محاكاة الأنشطة الأخيرة (يمكن استبدالها ببيانات حقيقية)
        setRecentActivities([
          { id: 1, type: 'sale', message: 'تم بيع منتج جديد', time: '5 دقائق', icon: 'fas fa-shopping-cart', color: 'success' },
          { id: 2, type: 'stock', message: 'تم تحديث مخزون المنتجات', time: '15 دقيقة', icon: 'fas fa-boxes', color: 'info' },
          { id: 3, type: 'alert', message: 'تحذير: مخزون منخفض', time: '30 دقيقة', icon: 'fas fa-exclamation-triangle', color: 'warning' },
          { id: 4, type: 'user', message: 'تم إضافة مستخدم جديد', time: '1 ساعة', icon: 'fas fa-user-plus', color: 'primary' }
        ]);

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

  // ----- الإحصائيات المحسنة -----
  const totalProducts = products.length;
  const outOfStockProducts = products.filter(p => p.stock_quantity === 0).length;
  const lowStockProducts = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.min_stock_level || 10));
  const lowStockCount = lowStockProducts.length;
  const inStockProducts = products.filter(p => p.stock_quantity > (p.min_stock_level || 10)).length;

  const totalValue = products.reduce((sum, p) => sum + (p.stock_quantity * (p.unit_price || p.price || 0)), 0);
  const averagePrice = totalProducts > 0 ? totalValue / totalProducts : 0;

  // إحصائيات المبيعات
  const totalSalesAmount = salesData ? salesData.reduce((sum, day) => sum + (day.total_sales || 0), 0) : 0;
  const totalTransactions = salesData ? salesData.reduce((sum, day) => sum + (day.transaction_count || 0), 0) : 0;

  // ----- إحصائيات الفئات المحسنة -----
  const categoriesStats = products.reduce((acc, p) => {
    const category = p.category_name || p.category || 'غير مصنف';
    if (!acc[category]) {
      acc[category] = { count: 0, value: 0 };
    }
    acc[category].count += 1;
    acc[category].value += p.stock_quantity * (p.unit_price || p.price || 0);
    return acc;
  }, {});

  const topCategories = Object.entries(categoriesStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 5);

  // ----- إحصائيات الموردين -----
  const suppliersStats = products.reduce((acc, p) => {
    const supplier = p.supplier_name || 'غير محدد';
    acc[supplier] = (acc[supplier] || 0) + 1;
    return acc;
  }, {});

  const topSuppliers = Object.entries(suppliersStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  return (
    <div className="dashboard-container">
      {/* رأس لوحة التحكم المحسن */}
      <div className="dashboard-header mb-4">
        <div className="row align-items-center">
          <div className="col-md-8">
            <h2 className="dashboard-title">
              <i className="fas fa-chart-line me-3 text-primary"></i>
              لوحة التحكم الرئيسية
            </h2>
            <p className="dashboard-subtitle text-muted">
              مرحباً بك في نظام إدارة المخزون - نظرة شاملة على أداء متجرك
            </p>
            <div className="d-flex align-items-center mt-2">
              <span className={`badge ${totalProducts > 0 ? 'bg-success' : 'bg-warning'} me-2`}>
                {totalProducts > 0 ? 'النظام نشط' : 'لا توجد منتجات'}
              </span>
              <span className="text-muted small">آخر تحديث: الآن</span>
            </div>
          </div>
          <div className="col-md-4 text-end">
            <div className="current-time-card">
              <div className="d-flex align-items-center justify-content-end">
                <div className="time-info me-3">
                  <div className="time-display fw-bold">
                    {currentTime.toLocaleTimeString('ar-DZ')}
                  </div>
                  <small className="text-muted">
                    {currentTime.toLocaleDateString('ar-DZ', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </small>
                </div>
                <div className="time-icon">
                  <i className="fas fa-clock fa-2x text-primary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات الرئيسية المحسنة */}
      <div className="row g-4 mb-5">
        <EnhancedStatCard
          title="إجمالي المنتجات"
          count={totalProducts}
          icon="fas fa-cubes"
          color="primary"
          subtitle="جميع المنتجات المسجلة"
          trend={totalProducts > 100 ? '+5.2%' : 'جديد'}
          trendColor={totalProducts > 100 ? 'success' : 'info'}
        />
        <EnhancedStatCard
          title="منتجات متوفرة"
          count={inStockProducts}
          icon="fas fa-check-double"
          color="success"
          subtitle={`مخزون آمن - ${totalProducts > 0 ? ((inStockProducts/totalProducts)*100).toFixed(1) : 0}% من الإجمالي`}
          trend={`${totalProducts > 0 ? ((inStockProducts/totalProducts)*100).toFixed(0) : 0}%`}
          trendColor="success"
        />
        <EnhancedStatCard
          title="مخزون منخفض"
          count={lowStockCount}
          icon="fas fa-exclamation-triangle"
          color="warning"
          subtitle="تحتاج إعادة تموين"
          trend={lowStockCount > 0 ? 'يحتاج انتباه' : 'مثالي'}
          trendColor={lowStockCount > 0 ? 'warning' : 'success'}
        />
        <EnhancedStatCard
          title="نفد المخزون"
          count={outOfStockProducts}
          icon="fas fa-times-circle"
          color="danger"
          subtitle="بحاجة طلب فوري"
          trend={outOfStockProducts > 0 ? 'عاجل' : 'ممتاز'}
          trendColor={outOfStockProducts > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* الصف الثاني - المعلومات المالية والأداء */}
      <div className="row g-4 mb-4">
        <EnhancedStockValueCard 
          totalValue={totalValue} 
          averagePrice={averagePrice}
          totalProducts={totalProducts}
          salesAmount={totalSalesAmount}
          transactions={totalTransactions}
        />
        <TopCategoriesCard topCategories={topCategories} totalProducts={totalProducts} />
        <QuickStatsCard 
          suppliersCount={Object.keys(suppliersStats).length}
          categoriesCount={Object.keys(categoriesStats).length}
          topSuppliers={topSuppliers}
        />
      </div>

      {/* الصف الثالث - الأنشطة والتحليلات */}
      <div className="row g-4 mb-4">
        <RecentActivitiesCard activities={recentActivities} />
        <SalesInsightsCard salesData={salesData} />
      </div>

      {/* المنتجات منخفضة المخزون المحسنة */}
      <EnhancedLowStockProducts products={lowStockProducts} />

      {/* الإجراءات السريعة */}
      <QuickActionsSection />

      {/* معلومات سريعة محسنة */}
      <div className="quick-info mt-4">
        <div className="row g-3">
          <div className="col-md-4">
            <InfoCard
              title="معلومة سريعة"
              icon="fas fa-info-circle"
              content={`متوسط قيمة المنتج: ${totalProducts > 0 ? (totalValue/totalProducts).toLocaleString('ar-DZ') : 0} د.ج`}
            />
          </div>
          <div className="col-md-4">
            <InfoCard
              title="حالة المخزون"
              icon="fas fa-chart-bar"
              content={lowStockCount === 0 ?
                '✅ وضع المخزون مثالي' :
                `⚠️ ${lowStockCount} منتج يحتاج انتباه`}
            />
          </div>
          <div className="col-md-4">
            <InfoCard
              title="نشاط النظام"
              icon="fas fa-activity"
              content={`${totalTransactions} معاملة هذا الأسبوع`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- المكونات الفرعية المحسنة ----------

const QuickActionsSection = () => {
  const quickActions = [
    {
      id: 1,
      title: 'إضافة منتج جديد',
      description: 'أضف منتج جديد إلى المخزون',
      icon: 'fas fa-plus-circle',
      color: 'primary',
      action: () => console.log('إضافة منتج')
    },
    {
      id: 2,
      title: 'تسجيل مبيعة',
      description: 'سجل عملية بيع جديدة',
      icon: 'fas fa-shopping-cart',
      color: 'success',
      action: () => console.log('تسجيل مبيعة')
    },
    {
      id: 3,
      title: 'تحديث المخزون',
      description: 'حدث كميات المنتجات',
      icon: 'fas fa-edit',
      color: 'warning',
      action: () => console.log('تحديث مخزون')
    },
    {
      id: 4,
      title: 'إنشاء تقرير',
      description: 'أنشئ تقرير مفصل',
      icon: 'fas fa-chart-bar',
      color: 'info',
      action: () => console.log('إنشاء تقرير')
    }
  ];

  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="quick-actions-section">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">
                    <i className="fas fa-bolt me-2 text-primary"></i>
                    الإجراءات السريعة
                  </h5>
                  <small className="text-muted">اختصارات للمهام الأكثر استخداماً</small>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {quickActions.map(action => (
                  <div key={action.id} className="col-lg-3 col-md-6">
                    <div 
                      className="quick-action-card h-100 p-3 border rounded cursor-pointer hover-shadow"
                      onClick={action.action}
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: '1px solid #dee2e6'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="text-center">
                        <div className={`action-icon mb-3 text-${action.color}`}>
                          <i className={`${action.icon} fa-2x`}></i>
                        </div>
                        <h6 className="action-title fw-semibold mb-2">{action.title}</h6>
                        <p className="action-description text-muted small mb-0">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EnhancedStatCard = ({ title, count, icon, color, subtitle, trend, trendColor }) => (
  <div className="col-xl-3 col-md-6">
    <div className={`stats-card bg-gradient-${color} position-relative overflow-hidden`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div className="stats-content">
            <h6 className="card-title text-white-50 mb-2 fw-normal">{title}</h6>
            <h2 className="display-4 fw-bold text-white mb-2">{count.toLocaleString('ar-DZ')}</h2>
            <small className="text-white-50">
              <i className={`${icon} me-1`}></i>{subtitle}
            </small>
            {trend && (
              <div className="mt-2">
                <span className={`badge bg-${trendColor} bg-opacity-20 text-${trendColor} border border-${trendColor} border-opacity-30`}>
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div className="stats-icon">
            <i className={`${icon} fa-3x text-white-50`}></i>
          </div>
        </div>
        <div className="stats-pattern"></div>
      </div>
    </div>
  </div>
);

const EnhancedStockValueCard = ({ totalValue, averagePrice, totalProducts, salesAmount, transactions }) => (
  <div className="col-md-4">
    <div className="value-card h-100">
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center">
          <div className="value-icon mb-3">
            <i className="fas fa-coins fa-3x text-warning"></i>
          </div>
          <h5 className="card-title text-muted mb-3">القيمة المالية للمخزون</h5>
          
          <div className="financial-stats">
            <div className="main-value mb-3">
              <h2 className="display-5 fw-bold text-primary mb-0">
                {totalValue.toLocaleString('ar-DZ')} <small className="fs-6 text-muted">د.ج</small>
              </h2>
              <small className="text-success">القيمة الإجمالية للمخزون</small>
            </div>
            
            <div className="row text-center mb-3">
              <div className="col-6">
                <div className="stat-item">
                  <h6 className="text-info mb-1">{averagePrice.toFixed(2)}</h6>
                  <small className="text-muted">متوسط سعر المنتج</small>
                </div>
              </div>
              <div className="col-6">
                <div className="stat-item">
                  <h6 className="text-success mb-1">{salesAmount.toFixed(2)}</h6>
                  <small className="text-muted">مبيعات الأسبوع</small>
                </div>
              </div>
            </div>
          </div>
          
          <div className="progress mb-2" style={{height: '8px'}}>
            <div className="progress-bar bg-gradient-warning" style={{width: '75%'}}></div>
          </div>
          <small className="text-muted">مؤشر القيمة المالية للمخزون</small>
        </div>
      </div>
    </div>
  </div>
);

const QuickStatsCard = ({ suppliersCount, categoriesCount, topSuppliers }) => (
  <div className="col-md-4">
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-header bg-light border-0">
        <h6 className="mb-0">
          <i className="fas fa-chart-bar me-2 text-primary"></i>
          إحصائيات سريعة
        </h6>
      </div>
      <div className="card-body">
        <div className="quick-stats">
          <div className="stat-row d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted">
              <i className="fas fa-layer-group me-2"></i>عدد الفئات
            </span>
            <span className="badge bg-primary">{categoriesCount}</span>
          </div>
          <div className="stat-row d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted">
              <i className="fas fa-truck me-2"></i>عدد الموردين
            </span>
            <span className="badge bg-info">{suppliersCount}</span>
          </div>
          
          <hr className="my-3" />
          
          <div className="top-suppliers">
            <h6 className="text-muted mb-2">أهم الموردين</h6>
            {topSuppliers.slice(0, 3).map(([supplier, count], index) => (
              <div key={supplier} className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-truncate">{supplier}</small>
                <span className="badge bg-secondary">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RecentActivitiesCard = ({ activities }) => (
  <div className="col-md-6">
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-header bg-light border-0">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <i className="fas fa-history me-2 text-primary"></i>
            الأنشطة الأخيرة
          </h6>
          <span className="badge bg-primary">{activities.length}</span>
        </div>
      </div>
      <div className="card-body">
        <div className="activities-list">
          {activities.map(activity => (
            <div key={activity.id} className="activity-item d-flex align-items-center mb-3">
              <div className={`activity-icon me-3 text-${activity.color}`}>
                <i className={activity.icon}></i>
              </div>
              <div className="activity-content flex-grow-1">
                <div className="activity-message">{activity.message}</div>
                <small className="text-muted">منذ {activity.time}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SalesInsightsCard = ({ salesData }) => (
  <div className="col-md-6">
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-header bg-light border-0">
        <h6 className="mb-0">
          <i className="fas fa-chart-line me-2 text-success"></i>
          تحليل المبيعات (7 أيام)
        </h6>
      </div>
      <div className="card-body">
        {salesData && salesData.length > 0 ? (
          <div className="sales-insights">
            <div className="row text-center mb-3">
              <div className="col-6">
                <div className="insight-item">
                  <h5 className="text-success">
                    {salesData.reduce((sum, day) => sum + (day.total_sales || 0), 0).toFixed(2)}
                  </h5>
                  <small className="text-muted">د.ج إجمالي المبيعات</small>
                </div>
              </div>
              <div className="col-6">
                <div className="insight-item">
                  <h5 className="text-info">
                    {salesData.reduce((sum, day) => sum + (day.transaction_count || 0), 0)}
                  </h5>
                  <small className="text-muted">إجمالي المعاملات</small>
                </div>
              </div>
            </div>
            
            <div className="sales-trend mb-3">
              <small className="text-muted d-block mb-2">اتجاه المبيعات الأسبوعية</small>
              <div className="d-flex justify-content-between">
                {salesData.slice(-7).map((day, index) => {
                  const maxSales = Math.max(...salesData.map(d => d.total_sales || 0));
                  const height = maxSales > 0 ? (day.total_sales / maxSales) * 100 : 0;
                  return (
                    <div key={index} className="sales-bar-container text-center" style={{width: '12%'}}>
                      <div 
                        className="sales-bar bg-success" 
                        style={{height: `${Math.max(height, 5)}px`, width: '100%'}}
                      ></div>
                      <small className="text-muted">{new Date(day.date).getDate()}</small>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="avg-daily-sales text-center">
              <span className="badge bg-success bg-opacity-10 text-success">
                متوسط يومي: {salesData.length > 0 ? (salesData.reduce((sum, day) => sum + (day.total_sales || 0), 0) / salesData.length).toFixed(2) : 0} د.ج
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
            <p className="text-muted">لا توجد بيانات مبيعات متاحة</p>
            <small className="text-muted">ابدأ بتسجيل المبيعات لرؤية التحليلات</small>
          </div>
        )}
      </div>
    </div>
  </div>
);

const TopCategoriesCard = ({ topCategories, totalProducts }) => (
  <div className="col-md-4">
    <div className="categories-card">
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-header bg-light border-0">
          <h6 className="mb-0">
            <i className="fas fa-chart-pie me-2 text-info"></i>
            أكثر الفئات تنوعاً
          </h6>
        </div>
        <div className="card-body">
          {topCategories.length > 0 ? (
            <div className="categories-list">
              {topCategories.map(([category, data], index) => {
                const percentage = (data.count / totalProducts) * 100;
                const colors = ['primary', 'success', 'warning', 'info', 'secondary'];
                const color = colors[index] || 'secondary';
                return (
                  <div key={category} className="category-item mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="category-info">
                        <span className="fw-semibold">{category}</span>
                        <br />
                        <small className="text-muted">{data.count} منتج • {data.value.toFixed(0)} د.ج</small>
                      </div>
                      <span className={`badge bg-${color}`}>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="progress" style={{height: '6px'}}>
                      <div className={`progress-bar bg-${color}`} style={{width: `${percentage}%`}}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted py-4">
              <i className="fas fa-folder-open fa-3x mb-3"></i>
              <p>لا توجد فئات محددة بعد</p>
              <button className="btn btn-outline-primary btn-sm">إضافة فئة جديدة</button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const EnhancedLowStockProducts = ({ products }) => {
  const count = products.length;
  const urgentProducts = products.filter(p => p.stock_quantity === 0);
  const warningProducts = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5);
  
  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="low-stock-section">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-gradient-warning text-white">
              <div className="row align-items-center">
                <div className="col">
                  <h5 className="mb-0">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    مراقبة المخزون
                  </h5>
                  <small>المنتجات التي تحتاج متابعة فورية</small>
                </div>
                <div className="col-auto">
                  <div className="d-flex gap-2">
                    {urgentProducts.length > 0 && (
                      <span className="badge bg-danger">{urgentProducts.length} عاجل</span>
                    )}
                    <span className="badge bg-white text-warning">{count} منتج</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body">
              {count === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-check-circle fa-4x text-success mb-3"></i>
                  <h4 className="text-success">وضع المخزون مثالي!</h4>
                  <p className="text-muted fs-5">جميع المنتجات ضمن المستوى الآمن للمخزون</p>
                  <div className="mt-3">
                    <span className="badge bg-success me-2">مخزون آمن</span>
                    <span className="badge bg-info">لا توجد تحذيرات</span>
                  </div>
                </div>
              ) : (
                <div>
                  {/* قسم المنتجات العاجلة */}
                  {urgentProducts.length > 0 && (
                    <div className="urgent-products mb-4">
                      <h6 className="text-danger mb-3">
                        <i className="fas fa-times-circle me-2"></i>
                        منتجات نفد مخزونها ({urgentProducts.length})
                      </h6>
                      <div className="row g-3">
                        {urgentProducts.slice(0, 3).map(product => (
                          <div key={product.id} className="col-md-4">
                            <div className="alert alert-danger mb-0">
                              <div className="d-flex align-items-center">
                                <div className="product-avatar me-3">
                                  <div className="avatar-circle bg-danger text-white">
                                    {product.name.charAt(0)}
                                  </div>
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="alert-heading mb-1">{product.name}</h6>
                                  <div className="d-flex align-items-center">
                                    <span className="badge bg-white text-danger me-2">نفد المخزون</span>
                                    {(product.category_name || product.category) && (
                                      <small className="text-danger opacity-75">
                                        {product.category_name || product.category}
                                      </small>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* قسم المنتجات المنخفضة */}
                  {warningProducts.length > 0 && (
                    <div className="warning-products">
                      <h6 className="text-warning mb-3">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        مخزون منخفض ({warningProducts.length})
                      </h6>
                      <div className="row g-3">
                        {warningProducts.slice(0, 6).map(product => (
                          <div key={product.id} className="col-lg-4 col-md-6">
                            <div className="low-stock-item d-flex align-items-center p-3 bg-light rounded">
                              <div className="product-avatar me-3">
                                <div className="avatar-circle bg-warning text-white">
                                  {product.name.charAt(0)}
                                </div>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-1 fw-semibold">{product.name}</h6>
                                <div className="d-flex align-items-center">
                                  <span className="badge bg-warning me-2">{product.stock_quantity} متبقي</span>
                                  {(product.category_name || product.category) && (
                                    <small className="text-muted">{product.category_name || product.category}</small>
                                  )}
                                </div>
                                {product.min_stock_level && (
                                  <small className="text-muted">الحد الأدنى: {product.min_stock_level}</small>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* عرض المزيد */}
                  {count > 9 && (
                    <div className="text-center mt-4">
                      <p className="text-muted">ويوجد {count - 9} منتج إضافي يحتاج متابعة...</p>
                      <button className="btn btn-outline-warning">
                        <i className="fas fa-list me-2"></i>
                        عرض تقرير المخزون المنخفض الكامل
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
