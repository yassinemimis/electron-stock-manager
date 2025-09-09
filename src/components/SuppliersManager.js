import React, { useState } from 'react';
import InventoryService from '../database/inventoryService';

const SuppliersManager = ({ suppliers, onRefresh }) => {
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleChange = (e) => {
    setNewSupplier({ ...newSupplier, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    if (!newSupplier.name.trim()) return;
    await InventoryService.addSupplier(newSupplier);
    setNewSupplier({ name: '', contact_person: '', phone: '', email: '', address: '' });
    onRefresh();
  };

  return (
    <div>
      <h3 className="mb-3">🏭 إدارة الموردين</h3>

      {/* نموذج إضافة مورد */}
      <div className="mb-3 d-flex gap-2">
        <input
          type="text"
          name="name"
          className="form-control"
          placeholder="اسم المورد"
          value={newSupplier.name}
          onChange={handleChange}
        />
        <input
          type="text"
          name="phone"
          className="form-control"
          placeholder="الهاتف"
          value={newSupplier.phone}
          onChange={handleChange}
        />
        <button className="btn btn-success" onClick={handleAdd}>➕ إضافة</button>
      </div>

      {/* جدول الموردين */}
      <table className="table table-striped">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>المسؤول</th>
            <th>الهاتف</th>
            <th>البريد</th>
            <th>العنوان</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map(s => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.contact_person}</td>
              <td>{s.phone}</td>
              <td>{s.email}</td>
              <td>{s.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default SuppliersManager;
