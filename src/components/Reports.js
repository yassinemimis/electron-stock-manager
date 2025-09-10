import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Reports.css';
import InventoryService from '../database/inventoryService';
import * as XLSX from "xlsx";

const Reports = ({ products, lowStockProducts }) => {
  const [activeReport, setActiveReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);

  // حساب الإحصائيات
  const calculateStats = () => {
    const totalProducts = products.length;
    const outOfStockProducts = products.filter(p => p.stock_quantity === 0).length;
    const lowStockCount = lowStockProducts.length;
    const inStockProducts = products.filter(p => p.stock_quantity > 10).length;
    
    const totalValue = products.reduce((sum, product) => 
      sum + (product.stock_quantity * (product.unit_price || 0)), 0
    );

    const categoriesStats = products.reduce((acc, product) => {
      const category = product.category_name || 'غير مصنف';
      if (!acc[category]) {
        acc[category] = { count: 0, value: 0, products: [] };
      }
      acc[category].count++;
      acc[category].value += (product.stock_quantity * (product.unit_price || 0));
      acc[category].products.push(product);
      return acc;
    }, {});

    const suppliersStats = products.reduce((acc, product) => {
      const supplier = product.supplier_name || 'غير محدد';
      if (!acc[supplier]) {
        acc[supplier] = { count: 0, value: 0, products: [] };
      }
      acc[supplier].count++;
      acc[supplier].value += (product.stock_quantity * (product.unit_price || 0));
      acc[supplier].products.push(product);
      return acc;
    }, {});

    return {
      totalProducts,
      outOfStockProducts,
      lowStockCount,
      inStockProducts,
      totalValue,
      categoriesStats: Object.entries(categoriesStats).sort(([,a], [,b]) => b.count - a.count),
      suppliersStats: Object.entries(suppliersStats).sort(([,a], [,b]) => b.count - a.count)
    };
  };

  const stats = calculateStats();

  useEffect(() => {
    if (activeReport === 'sales') {
      loadSalesReport();
    }
  }, [activeReport, dateRange]);

  const loadSalesReport = async () => {
    setLoading(true);
    try {
      const salesSummary = await InventoryService.getSalesSummary(dateRange.startDate, dateRange.endDate);
      setSalesData(salesSummary);
    } catch (error) {
      console.error('خطأ في تحميل تقرير المبيعات:', error);
      setSalesData([]);
    }
    setLoading(false);
  };

const exportReport = (reportType) => {
  const timestamp = new Date().toISOString().split('T')[0];
  let filename = `تقرير_${reportType}_${timestamp}.xlsx`;
  
  // إنشاء workbook جديد
  const workbook = XLSX.utils.book_new();
  let worksheet;
  let worksheetData = [];

  switch (reportType) {
    case 'overview':
      worksheetData = [
        ['نوع الإحصائية', 'القيمة', 'التفاصيل'],
        ['إجمالي المنتجات', stats.totalProducts, 'منتج مسجل'],
        ['مخزون جيد', stats.inStockProducts, 'منتج متوفر'],
        ['مخزون منخفض', stats.lowStockCount, 'يحتاج تموين'],
        ['نفد المخزون', stats.outOfStockProducts, 'منتج غير متوفر'],
        ['القيمة الإجمالية', Number(stats.totalValue.toFixed(2)), 'دينار جزائري'],
        ['عدد الفئات النشطة', stats.categoriesStats.length, 'فئة'],
        ['عدد الموردين النشطين', stats.suppliersStats.length, 'مورد'],
        ['متوسط قيمة المنتج', Number(stats.totalProducts > 0 ? (stats.totalValue / stats.totalProducts).toFixed(2) : 0), 'دينار جزائري']
      ];
      break;

    case 'inventory':
      worksheetData = [
        ['الرقم', 'اسم المنتج', 'الفئة', 'المورد', 'الكمية', 'السعر', 'القيمة الإجمالية', 'الحالة']
      ];
      products.forEach((product, index) => {
        const status = product.stock_quantity === 0 ? 'نفد المخزون' : 
                     product.stock_quantity <= (product.min_stock_level || 0) ? 'مخزون منخفض' : 'متوفر';
        worksheetData.push([
          index + 1,
          product.name,
          product.category_name || 'غير مصنف',
          product.supplier_name || 'غير محدد',
          product.stock_quantity,
          Number(product.unit_price || 0),
          Number((product.stock_quantity * (product.unit_price || 0)).toFixed(2)),
          status
        ]);
      });
      break;

    case 'lowStock':
      worksheetData = [
        ['الرقم', 'اسم المنتج', 'الكمية المتبقية', 'الحد الأدنى', 'الحالة', 'الفئة', 'المورد']
      ];
      lowStockProducts.forEach((product, index) => {
        worksheetData.push([
          index + 1,
          product.name,
          product.stock_quantity,
          product.min_stock_level || 0,
          product.stock_quantity === 0 ? 'نفد المخزون' : 'مخزون منخفض',
          product.category_name || 'غير مصنف',
          product.supplier_name || 'غير محدد'
        ]);
      });
      break;

    case 'categories':
      worksheetData = [
        ['الرقم', 'اسم الفئة', 'عدد المنتجات', 'القيمة الإجمالية', 'النسبة من الإجمالي']
      ];
      stats.categoriesStats.forEach(([category, data], index) => {
        const percentage = Number(((data.count / stats.totalProducts) * 100).toFixed(1));
        worksheetData.push([
          index + 1,
          category,
          data.count,
          Number(data.value.toFixed(2)),
          percentage
        ]);
      });
      break;

    case 'suppliers':
      worksheetData = [
        ['الرقم', 'اسم المورد', 'عدد المنتجات', 'القيمة الإجمالية', 'نسبة المنتجات', 'نسبة القيمة']
      ];
      stats.suppliersStats.forEach(([supplier, data], index) => {
        const productPercentage = Number(((data.count / stats.totalProducts) * 100).toFixed(1));
        const valuePercentage = Number(((data.value / stats.totalValue) * 100).toFixed(1));
        worksheetData.push([
          index + 1,
          supplier,
          data.count,
          Number(data.value.toFixed(2)),
          productPercentage,
          valuePercentage
        ]);
      });
      break;

    case 'sales':
      worksheetData = [
        ['التاريخ', 'عدد المعاملات', 'إجمالي المبيعات']
      ];
      salesData.forEach((day) => {
        const formattedDate = new Date(day.date).toLocaleDateString('ar-DZ');
        worksheetData.push([
          formattedDate,
          day.transaction_count,
          Number(day.total_sales)
        ]);
      });
      // إضافة سطر الإجمالي
      const totalTransactions = salesData.reduce((sum, day) => sum + day.transaction_count, 0);
      const totalSales = salesData.reduce((sum, day) => sum + day.total_sales, 0);
      worksheetData.push(['الإجمالي', totalTransactions, Number(totalSales.toFixed(2))]);
      break;

    default:
      alert('نوع التقرير غير مدعوم للتصدير');
      return;
  }

  // إنشاء الورقة
  worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // تنسيق الورقة
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  // تحديد عرض الأعمدة
  const colWidths = [];
  for (let col = 0; col <= range.e.c; col++) {
    let maxWidth = 10;
    for (let row = 0; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      if (cell && cell.v) {
        const cellValue = String(cell.v);
        maxWidth = Math.max(maxWidth, cellValue.length * 1.2);
      }
    }
    colWidths.push({ wch: Math.min(maxWidth, 50) });
  }
  worksheet['!cols'] = colWidths;

  // تنسيق صف الرأس
  for (let col = 0; col <= range.e.c; col++) {
    const headerAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (worksheet[headerAddress]) {
      worksheet[headerAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
  }

  // إضافة الورقة إلى الـ workbook
  const sheetName = getReportTitle(reportType);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // إضافة معلومات إضافية في ورقة منفصلة للنظرة العامة
  if (reportType === 'overview') {
    const summaryData = [
      ['معلومات التقرير'],
      ['تاريخ الإنشاء', new Date().toLocaleString('ar-DZ')],
      ['النظام', 'نظام إدارة المخزون'],
      [''],
      ['ملخص الإحصائيات'],
      ['نسبة المخزون الجيد', `${((stats.inStockProducts / stats.totalProducts) * 100).toFixed(1)}%`],
      ['نسبة المخزون المنخفض', `${((stats.lowStockCount / stats.totalProducts) * 100).toFixed(1)}%`],
      ['نسبة المخزون المنفد', `${((stats.outOfStockProducts / stats.totalProducts) * 100).toFixed(1)}%`]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'معلومات التقرير');
  }

  // تصدير الملف
  try {
    XLSX.writeFile(workbook, filename);
    
    // إظهار رسالة نجاح
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed';
    toast.style.cssText = 'bottom: 20px; right: 20px; z-index: 9999;';
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas fa-check-circle me-2"></i>
          تم تصدير التقرير بنجاح كملف Excel
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
    
  } catch (error) {
    console.error('خطأ في تصدير الملف:', error);
    alert('حدث خطأ أثناء تصدير الملف. تأكد من أن مكتبة SheetJS محملة بشكل صحيح.');
  }
};

const printReport = () => {
  // حفظ المحتوى الأصلي
  const originalContents = document.body.innerHTML;
  const originalTitle = document.title;

  // تحضير المحتوى للطباعة
  const reportElement = document.querySelector('.reports-content');
  const headerElement = document.querySelector('.reports-header');
  
  if (!reportElement) {
    alert('لا يمكن العثور على المحتوى للطباعة');
    return;
  }

  // إنشاء نسخة للطباعة
  const printContent = document.createElement('div');
  printContent.innerHTML = `
    <style>
      @media print {
        body { font-family: Arial, sans-serif; }
        .no-print { display: none !important; }
        .card { border: 1px solid #ddd !important; box-shadow: none !important; }
        .table { font-size: 12px; }
        .badge { border: 1px solid #000; }
        .bg-primary { background-color: #0d6efd !important; }
        .bg-success { background-color: #198754 !important; }
        .bg-warning { background-color: #ffc107 !important; }
        .bg-danger { background-color: #dc3545 !important; }
        .text-primary { color: #0d6efd !important; }
        .text-success { color: #198754 !important; }
        .text-warning { color: #ffc107 !important; }
        .text-danger { color: #dc3545 !important; }
        h1, h2, h3, h4, h5, h6 { color: #000 !important; }
      }
      @page { margin: 1cm; size: A4; }
    </style>
    <div class="print-header" style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
      <h2>نظام إدارة المخزون</h2>
      <h4>${getReportTitle(activeReport)}</h4>
      <p>تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-DZ')} - ${new Date().toLocaleTimeString('ar-DZ')}</p>
    </div>
    ${reportElement.outerHTML}
    <div class="print-footer" style="text-align: center; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px;">
      <small>تم إنشاء هذا التقرير بواسطة نظام إدارة المخزون</small>
    </div>
  `;

  // تحديث العنوان والمحتوى
  document.title = `تقرير - ${getReportTitle(activeReport)}`;
  document.body.innerHTML = printContent.innerHTML;

  // طباعة
  setTimeout(() => {
    window.print();
    
    // استعادة المحتوى الأصلي بعد الطباعة
    setTimeout(() => {
      document.title = originalTitle;
      document.body.innerHTML = originalContents;
    }, 1000);
  }, 100);
};

// دالة مساعدة للحصول على عنوان التقرير
const getReportTitle = (reportType) => {
  const titles = {
    'overview': 'نظرة عامة',
    'inventory': 'تقرير المخزون',
    'lowStock': 'المخزون المنخفض',
    'categories': 'تقرير الفئات',
    'suppliers': 'تقرير الموردين',
    'sales': 'تقرير المبيعات'
  };
  return titles[reportType] || 'تقرير';
};
  const reportTabs = [
    { id: 'overview', name: 'نظرة عامة', icon: '📊' },
    { id: 'inventory', name: 'تقرير المخزون', icon: '📦' },
    { id: 'lowStock', name: 'المخزون المنخفض', icon: '⚠️' },
    { id: 'categories', name: 'تقرير الفئات', icon: '🏷️' },
    { id: 'suppliers', name: 'تقرير الموردين', icon: '🏭' },
    { id: 'sales', name: 'تقرير المبيعات', icon: '💰' }
  ];

  return (
    <div className="reports-container">
      {/* رأس القسم */}
      <div className="reports-header mb-4">
        <div className="row align-items-center">
          <div className="col-md-6">
            <h3 className="reports-title">
              <i className="fas fa-chart-line me-3"></i>
              التقارير والإحصائيات
            </h3>
            <p className="text-muted mb-0">
              تحليل شامل لأداء المخزون والمبيعات
            </p>
          </div>
          <div className="col-md-6 text-end">
            <div className="btn-group">
              <button 
                className="btn btn-outline-primary"
                onClick={printReport}
              >
                <i className="fas fa-print me-1"></i>
                طباعة
              </button>
              <button 
                className="btn btn-outline-success"
                onClick={() => exportReport(activeReport)}
              >
                <i className="fas fa-download me-1"></i>
                تصدير CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* تبويبات التقارير */}
      <div className="reports-tabs mb-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-2">
            <div className="row g-2">
              {reportTabs.map(tab => (
                <div key={tab.id} className="col-lg-2 col-md-4 col-sm-6">
                  <button
                    className={`btn w-100 ${activeReport === tab.id ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveReport(tab.id)}
                  >
                    <div className="tab-content">
                      <div className="tab-icon">{tab.icon}</div>
                      <small className="tab-name">{tab.name}</small>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* محتوى التقارير */}
      <div className="reports-content">
        {activeReport === 'overview' && (
          <div className="overview-report">
            {/* البطاقات الإحصائية */}
            <div className="row g-4 mb-4">
              <div className="col-lg-3 col-md-6">
                <div className="stats-card bg-gradient-primary">
                  <div className="card-body text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white-50 mb-1">إجمالي المنتجات</h6>
                        <h2 className="mb-0">{stats.totalProducts}</h2>
                        <small className="text-white-50">منتج مسجل</small>
                      </div>
                      <div className="stats-icon">
                        <i className="fas fa-boxes fa-2x text-white-50"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="stats-card bg-gradient-success">
                  <div className="card-body text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white-50 mb-1">مخزون جيد</h6>
                        <h2 className="mb-0">{stats.inStockProducts}</h2>
                        <small className="text-white-50">منتج متوفر</small>
                      </div>
                      <div className="stats-icon">
                        <i className="fas fa-check-circle fa-2x text-white-50"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="stats-card bg-gradient-warning">
                  <div className="card-body text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white-50 mb-1">مخزون منخفض</h6>
                        <h2 className="mb-0">{stats.lowStockCount}</h2>
                        <small className="text-white-50">يحتاج تموين</small>
                      </div>
                      <div className="stats-icon">
                        <i className="fas fa-exclamation-triangle fa-2x text-white-50"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="stats-card bg-gradient-danger">
                  <div className="card-body text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white-50 mb-1">نفد المخزون</h6>
                        <h2 className="mb-0">{stats.outOfStockProducts}</h2>
                        <small className="text-white-50">منتج غير متوفر</small>
                      </div>
                      <div className="stats-icon">
                        <i className="fas fa-times-circle fa-2x text-white-50"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* بطاقة القيمة الإجمالية */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center p-4">
                    <h4 className="text-primary mb-3">
                      <i className="fas fa-coins me-2"></i>
                      القيمة الإجمالية للمخزون
                    </h4>
                    <h1 className="display-4 fw-bold text-success">
                      {stats.totalValue.toLocaleString('ar-DZ')} <small className="fs-5 text-muted">د.ج</small>
                    </h1>
                    <div className="row mt-4">
                      <div className="col-md-4">
                        <div className="border-end">
                          <h5 className="text-primary">{stats.categoriesStats.length}</h5>
                          <small className="text-muted">فئة نشطة</small>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="border-end">
                          <h5 className="text-info">{stats.suppliersStats.length}</h5>
                          <small className="text-muted">مورد نشط</small>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <h5 className="text-warning">
                          {stats.totalProducts > 0 ? (stats.totalValue / stats.totalProducts).toFixed(2) : 0}
                        </h5>
                        <small className="text-muted">متوسط قيمة المنتج</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'inventory' && (
          <div className="inventory-report">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light border-0">
                <h5 className="mb-0">
                  <i className="fas fa-warehouse me-2 text-primary"></i>
                  تقرير المخزون التفصيلي
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>#</th>
                        <th>المنتج</th>
                        <th>الفئة</th>
                        <th>المورد</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>القيمة الإجمالية</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product, index) => (
                        <tr key={product.id}>
                          <td>{index + 1}</td>
                          <td>
                            <div className="fw-semibold">{product.name}</div>
                            {product.sku && <small className="text-muted">SKU: {product.sku}</small>}
                          </td>
                          <td>
                            <span className="badge bg-primary bg-opacity-10 text-primary">
                              {product.category_name || 'غير مصنف'}
                            </span>
                          </td>
                          <td>{product.supplier_name || 'غير محدد'}</td>
                          <td>
                            <span className={`fw-bold ${product.stock_quantity <= (product.min_stock_level || 0) ? 'text-danger' : 'text-success'}`}>
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td>{(product.unit_price || 0).toFixed(2)} د.ج</td>
                          <td className="fw-semibold text-success">
                            {(product.stock_quantity * (product.unit_price || 0)).toFixed(2)} د.ج
                          </td>
                          <td>
                            {product.stock_quantity === 0 ? (
                              <span className="badge bg-danger">نفد المخزون</span>
                            ) : product.stock_quantity <= (product.min_stock_level || 0) ? (
                              <span className="badge bg-warning">مخزون منخفض</span>
                            ) : (
                              <span className="badge bg-success">متوفر</span>
                            )}
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

        {activeReport === 'lowStock' && (
          <div className="low-stock-report">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-gradient-warning text-white">
                <h5 className="mb-0">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  تقرير المنتجات منخفضة المخزون
                </h5>
              </div>
              <div className="card-body">
                {lowStockProducts.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-check-circle fa-4x text-success mb-3"></i>
                    <h4 className="text-success">ممتاز! 🎉</h4>
                    <p className="text-muted fs-5">جميع المنتجات ضمن المستوى الآمن للمخزون</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {lowStockProducts.map((product, index) => (
                      <div key={product.id} className="col-lg-4 col-md-6">
                        <div className="alert alert-warning border-0 shadow-sm">
                          <div className="d-flex align-items-center">
                            <div className="alert-icon me-3">
                              {product.stock_quantity === 0 ? (
                                <i className="fas fa-times-circle fa-2x text-danger"></i>
                              ) : (
                                <i className="fas fa-exclamation-triangle fa-2x text-warning"></i>
                              )}
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="alert-heading mb-1">{product.name}</h6>
                              <div className="row text-center">
                                <div className="col-6">
                                  <small className="text-muted">المتبقي</small>
                                  <div className="fw-bold text-danger">{product.stock_quantity}</div>
                                </div>
                                <div className="col-6">
                                  <small className="text-muted">الحد الأدنى</small>
                                  <div className="fw-bold text-info">{product.min_stock_level || 0}</div>
                                </div>
                              </div>
                              <div className="mt-2">
                                <span className={`badge ${product.stock_quantity === 0 ? 'bg-danger' : 'bg-warning'}`}>
                                  {product.stock_quantity === 0 ? 'نفد المخزون' : 'مخزون منخفض'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeReport === 'categories' && (
          <div className="categories-report">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light border-0">
                <h5 className="mb-0">
                  <i className="fas fa-tags me-2 text-primary"></i>
                  تقرير الفئات
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  {stats.categoriesStats.map(([category, data], index) => (
                    <div key={category} className="col-lg-4 col-md-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-3">
                            <div className={`category-icon bg-primary bg-opacity-10 text-primary me-3`}>
                              🏷️
                            </div>
                            <div>
                              <h6 className="mb-1">{category}</h6>
                              <small className="text-muted">{data.count} منتج</small>
                            </div>
                          </div>
                          <div className="category-stats">
                            <div className="row text-center">
                              <div className="col-6">
                                <div className="stat-item">
                                  <h5 className="text-primary">{data.count}</h5>
                                  <small className="text-muted">منتج</small>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="stat-item">
                                  <h5 className="text-success">{data.value.toFixed(0)}</h5>
                                  <small className="text-muted">د.ج</small>
                                </div>
                              </div>
                            </div>
                            <div className="progress mt-3" style={{height: '6px'}}>
                              <div 
                                className="progress-bar bg-primary" 
                                style={{width: `${(data.count / stats.totalProducts) * 100}%`}}
                              ></div>
                            </div>
                            <small className="text-muted">
                              {((data.count / stats.totalProducts) * 100).toFixed(1)}% من الإجمالي
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'suppliers' && (
          <div className="suppliers-report">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light border-0">
                <h5 className="mb-0">
                  <i className="fas fa-truck me-2 text-primary"></i>
                  تقرير الموردين
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  {stats.suppliersStats.map(([supplier, data], index) => (
                    <div key={supplier} className="col-lg-6 col-md-12">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-3">
                            <div className={`supplier-icon bg-info bg-opacity-10 text-info me-3`}>
                              🏭
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{supplier}</h6>
                              <small className="text-muted">{data.count} منتج متوفر</small>
                            </div>
                            <div className="text-end">
                              <h5 className="text-success mb-0">{data.value.toFixed(0)} د.ج</h5>
                              <small className="text-muted">قيمة إجمالية</small>
                            </div>
                          </div>
                          <div className="progress mb-2" style={{height: '8px'}}>
                            <div 
                              className="progress-bar bg-info" 
                              style={{width: `${(data.count / stats.totalProducts) * 100}%`}}
                            ></div>
                          </div>
                          <div className="d-flex justify-content-between">
                            <small className="text-muted">
                              {((data.count / stats.totalProducts) * 100).toFixed(1)}% من المنتجات
                            </small>
                            <small className="text-muted">
                              {((data.value / stats.totalValue) * 100).toFixed(1)}% من القيمة
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'sales' && (
          <div className="sales-report">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light border-0">
                <div className="row align-items-center">
                  <div className="col">
                    <h5 className="mb-0">
                      <i className="fas fa-chart-line me-2 text-primary"></i>
                      تقرير المبيعات
                    </h5>
                  </div>
                  <div className="col-auto">
                    <div className="row g-2">
                      <div className="col-auto">
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={dateRange.startDate}
                          onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                        />
                      </div>
                      <div className="col-auto">
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={dateRange.endDate}
                          onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">جارٍ التحميل...</span>
                    </div>
                    <p className="mt-2 text-muted">جارٍ تحميل تقرير المبيعات...</p>
                  </div>
                ) : salesData.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-chart-line fa-4x text-muted mb-3"></i>
                    <h5 className="text-muted">لا توجد مبيعات في هذه الفترة</h5>
                    <p className="text-muted">جرب تغيير نطاق التاريخ أو قم ببعض المبيعات</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>التاريخ</th>
                          <th className="text-center">عدد المعاملات</th>
                          <th className="text-center">إجمالي المبيعات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.map((day, index) => (
                          <tr key={index}>
                            <td>{new Date(day.date).toLocaleDateString('ar-DZ')}</td>
                            <td className="text-center">
                              <span className="badge bg-primary">{day.transaction_count}</span>
                            </td>
                            <td className="text-center fw-bold text-success">
                              {day.total_sales} د.ج
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="table-success">
                          <th>الإجمالي</th>
                          <th className="text-center">
                            {salesData.reduce((sum, day) => sum + day.transaction_count, 0)}
                          </th>
                          <th className="text-center">
                            {salesData.reduce((sum, day) => sum + day.total_sales, 0).toFixed(2)} د.ج
                          </th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;