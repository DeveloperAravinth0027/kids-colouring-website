import api from './api';

const bookService = {
  // Public routes
  getAllBooks: async (params) => {
    const response = await api.get('/books', { params });
    return response.data;
  },

  getFeaturedBooks: async (params) => {
    const response = await api.get('/books/featured', { params });
    return response.data;
  },

  getFreeBooks: async (params) => {
    const response = await api.get('/books/free', { params });
    return response.data;
  },

  searchBooks: async (q, params) => {
    const response = await api.get('/books/search', { params: { ...params, q } });
    return response.data;
  },

  getBookBySlug: async (slug) => {
    const response = await api.get(`/books/${slug}`);
    return response.data;
  },

  // Admin routes
  adminCreateBook: async (data) => {
    const response = await api.post('/admin/books', data);
    return response.data;
  },

  adminUpdateBook: async (id, data) => {
    const response = await api.put(`/admin/books/${id}`, data);
    return response.data;
  },

  adminDeleteBook: async (id) => {
    const response = await api.delete(`/admin/books/${id}`);
    return response.data;
  },

  adminUploadCover: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/admin/books/${id}/upload-cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  adminUploadPdf: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/admin/books/${id}/upload-pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // ---- e-book PDF stored on the server (disk-backed, no S3 needed) ----
  adminUploadBookPdf: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/admin/books/${id}/pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Store a cover image on the server (works without Cloudinary).
  adminUploadCover: async (id, fileOrBlob) => {
    const fd = new FormData();
    fd.append('file', fileOrBlob, 'cover.jpg');
    const res = await api.post(`/admin/books/${id}/cover`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  getPdfStatus: async (bookId) => (await api.get(`/books/${bookId}/pdf/status`)).data.data,

  /** Returns a Blob the caller can save; throws 403 if not purchased, 404 if none. */
  downloadBookPdf: async (bookId) =>
    (await api.get(`/files/books/${bookId}/pdf`, { responseType: 'blob' })).data,
};

export default bookService;
