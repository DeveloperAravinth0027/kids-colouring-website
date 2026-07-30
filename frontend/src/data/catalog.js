// ============================================================
// Catalog adapter — bridges the UI to the real backend API.
//
// Every function tries the live API first, normalizes the
// response into the shape the UI components expect, and falls
// back to the bundled sample data (./books) on any error.
// This means the site works offline/without the backend, and
// automatically upgrades to live data the moment the Spring Boot
// API on :8080 is running (Vite proxies /api -> :8080).
// ============================================================

import api from '../services/api';
import {
  books as mockBooks,
  categories as mockCategories,
  featuredBooks as mockFeatured,
  getBookBySlug as mockGetBySlug,
  getBooksByCategory as mockByCat,
  getCategoryBySlug as mockCatBySlug,
  svgCover,
} from './books';

// The API has no per-book emoji / theme colours, so we decorate
// live data with cosmetics keyed by category slug. Covers both the
// sample slugs (./books) and the real backend seed slugs.
const cosmetics = {
  // sample-data slugs
  ...mockCategories.reduce((acc, c) => {
    acc[c.slug] = { emoji: c.emoji, colors: c.colors };
    return acc;
  }, {}),
  // backend seed slugs (database/seed.sql)
  animals: { emoji: '🦁', colors: ['#FF9F43', '#FF6B6B'] },
  vehicles: { emoji: '🚗', colors: ['#4D96FF', '#3A7DDB'] },
  'princess-fairy-tales': { emoji: '👑', colors: ['#FF6B6B', '#9B5DE5'] },
  'alphabet-numbers': { emoji: '🔤', colors: ['#FFD93D', '#FF9F43'] },
  'nature-flowers': { emoji: '🌸', colors: ['#6BCB77', '#2E8B57'] },
  superheroes: { emoji: '🦸', colors: ['#9B5DE5', '#5D2E8C'] },
  'festival-seasons': { emoji: '🎉', colors: ['#FF6B6B', '#FFD93D'] },
  dinosaurs: { emoji: '🦕', colors: ['#6BCB77', '#2E8B57'] },
  'space-science': { emoji: '🚀', colors: ['#9B5DE5', '#5D2E8C'] },
  'mandala-art': { emoji: '🌀', colors: ['#9B5DE5', '#4D96FF'] },
};
const FALLBACK_COSMETIC = { emoji: '🎨', colors: ['#FF6B6B', '#9B5DE5'] };
const cosmeticFor = (slug) => cosmetics[slug] || FALLBACK_COSMETIC;

// A colourful generated cover for a category (used when a book has no image).
export const coverFallbackFor = (categorySlug) => {
  const c = cosmeticFor(categorySlug);
  return svgCover(c.emoji, c.colors[0], c.colors[1]);
};

// Map a BookListResponse or BookResponse to the UI's book shape.
function normalizeBook(b) {
  const catSlug = b.categorySlug || b.category?.slug || 'misc';
  const catName = b.categoryName || b.category?.name || 'Books';
  const cos = cosmeticFor(catSlug);
  const price = Number(b.price ?? 0);
  const finalPrice = Number(b.finalPrice ?? price);
  const discount =
    b.discountPercent ?? (price ? Math.round(((price - finalPrice) / price) * 100) : 0);
  const fallbackCover = svgCover(cos.emoji, cos.colors[0], cos.colors[1]);

  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    title: b.name,
    bookType: b.bookType || 'COLOURING',
    categorySlug: catSlug,
    categoryName: catName,
    categoryEmoji: cos.emoji,
    emoji: cos.emoji,
    colors: cos.colors,
    price,
    finalPrice,
    discount,
    rating: Number(b.averageRating ?? 0) || 4.8,
    reviews: b.reviewCount ?? 0,
    pages: b.numPages ?? b.pages ?? 0,
    ageRange: b.ageGroup ?? b.ageRange ?? '3-8',
    bestseller: !!b.isFeatured,
    featured: !!b.isFeatured,
    isFree: !!b.isFree,
    hasPdf: !!b.hasPdf,
    amazonKdpLink: b.amazonKdpLink || '',
    description: b.description || b.shortDescription || '',
    coverImageUrl: b.coverImageUrl || fallbackCover,
    fallbackCover,
  };
}

function normalizeCategory(c) {
  const cos = cosmeticFor(c.slug);
  const c1 = c.colorHex || cos.colors[0];
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    bookType: c.bookType || 'BOTH',
    description: c.description || '',
    // Prefer an admin-picked emoji; fall back to the built-in one for the
    // original seeded slugs, then a generic default.
    emoji: c.emoji || cos.emoji,
    colors: [c1, cos.colors[1]],
  };
}

// Unwrap ApiResponse<PagedResponse<T>> -> T[]
const pagedContent = (res) => res?.data?.data?.content ?? [];
// Unwrap ApiResponse<T> -> T
const payload = (res) => res?.data?.data;

export async function getBooks(categorySlug, { fresh = false } = {}) {
  try {
    // `fresh` adds a cache-buster so admin refetches skip the browser's HTTP
    // cache (the public catalogue is cached 60s for performance).
    const params = { size: 100, ...(fresh ? { _: Date.now() } : {}) };
    const res = await api.get('/books', { params });
    let list = pagedContent(res).map(normalizeBook);
    if (categorySlug) list = list.filter((b) => b.categorySlug === categorySlug);
    if (!list.length) throw new Error('empty');
    return { data: list, live: true };
  } catch {
    return { data: categorySlug ? mockByCat(categorySlug) : mockBooks, live: false };
  }
}

export async function getFeatured() {
  try {
    const res = await api.get('/books/featured', { params: { size: 8 } });
    const list = pagedContent(res).map(normalizeBook);
    if (!list.length) throw new Error('empty');
    return { data: list, live: true };
  } catch {
    return { data: mockFeatured, live: false };
  }
}

export async function getBook(slug) {
  try {
    const b = payload(await api.get(`/books/${slug}`));
    if (!b) throw new Error('missing');
    return { data: normalizeBook(b), live: true };
  } catch {
    return { data: mockGetBySlug(slug) || null, live: false };
  }
}

export async function getCategories({ fresh = false } = {}) {
  try {
    const config = fresh ? { params: { _: Date.now() } } : undefined;
    const raw = payload(await api.get('/categories', config));
    const list = (Array.isArray(raw) ? raw : []).map(normalizeCategory);
    if (!list.length) throw new Error('empty');
    return { data: list, live: true };
  } catch {
    return { data: mockCategories, live: false };
  }
}

export async function getCategory(slug) {
  try {
    const c = payload(await api.get(`/categories/${slug}`));
    if (!c) throw new Error('missing');
    return { data: normalizeCategory(c), live: true };
  } catch {
    return { data: mockCatBySlug(slug) || null, live: false };
  }
}
