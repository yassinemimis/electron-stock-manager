import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Reports = ({ products, lowStockProducts }) => {
  return (
    <div>
      <h3 className="mb-3">📈 التقارير</h3>
      <p>تقرير المنتجات الكلي: <b>{products.length}</b></p>
      <p>تقرير المنتجات منخفضة الكمية: <b>{lowStockProducts.length}</b></p>

      <div className="mt-4">
        <h5>📉 تفاصيل المنتجات منخفضة</h5>
        <ul className="list-group">
          {lowStockProducts.map(p => (
            <li key={p.id} className="list-group-item">
              {p.name} - الكمية: {p.stock}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Reports;
