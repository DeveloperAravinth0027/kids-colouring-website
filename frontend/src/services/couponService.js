import api from './api';

const couponService = {
  adminList: async (params) => (await api.get('/admin/coupons', { params })).data.data,
  adminCreate: async (data) => (await api.post('/admin/coupons', data)).data.data,
  adminUpdate: async (id, data) => (await api.put(`/admin/coupons/${id}`, data)).data.data,
};

export default couponService;
