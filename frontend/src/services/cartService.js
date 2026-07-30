import api from './api';

// Server-side cart (persists per user, across devices). Requires a JWT.
const cartService = {
  get: async () => (await api.get('/cart')).data.data, // array of BookListResponse
  add: async (bookId) => (await api.post(`/cart/${bookId}`)).data,
  remove: async (bookId) => (await api.delete(`/cart/${bookId}`)).data,
  clear: async () => (await api.delete('/cart')).data,
};

export default cartService;
