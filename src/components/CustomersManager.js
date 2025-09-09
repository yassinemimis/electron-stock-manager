import React, { useState } from 'react';
import InventoryService from '../database/inventoryService';

const CustomersManager = ({ customers, onRefresh }) => {
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleChange = (e) => {
    setNewCustomer({ ...newCustomer, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    if (!newCustomer.name.trim()) return;
    await InventoryService.addCustomer(newCustomer);
    setNewCustomer({ name: '', phone: '', email: '', address: '' });
    onRefresh();
  };

  return (
    <div>
      <h3 className="mb-3">👥 إدارة العملاء</h3>

      {/* نموذج إضافة عميل */}
      <div className="mb-3 d-flex gap-2">
        <input
          type="text"
          name="name"
          className="form-control"
          placeholder="اسم العميل"
          value={newCustomer.name}
          onChange={handleChange}
        />
        <input
          type="text"
          name="phone"
          className="form-control"
          placeholder="الهاتف"
          value={newCustomer.phone}
          onChange={handleChange}
        />
        <button className="btn btn-success" onClick={handleAdd}>➕ إضافة</button>
      </div>

      {/* جدول العملاء */}
      <table className="table table-striped">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الهاتف</th>
            <th>البريد</th>
            <th>العنوان</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.phone}</td>
              <td>{c.email}</td>
              <td>{c.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default CustomersManager;
