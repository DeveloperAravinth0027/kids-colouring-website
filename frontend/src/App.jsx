import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from './store/slices/authSlice';
import { setBooks, setCategories } from './store/slices/catalogSlice';
import { setCartOwner, syncServerCart } from './store/slices/cartSlice';
import { getBooks, getCategories } from './data/catalog';
import MainLayout from './components/layouts/MainLayout';
import AdminLayout from './components/layouts/AdminLayout';
import Loader from './components/common/Loader';
import ProtectedRoute from './components/common/ProtectedRoute';

// Lazy loaded pages for performance
const Home = lazy(() => import('./pages/Home'));
const Books = lazy(() => import('./pages/Books'));
const BookDetails = lazy(() => import('./pages/BookDetails'));
const Categories = lazy(() => import('./pages/Categories'));
const CategoryDetails = lazy(() => import('./pages/CategoryDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const MyDownloads = lazy(() => import('./pages/MyDownloads'));
const Contact = lazy(() => import('./pages/Contact'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Terms = lazy(() => import('./pages/Terms'));
const ColoringStudio = lazy(() => import('./pages/ColoringStudio'));
const StoryReader = lazy(() => import('./pages/StoryReader'));
const BooksByType = lazy(() => import('./pages/BooksByType'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminBooks = lazy(() => import('./pages/admin/AdminBooks'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminGrants = lazy(() => import('./pages/admin/AdminGrants'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));

function App() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    // One-time cleanup: earlier builds saved colouring artwork and reading
    // position under keys with no user in them, so one person's work could show
    // up for the next user on the same browser. Remove those legacy keys.
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (/^art_\d+_\d+$/.test(k) || /^read_\d+$/.test(k))) {
          localStorage.removeItem(k);
        }
      }
    } catch { /* ignore */ }

    dispatch(loadUser());
    // Pull live catalogue from the backend if it's running; otherwise the
    // store keeps the local (sample + admin-edited) books.
    getBooks().then((r) => {
      if (r.live && r.data?.length) dispatch(setBooks(r.data));
    });
    // Real category ids are required to create books on the server.
    getCategories().then((r) => {
      if (r.live && r.data?.length) dispatch(setCategories(r.data));
    });
  }, [dispatch]);

  // Each user gets their own cart; guests share one. Switch on login/logout,
  // then reconcile with the server-side cart for real (backend) sessions.
  useEffect(() => {
    dispatch(setCartOwner(user?.email ? `user_${user.email}` : 'guest'));
    if (user?.email) dispatch(syncServerCart());
  }, [user, dispatch]);

  return (
    <Router>
      <Suspense fallback={<Loader fullScreen />}>
        <Routes>
          {/* Public Routes with MainLayout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="books" element={<Books />} />
            {/* The two product lines */}
            <Route path="story-books" element={<BooksByType type="STORY" />} />
            <Route path="colouring-books" element={<BooksByType type="COLOURING" />} />
            <Route path="books/:slug" element={<BookDetails />} />
            <Route path="categories" element={<Categories />} />
            <Route path="categories/:slug" element={<CategoryDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="payment-success" element={<PaymentSuccess />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="contact" element={<Contact />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="terms" element={<Terms />} />
            
            {/* Protected Customer Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="profile" element={<Profile />} />
              <Route path="my-downloads" element={<MyDownloads />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Full-screen readers/studios (no site chrome) */}
          <Route path="/color/:slug" element={<ColoringStudio />} />
          <Route path="/read/:slug" element={<StoryReader />} />

          {/* Admin Routes with AdminLayout */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="books" element={<AdminBooks />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="grants" element={<AdminGrants />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="coupons" element={<AdminCoupons />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
