import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './SalesManager.css';
import InventoryService from '../database/inventoryService';

const SalesManager = ({  customers, onRefresh }) => {
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [salesHistory, setSalesHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [currentSale, setCurrentSale] = useState(null);
  const [returnQuantities, setReturnQuantities] = useState({});
const [products, setProducts] = useState([]);
const [searchTerm2, setSearchTerm2] = useState("");
  // فلترة المنتجات المتاحة للبيع
  const availableProducts = products.filter(product =>
    product.stock_quantity > 0 &&
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    loadSalesHistory();
     loadProducts();
  }, []);

  const loadSalesHistory = async () => {
    try {
      const history = await InventoryService.getAll();
      if (!history) return;

      const historyWithItems = await Promise.all(
        history.map(async (sale) => {
          try {
            const fullDetails = await InventoryService.getDetailsFull(sale.id);
            console.log(`تفاصيل الفاتورة ${sale.id}:`, fullDetails);
            return { ...sale, items: fullDetails?.items || [] };
          } catch (err) {
            console.error(`فشل جلب تفاصيل الفاتورة ${sale.id}:`, err);
            return { ...sale, items: [] };
          }
        })
      );

      setSalesHistory(historyWithItems);
      console.log('تاريخ المبيعات:', historyWithItems);
    } catch (error) {
      console.error('خطأ في تحميل تاريخ المبيعات:', error);
    }
  };

  const loadProducts = async () => {
    const data = await InventoryService.getProducts(false);

    console.log("Loaded products:", data);
    setProducts(data); // ✅ تحديث state بدل props
  };
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        alert(`الكمية المتوفرة من ${product.name} هي ${product.stock_quantity} فقط`);
        return;
      }
      updateCartItemQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem = {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        unit_price: product.selling_price || product.unit_price || 0,
        quantity: 1,
        available_stock: product.stock_quantity,
        total_price: product.selling_price || product.unit_price || 0
      };
      setCart([...cart, newItem]);
    }
  };
  // ==================== إرجاع منتج من فاتورة ====================
  const handleReturnProductsWithValidation = async (transactionId, productId, maxQuantity) => {
    const qtyInput = document.getElementById(`return-qty-${transactionId}-${productId}`);
    const qtyToReturn = parseInt(qtyInput.value, 10);

    // Validation
    if (!qtyToReturn || qtyToReturn < 1) {
      alert('يرجى إدخال كمية صحيحة للإرجاع');
      return;
    }

    if (qtyToReturn > maxQuantity) {
      alert(`لا يمكن إرجاع أكثر من ${maxQuantity} قطعة`);
      return;
    }

    // Confirmation dialog
    const productName = document.querySelector(`#return-qty-${transactionId}-${productId}`)
      ?.closest('.product-item')
      ?.querySelector('strong')?.textContent || 'المنتج';

    const confirmed = window.confirm(
      `هل تريد إرجاع ${qtyToReturn} من ${productName}؟\n` +
      `سيتم إضافة الكمية إلى المخزون وتعديل الفاتورة.`
    );

    if (!confirmed) return;

    try {
      // Show loading state
      const button = event.target.closest('button');
      const originalHTML = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin fa-sm"></i> جاري الإرجاع...';
      button.disabled = true;

      const result = await InventoryService.returnItem(transactionId, productId, qtyToReturn);
      console.log('تم إرجاع المنتج بنجاح:', result);

      // Show success message
      showSuccessMessage(`تم إرجاع ${qtyToReturn} من ${productName} بنجاح`);

      // Reset input value
      qtyInput.value = 1;

      // تحديث واجهة المستخدم بعد الإرجاع
      await loadSalesHistory(); // إعادة تحميل تاريخ المبيعات

      // Restore button state
      button.innerHTML = originalHTML;
      button.disabled = false;

    } catch (error) {
      console.error('خطأ عند إرجاع المنتج:', error.message);
      showErrorMessage(`فشل في إرجاع المنتج: ${error.message}`);

      // Restore button state
      const button = event.target.closest('button');
      button.innerHTML = originalHTML;
      button.disabled = false;
    }
  };
  const handlePrintInvoice = (sale) => {
    const invoiceWindow = window.open("", "PRINT", "height=600,width=800");

    invoiceWindow.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <title>فاتورة رقم ${sale.reference_number}</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 20px; }
          h2 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
          th { background: #f4f4f4; }
          .total { font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>فاتورة مبيعات</h2>
        <p><strong>رقم الفاتورة:</strong> ${sale.reference_number}</p>
        <p><strong>التاريخ:</strong> ${new Date(sale.transaction_date).toLocaleString("ar-DZ")}</p>
        <p><strong>العميل:</strong> ${sale.customer_name || "عميل نقدي"}</p>

        <table>
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الكمية</th>
              <th>سعر الوحدة</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(
      (item) => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${item.unit_price.toFixed(2)} د.ج</td>
                <td>${(item.quantity * item.unit_price).toFixed(2)} د.ج</td>
              </tr>
            `
    ).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="total">المجموع الكلي</td>
              <td class="total">${sale.total_amount.toFixed(2)} د.ج</td>
            </tr>
          </tfoot>
        </table>

        <script>
          window.print();
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `);

    invoiceWindow.document.close();
  };


  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const updateCartItemQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find(item => item.product_id === productId);
    if (item && newQuantity > item.available_stock) {
      alert(`الكمية المتوفرة من ${item.product_name} هي ${item.available_stock} فقط`);
      return;
    }

    setCart(cart.map(item =>
      item.product_id === productId
        ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price }
        : item
    ));
  };

  const updateCartItemPrice = (productId, newPrice) => {
    setCart(cart.map(item =>
      item.product_id === productId
        ? { ...item, unit_price: newPrice, total_price: item.quantity * newPrice }
        : item
    ));
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total_price, 0);
  };

  const getDiscountAmount = () => {
    return (getSubtotal() * discount) / 100;
  };

  const getTotalAmount = () => {
    return getSubtotal() - getDiscountAmount();
  };

  const generateInvoiceNumber = () => {
    return `INV-${Date.now()}`;
  };

  const handleSale = async () => {
    if (cart.length === 0) {
      alert('يرجى إضافة منتجات للسلة أولاً');
      return;
    }

    if (getTotalAmount() <= 0) {
      alert('المبلغ الإجمالي يجب أن يكون أكبر من الصفر');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        reference_number: generateInvoiceNumber(),
        customer_id: selectedCustomer || null,
        total_amount: getTotalAmount(),
        discount_percentage: discount,
        discount_amount: getDiscountAmount(),
        payment_method: paymentMethod,
        notes: `عملية بيع من نقطة البيع - الطريقة: ${paymentMethod === 'cash' ? 'نقداً' : 'بطاقة'}`,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }))
      };

      await InventoryService.addSale(saleData);

      // حفظ الفاتورة للعرض
      setCurrentSale({
        ...saleData,
        invoice_number: saleData.reference_number,
        date: new Date(),
        customer_name: selectedCustomer ?
          customers.find(c => c.id === parseInt(selectedCustomer))?.name || 'عميل نقدي' :
          'عميل نقدي',
        items: cart
      });

      // إعادة تعيين النموذج
      setCart([]);
      setSelectedCustomer('');
      setDiscount(0);
      setPaymentMethod('cash');

      onRefresh();
      showSuccessToast('تمت عملية البيع بنجاح! 🎉');
      loadSalesHistory();
    } catch (error) {
      alert('خطأ في عملية البيع: ' + error.message);
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

  const printInvoice = () => {
    if (!currentSale) return;

    const printWindow = window.open('', '_blank');
    const invoiceHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة - ${currentSale.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .invoice-details { margin: 20px 0; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          .table th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 1.2em; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>فاتورة مبيعات</h2>
          <p>رقم الفاتورة: ${currentSale.invoice_number}</p>
          <p>التاريخ: ${currentSale.date.toLocaleDateString('ar-DZ')}</p>
        </div>
        <div class="invoice-details">
          <p><strong>العميل:</strong> ${currentSale.customer_name}</p>
          <p><strong>طريقة الدفع:</strong> ${currentSale.payment_method === 'cash' ? 'نقداً' : 'بطاقة'}</p>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الكمية</th>
              <th>السعر</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${currentSale.items.map(item => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${item.unit_price.toFixed(2)} د.ج</td>
                <td>${item.total_price.toFixed(2)} د.ج</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="text-align: right; margin-top: 20px;">
          <p>المجموع الفرعي: ${getSubtotal().toFixed(2)} د.ج</p>
          ${currentSale.discount_percentage > 0 ? `<p>الخصم (${currentSale.discount_percentage}%): -${currentSale.discount_amount.toFixed(2)} د.ج</p>` : ''}
          <p class="total">المجموع الإجمالي: ${currentSale.total_amount.toFixed(2)} د.ج</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <p>شكراً لتعاملكم معنا</p>
        </div>
        <script>window.print(); window.onafterprint = function(){ window.close(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };
 const filteredSales = salesHistory.filter((sale) => {
  if (!searchTerm2.trim()) return true; // لو ما فيه بحث، رجّع كل المبيعات

  const term = searchTerm2.toLowerCase();

  const invoiceMatch = sale.reference_number?.toString().includes(term);
  const customerMatch = sale.customer_name?.toLowerCase().includes(term);
  const productMatch = sale.items?.some((item) =>
    item.product_name?.toLowerCase().includes(term)
  );
  const dateMatch = sale.date?.toString().toLowerCase().includes(term);
  const totalMatch = sale.total?.toString().includes(term);

  return invoiceMatch || customerMatch || productMatch || dateMatch || totalMatch;
});

  return (
    <div className="sales-manager-container">
      {/* رأس القسم */}
      <div className="sales-header mb-4">
        <div className="row align-items-center">
          <div className="col-md-6">
            <h3 className="sales-title">
              <i className="fas fa-cash-register me-3"></i>
              نقطة البيع
            </h3>
            <p className="text-muted mb-0">
              المنتجات المتاحة: <span className="fw-bold text-success">{availableProducts.length}</span>
            </p>
          </div>
          <div className="col-md-6 text-end">
            <button
              className="btn btn-outline-info me-2"
              onClick={() => setShowHistory(!showHistory)}
            >
              <i className="fas fa-history me-1"></i>
              {showHistory ? 'إخفاء' : 'عرض'} تاريخ المبيعات
            </button>
            <button
              className="btn btn-warning"
              onClick={() => {
                setCart([]);
                setSelectedCustomer('');
                setDiscount(0);
                setCurrentSale(null);
              }}
            >
              <i className="fas fa-broom me-1"></i>
              مسح الكل
            </button>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* قسم المنتجات */}
        <div className="col-md-8">
          <div className="products-section">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-light border-0">
                <div className="row align-items-center">
                  <div className="col">
                    <h5 className="mb-0">
                      <i className="fas fa-boxes me-2 text-primary"></i>
                      المنتجات المتاحة
                    </h5>
                  </div>
                  <div className="col-auto">
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0">
                        <i className="fas fa-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-0 bg-light"
                        placeholder="البحث في المنتجات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {availableProducts.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="fas fa-box-open fa-3x mb-3"></i>
                    <p>لا توجد منتجات متاحة للبيع</p>
                  </div>
                ) : (
                  <div className="products-grid">
                    {availableProducts.map(product => (
                      <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
                        <div className="product-info">
                          <h6 className="product-name">{product.name}</h6>
                          {product.sku && <small className="text-muted">SKU: {product.sku}</small>}
                          <div className="product-price">
                            {product.selling_price || product.unit_price || 0} د.ج
                          </div>
                          <div className="product-stock">
                            <i className="fas fa-box me-1"></i>
                            {product.stock_quantity} متوفر
                          </div>
                        </div>
                        <div className="product-add">
                          <i className="fas fa-plus"></i>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* قسم السلة والدفع */}
        <div className="col-md-4">
          <div className="cart-section">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-gradient-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-shopping-cart me-2"></i>
                  سلة المشتريات ({cart.length})
                </h5>
              </div>
              <div className="card-body">
                {/* اختيار العميل */}
                <div className="customer-selection mb-3">
                  <label className="form-label fw-semibold">العميل:</label>
                  <select
                    className="form-select"
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                  >
                    <option value="">عميل نقدي</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.phone && ` - ${customer.phone}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* عناصر السلة */}
                <div className="cart-items mb-3">
                  {cart.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <i className="fas fa-cart-plus fa-2x mb-2"></i>
                      <p>السلة فارغة</p>
                      <small>اختر منتجات لإضافتها</small>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.product_id} className="cart-item mb-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{item.product_name}</h6>
                            {item.product_sku && (
                              <small className="text-muted">SKU: {item.product_sku}</small>
                            )}
                          </div>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeFromCart(item.product_id)}
                            title="حذف من السلة"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>

                        <div className="row g-2">
                          <div className="col-4">
                            <label className="form-label small">الكمية:</label>
                            <div className="input-group input-group-sm">
                              <button
                                className="btn btn-outline-secondary"
                                onClick={() => updateCartItemQuantity(item.product_id, item.quantity - 1)}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                className="form-control text-center"
                                value={item.quantity}
                                onChange={(e) => updateCartItemQuantity(item.product_id, parseInt(e.target.value) || 1)}
                                min="1"
                                max={item.available_stock}
                              />
                              <button
                                className="btn btn-outline-secondary"
                                onClick={() => updateCartItemQuantity(item.product_id, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="col-4">
                            <label className="form-label small">السعر:</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.unit_price}
                              onChange={(e) => updateCartItemPrice(item.product_id, parseFloat(e.target.value) || 0)}
                              step="0.01"
                            />
                          </div>
                          <div className="col-4">
                            <label className="form-label small">الإجمالي:</label>
                            <div className="fw-bold text-success">
                              {item.total_price.toFixed(2)} د.ج
                            </div>
                          </div>
                        </div>

                        <small className="text-muted">
                          متوفر: {item.available_stock} قطعة
                        </small>
                      </div>
                    ))
                  )}
                </div>

                {/* إعدادات البيع */}
                {cart.length > 0 && (
                  <div className="sale-settings">
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small">الخصم (%):</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={discount}
                          onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small">طريقة الدفع:</label>
                        <select
                          className="form-select form-select-sm"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <option value="cash">نقداً</option>
                          <option value="card">بطاقة</option>
                        </select>
                      </div>
                    </div>

                    {/* ملخص الفاتورة */}
                    <div className="invoice-summary">
                      <div className="d-flex justify-content-between mb-2">
                        <span>المجموع الفرعي:</span>
                        <span>{getSubtotal().toFixed(2)} د.ج</span>
                      </div>
                      {discount > 0 && (
                        <div className="d-flex justify-content-between mb-2 text-warning">
                          <span>الخصم ({discount}%):</span>
                          <span>-{getDiscountAmount().toFixed(2)} د.ج</span>
                        </div>
                      )}
                      <hr />
                      <div className="d-flex justify-content-between fw-bold fs-5 text-success">
                        <span>المجموع الإجمالي:</span>
                        <span>{getTotalAmount().toFixed(2)} د.ج</span>
                      </div>
                    </div>

                    {/* أزرار العمل */}
                    <div className="mt-3">
                      <button
                        className="btn btn-success btn-lg w-100"
                        onClick={handleSale}
                        disabled={loading || cart.length === 0}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            جارٍ المعالجة...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check me-2"></i>
                            إتمام عملية البيع
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* فاتورة البيع الأخيرة */}
      {currentSale && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-receipt me-2"></i>
                  آخر عملية بيع - {currentSale.invoice_number}
                </h5>
                {/* زر الطباعة */}
                <button
                  className="btn btn-light btn-sm"
                  onClick={printInvoice}
                >
                  <i className="fas fa-print me-1"></i>
                  طباعة الفاتورة
                </button>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>العميل:</strong> {currentSale.customer_name}</p>
                    <p><strong>التاريخ:</strong> {currentSale.date.toLocaleString('ar-DZ')}</p>
                    <p><strong>طريقة الدفع:</strong> {currentSale.payment_method === 'cash' ? 'نقداً' : 'بطاقة'}</p>
                  </div>
                  <div className="col-md-6 text-end">
                    <p>
                      <strong>المجموع:</strong>
                      <span className="text-success fs-4"> {currentSale.total_amount.toFixed(2)} د.ج</span>
                    </p>
                    {currentSale.discount_percentage > 0 && (
                      <p><strong>الخصم:</strong> {currentSale.discount_percentage}% (-{currentSale.discount_amount.toFixed(2)} د.ج)</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* تاريخ المبيعات */}
      {showHistory && (
        <div className="row mt-4">
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          {/* العنوان + البحث */}
          <div className="card-header bg-light border-0 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-info">
              <i className="fas fa-history me-2"></i> تاريخ المبيعات
            </h5>

            <div className="d-flex align-items-center">
              <input
                type="text"
                className="form-control form-control-sm me-2"
                placeholder="🔍 بحث..."
                value={searchTerm2}
                onChange={(e) => setSearchTerm2(e.target.value)}
                style={{ width: "200px" }}
              />
              <span className="badge bg-secondary">{filteredSales.length} فواتير</span>
            </div>
          </div>

              <div className="card-body">
                {salesHistory.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="fas fa-clock fa-3x mb-3"></i>
                    <p>لا توجد مبيعات مسجلة بعد</p>
                    <small>ستظهر هنا جميع عمليات البيع المسجلة</small>
                  </div>
                ) : (
                  <div
                    className="table-responsive custom-scroll"
                    style={{ maxHeight: "400px", overflowY: "auto" }}
                  >
                    <table className="table table-striped align-middle text-center">
                      <thead className="table-light sticky-top">
                        <tr>
                          <th>رقم الفاتورة</th>
                          <th>التاريخ</th>
                          <th>العميل</th>
                          <th>المجموع الإجمالي</th>
                          <th>المنتجات</th>
                          <th>الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.map((sale) => (
                          <tr key={sale.id}>
                            <td><strong>{sale.reference_number}</strong></td>
                            <td>{new Date(sale.transaction_date).toLocaleString("ar-DZ")}</td>
                            <td>{sale.customer_name || "عميل نقدي"}</td>
                            <td className="fw-bold text-success">{sale.total_amount.toFixed(2)} د.ج</td>
                            <td className="text-start">
                              <ul className="list-unstyled mb-0">
                                {sale.items.map((item) => (
                                  <li key={item.id} className="mb-2">
                                    <span className="fw-bold">{item.product_name}</span>
                                    <span className="text-muted">
                                      {" "}({item.quantity} × {item.unit_price.toFixed(2)} د.ج)
                                    </span>

                                    {/* إدخال الكمية مع زر */}
                                    <div className="d-inline-flex align-items-center ms-3">
                                      <input
                                        type="number"
                                        min="1"
                                        max={item.quantity}
                                        className="form-control form-control-sm me-2"
                                        placeholder="كمية"
                                        value={returnQuantities[item.id] || ""}
                                        onChange={(e) =>
                                          setReturnQuantities({
                                            ...returnQuantities,
                                            [item.id]: Number(e.target.value),
                                          })
                                        }
                                        style={{ width: "70px" }}
                                      />
                                      <button
                                        className="btn btn-sm btn-outline-warning"
                                        onClick={async () => {
                                          const quantity = returnQuantities[item.id] || 0;

                                          if (isNaN(quantity) || quantity <= 0 || quantity > item.quantity) {
                                            alert("⚠️ الكمية غير صحيحة");
                                            return;
                                          }

                                          await InventoryService.returnItem(sale.id, item.product_id, quantity);

                                          await loadSalesHistory();
                                         await loadProducts();

                                          setReturnQuantities((prev) => ({ ...prev, [item.id]: "" }));

                                          alert("✅ تم إرجاع المنتج بنجاح");
                                        }}
                                      >
                                        <i className="fas fa-undo"></i> إرجاع
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handlePrintInvoice(sale)}
                              >
                                <i className="fas fa-print"></i> طباعة
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                )}
              </div>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};

export default SalesManager;