import api from './api';

// Colouring pages: admin uploads line-art images, the Studio colours them.
const coloringService = {
  // public — used by the Colouring Studio
  getPages: async (slug) => (await api.get(`/coloring/${slug}/pages`)).data.data,

  // admin
  adminListPages: async (bookId) => (await api.get(`/admin/books/${bookId}/pages`)).data.data,
  adminUpload: async (bookId, files) => {
    const fd = new FormData();
    [...files].forEach((f) => fd.append('files', f));
    const res = await api.post(`/admin/books/${bookId}/pages`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  adminDelete: async (bookId, pageId) => (await api.delete(`/admin/books/${bookId}/pages/${pageId}`)).data,
};

export default coloringService;
