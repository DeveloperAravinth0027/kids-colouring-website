import { Outlet, Navigate, NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Shield, LayoutDashboard, BookOpen, Tags, ShoppingBag, Ticket, LogOut, ExternalLink, AlertTriangle, Users, Gift } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'A';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/books', label: 'Books', icon: BookOpen },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/grants', label: 'Free Access', icon: Gift },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
];

const AdminLayout = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
        <Link to="/admin" className="p-5 border-b flex items-center gap-2 text-primary font-display text-xl">
          <Shield /> Admin Panel
        </Link>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-colors ${
                  isActive ? 'bg-primary text-white shadow-soft' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <l.icon size={20} /> {l.label}
            </NavLink>
          ))}

          {/* Secondary link kept with the menu so it doesn't float alone */}
          <NavLink
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
          >
            <ExternalLink size={20} /> View Site
          </NavLink>
        </nav>

        {/* Footer: who's signed in + a clean logout */}
        <div className="border-t p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF6B6B, #9B5DE5)' }}>
              {initials(user?.name)}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-gray-900 text-sm truncate">{user?.name || 'Admin'}</div>
              <div className="text-xs text-gray-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden bg-white shadow-sm flex items-center justify-between px-4 h-16">
          <span className="flex items-center gap-2 text-primary font-display text-lg"><Shield size={20} /> Admin</span>
          <button onClick={handleLogout} className="text-red-500 font-bold flex items-center gap-1">
            <LogOut size={18} /> Logout
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* The demo admin has no JWT, so nothing can be written to the database. */}
          {!localStorage.getItem('token') && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-secondary bg-secondary-light/30 p-4">
              <AlertTriangle className="text-secondary-dark shrink-0" size={22} />
              <div className="flex-grow min-w-0">
                <div className="font-bold text-gray-900">Offline demo session — nothing is saved to the database</div>
                <div className="text-sm text-gray-600">
                  Books you add here disappear on refresh. Log in with a real admin account to save permanently.
                </div>
              </div>
              <Link to="/login" className="btn-primary text-sm py-2 px-4 shrink-0">Log in properly</Link>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
