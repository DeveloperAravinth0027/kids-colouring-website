import api from './api';

// "May I open this book?" — free / purchased / granted / admin.
const accessService = {
  check: async (bookId) => (await api.get(`/access/books/${bookId}`)).data.data,
  myGrants: async () => (await api.get('/access/my-grants')).data.data,

  // admin gifting
  adminList: async () => (await api.get('/admin/grants')).data.data,
  adminGrant: async (userId, bookId, note) =>
    (await api.post('/admin/grants', { userId, bookId, note })).data.data,
  adminRevoke: async (id) => (await api.delete(`/admin/grants/${id}`)).data,
};

export default accessService;
