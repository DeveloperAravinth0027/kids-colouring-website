import api from './api';

const wishlistService = {
  getWishlist: async (params) => {
    const response = await api.get('/wishlist', { params });
    return response.data;
  },

  addToWishlist: async (bookId) => {
    const response = await api.post(`/wishlist/${bookId}`);
    return response.data;
  },

  removeFromWishlist: async (bookId) => {
    const response = await api.delete(`/wishlist/${bookId}`);
    return response.data;
  },

  checkWishlist: async (bookId) => {
    const response = await api.get(`/wishlist/${bookId}/check`);
    return response.data;
  }
};

export default wishlistService;
