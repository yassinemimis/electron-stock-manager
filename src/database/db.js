const { ipcRenderer } = window.require('electron');

class DatabaseService {
  // جلب جميع المستخدمين
  async getUsers() {
    try {
      return await ipcRenderer.invoke('db-get-users');
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
      throw error;
    }
  }

  // إضافة مستخدم جديد
  async addUser(userData) {
    try {
      return await ipcRenderer.invoke('db-add-user', userData);
    } catch (error) {
      console.error('خطأ في إضافة المستخدم:', error);
      throw error;
    }
  }

  // حذف مستخدم
  async deleteUser(userId) {
    try {
      return await ipcRenderer.invoke('db-delete-user', userId);
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error);
      throw error;
    }
  }
}

export default new DatabaseService();