import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import InventoryService from '../database/inventoryService';
const CategoriesManager = ({ categories, onRefresh }) => {
  const [newCategory, setNewCategory] = useState('');

 const handleAdd = async () => {
    if (!newCategory.trim()) return;
    await InventoryService.addCategory({ name: newCategory });
    setNewCategory('');
    onRefresh();
  };

  return (
    <div>
      <h3 className="mb-3">🏷️ إدارة الفئات</h3>
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="اسم الفئة الجديدة"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleAdd}>➕ إضافة</button>
      </div>

      <ul className="list-group">
        {categories.map(cat => (
          <li key={cat.id} className="list-group-item d-flex justify-content-between align-items-center">
            {cat.name}
            <button className="btn btn-sm btn-danger">🗑️ حذف</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoriesManager;
