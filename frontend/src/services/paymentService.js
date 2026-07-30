import api from './api';

const paymentService = {
  createRazorpayOrder: async (data) => {
    const response = await api.post('/payments/razorpay/create-order', data);
    return response.data;
  },

  verifyRazorpayPayment: async (data) => {
    const response = await api.post('/payments/razorpay/verify', data);
    return response.data;
  },
};

export default paymentService;
