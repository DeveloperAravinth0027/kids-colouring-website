import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartService from '../../services/cartService';
import { coverFallbackFor } from '../../data/catalog';

// Each user (and the anonymous "guest") gets their own cart, stored under
// a per-owner localStorage key. The active owner is switched from App.jsx
// whenever the logged-in user changes.

const keyFor = (owner) => `cart_${owner || 'guest'}`;
const emptyCart = () => ({ items: [], totalQuantity: 0, subtotal: 0 });

const loadCartFor = (owner) => {
  try {
    let raw = localStorage.getItem(keyFor(owner));
    // One-time migration of the old shared "cart" key into the guest cart.
    if (!raw && owner === 'guest') {
      const legacy = localStorage.getItem('cart');
      if (legacy) { raw = legacy; localStorage.removeItem('cart'); }
    }
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      totalQuantity: Number(parsed.totalQuantity) || 0,
      subtotal: Number(parsed.subtotal) || 0,
    };
  } catch {
    return emptyCart();
  }
};

const persist = (state) => {
  try {
    localStorage.setItem(
      keyFor(state.ownerKey),
      JSON.stringify({ items: state.items, totalQuantity: state.totalQuantity, subtotal: state.subtotal })
    );
  } catch (err) {
    console.error('Could not save cart', err);
  }
};

const recalc = (state) => {
  state.totalQuantity = state.items.reduce((t, i) => t + i.quantity, 0);
  state.subtotal = state.items.reduce((t, i) => t + i.price * i.quantity, 0);
  persist(state);
};

const initialState = { ...loadCartFor('guest'), ownerKey: 'guest' };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Switch to a different owner's cart (called on login/logout).
    setCartOwner: (state, action) => {
      const owner = action.payload || 'guest';
      if (owner === state.ownerKey) return;

      const loaded = loadCartFor(owner);

      // When a guest logs in, merge their guest cart into the user's cart.
      if (state.ownerKey === 'guest' && owner !== 'guest' && state.items.length) {
        const byId = new Map(loaded.items.map((i) => [i.id, i]));
        state.items.forEach((i) => { if (!byId.has(i.id)) byId.set(i.id, i); });
        loaded.items = [...byId.values()];
        try { localStorage.removeItem(keyFor('guest')); } catch { /* ignore */ }
      }

      state.ownerKey = owner;
      state.items = loaded.items;
      recalc(state);
    },

    addToCart: (state, action) => {
      const newItem = action.payload;
      if (!state.items.find((item) => item.id === newItem.id)) {
        const fallback = newItem.fallbackCover || coverFallbackFor(newItem.categorySlug);
        state.items.push({
          id: newItem.id,
          name: newItem.name,
          price: newItem.finalPrice || newItem.price,
          coverImageUrl: newItem.coverImageUrl?.trim() || fallback,
          fallbackCover: fallback,
          slug: newItem.slug,
          quantity: 1,
        });
      }
      recalc(state);
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      recalc(state);
    },

    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.subtotal = 0;
      persist(state);
    },

    // Replace the whole cart (used when loading the server cart).
    setItems: (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : [];
      recalc(state);
    },
  },
});

export const { setCartOwner, addToCart, removeFromCart, clearCart, setItems } = cartSlice.actions;

// ---- server sync thunks ----
// A real (backend) session has a JWT in localStorage; the offline demo admin
// does not, so it stays purely local.
const isAuthed = () => !!localStorage.getItem('token');
const toCartItem = (b) => {
  const fallback = coverFallbackFor(b.categorySlug);
  return {
    id: b.id,
    name: b.name,
    price: b.finalPrice || b.price,
    coverImageUrl: b.coverImageUrl?.trim() ? b.coverImageUrl : fallback,
    fallbackCover: fallback,
    slug: b.slug,
    quantity: 1,
  };
};

export const addItem = createAsyncThunk('cart/addItem', async (book, { dispatch }) => {
  dispatch(addToCart(book)); // optimistic local update
  if (isAuthed()) { try { await cartService.add(book.id); } catch { /* offline ok */ } }
});

export const removeItem = createAsyncThunk('cart/removeItem', async (id, { dispatch }) => {
  dispatch(removeFromCart(id));
  if (isAuthed()) { try { await cartService.remove(id); } catch { /* offline ok */ } }
});

export const clearItems = createAsyncThunk('cart/clearItems', async (_, { dispatch }) => {
  dispatch(clearCart());
  if (isAuthed()) { try { await cartService.clear(); } catch { /* offline ok */ } }
});

// On login: push the local/guest cart up to the server, then load the
// authoritative server cart. Adds are idempotent server-side.
export const syncServerCart = createAsyncThunk('cart/sync', async (_, { dispatch, getState }) => {
  if (!isAuthed()) return;
  const local = getState().cart.items;
  try {
    for (const it of local) { try { await cartService.add(it.id); } catch { /* skip */ } }
    const serverBooks = await cartService.get();
    dispatch(setItems(serverBooks.map(toCartItem)));
  } catch { /* keep local cart if the server is unreachable */ }
});

export default cartSlice.reducer;
