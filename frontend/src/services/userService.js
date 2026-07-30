import api from './api';

// Admin user management. Passwords are bcrypt-hashed on the server and can
// never be read back — only set to a new value.
const userService = {
  adminList: async () => (await api.get('/admin/users')).data.data,
  adminCreate: async (data) => (await api.post('/admin/users', data)).data.data,
  adminSetRole: async (id, role) => (await api.put(`/admin/users/${id}/role`, null, { params: { role } })).data,
  adminSetPassword: async (id, password) => (await api.put(`/admin/users/${id}/password`, { password })).data,
  adminDelete: async (id) => (await api.delete(`/admin/users/${id}`)).data,
};

export default userService;
