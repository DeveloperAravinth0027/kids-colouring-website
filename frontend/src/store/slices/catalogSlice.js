import { createSlice } from '@reduxjs/toolkit';
import { books as seedBooks, categories as seedCategories, svgCover } from '../../data/books';

// Books are the single source of truth for the storefront. They're seeded
// from the sample data, persisted to localStorage (so admin add/delete
// survive reloads), and replaced by live API data when the backend is up
// (see the hydration effect in App.jsx).
const LS_KEY = 'catalog_books_v1';

const loadBooks = () => {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore corrupt storage */
  }
  return seedBooks;
};

const persist = (books) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(books));
  } catch {
    /* ignore quota errors */
  }
};

// Build a full book object from an admin form payload.
export const buildBook = (form, categories) => {
  const cat = categories.find((c) => c.slug === form.categorySlug) || categories[0];
  const id = form.id ?? Date.now();
  // Keep the existing slug when editing; generate a stable one when adding.
  const slug =
    form.slug ||
    (form.name || 'book')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + `-${id}`;
  const price = Number(form.price) || 0;
  const discount = Number(form.discount) || 0;
  const finalPrice = discount ? Math.round(price * (1 - discount / 100)) : price;
  const emoji = form.emoji || cat.emoji;
  const colors = cat.colors;
  const fallbackCover = svgCover(emoji, colors[0], colors[1]);

  return {
    id,
    slug,
    name: form.name,
    title: form.name,
    categorySlug: cat.slug,
    categoryName: cat.name,
    categoryEmoji: cat.emoji,
    emoji,
    colors,
    price,
    finalPrice,
    discount,
    rating: Number(form.rating) || 5,
    reviews: Number(form.reviews) || 0,
    pages: Number(form.pages) || 0,
    ageRange: form.ageRange || '3-8',
    bestseller: !!form.bestseller,
    featured: form.featured !== false,
    bookType: form.bookType || 'COLOURING',
    isFree: !!form.isFree,
    amazonKdpLink: form.amazonKdpLink?.trim() || '',
    hasPdf: !!form.hasPdf,
    pdfName: form.pdfName || null,
    pdfSize: form.pdfSize || 0,
    description: form.description || '',
    coverImageUrl: form.coverImageUrl?.trim() || fallbackCover,
    fallbackCover,
  };
};

const initialState = {
  books: loadBooks(),
  categories: seedCategories,
};

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setBooks(state, action) {
      state.books = action.payload;
      persist(state.books);
    },
    setCategories(state, action) {
      if (action.payload?.length) state.categories = action.payload;
    },
    addBook(state, action) {
      state.books.unshift(action.payload);
      persist(state.books);
    },
    updateBook(state, action) {
      const idx = state.books.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) state.books[idx] = action.payload;
      persist(state.books);
    },
    removeBook(state, action) {
      state.books = state.books.filter((b) => b.id !== action.payload);
      persist(state.books);
    },
    resetBooks(state) {
      state.books = seedBooks;
      persist(state.books);
    },
  },
});

export const { setBooks, setCategories, addBook, updateBook, removeBook, resetBooks } = catalogSlice.actions;
export default catalogSlice.reducer;
