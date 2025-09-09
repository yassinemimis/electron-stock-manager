import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import InventoryService from '../database/inventoryService';
const SalesManager = ({ products, customers, onRefresh }) => {
  const [sale, setSale] = useState({ product: '', customer: '', qty: 1 });

   const handleAdd = async () => {
    if (!sale.product || !sale.customer) return;
    await InventoryService.addSale(sale);
    setSale({ product: '', customer: '', qty: 1 });
    onRefresh();
  };

  return (
    <div>
      <h3 className="mb-3">💰 إدارة المبيعات</h3>

      <div className="card mb-4">
        <div className="card-body">
          <h5>➕ تسجيل عملية بيع</h5>
          <div className="row g-2">
            <div className="col-md-4">
              <select
                className="form-select"
                value={sale.product}
                onChange={(e) => setSale({ ...sale, product: e.target.value })}
              >
                <option value="">اختر منتج</option>
                {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={sale.customer}
                onChange={(e) => setSale({ ...sale, customer: e.target.value })}
              >
                <option value="">اختر عميل</option>
                {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="الكمية"
                value={sale.qty}
                onChange={(e) => setSale({ ...sale, qty: e.target.value })}
              />
            </div>
            <div className="col-md-2">
              <button className="btn btn-success w-100" onClick={handleAdd}>✔️ تأكيد</button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-muted">💡 هنا لاحقاً نقدر نعرض جدول بالمبيعات المسجلة.</p>
    </div>
  );
};

export default SalesManager;
