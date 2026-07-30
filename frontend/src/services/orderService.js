import api from './api';

const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getMyOrders: async (params) => {
    const response = await api.get('/orders/my', { params });
    return response.data;
  },

  getOrderDetails: async (orderNumber) => {
    const response = await api.get(`/orders/my/${orderNumber}`);
    return response.data;
  },

  // Admin routes
  adminGetAllOrders: async (params) => {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  adminUpdateOrderStatus: async (id, status) => {
    const response = await api.put(`/admin/orders/${id}/status`, null, { params: { status } });
    return response.data;
  },
};

export default orderService;
