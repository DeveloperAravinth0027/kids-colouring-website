import api from './api';

const categoryService = {
  // fresh=true skips the browser HTTP cache (admin needs to see edits instantly).
  getAll: async (fresh = false) =>
    (await api.get('/categories', fresh ? { params: { _: Date.now() } } : undefined)).data.data,
  adminCreate: async (data) => (await api.post('/admin/categories', data)).data.data,
  adminUpdate: async (id, data) => (await api.put(`/admin/categories/${id}`, data)).data.data,
  adminDelete: async (id) => (await api.delete(`/admin/categories/${id}`)).data,
};

export default categoryService;
