import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import logo from '../../assets/logo-header.webp';

const Header = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="fixed w-full top-0 z-50 glass-panel shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="Kids Colors home">
          <img src={logo} alt="Kids Colors" className="h-16 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-6 font-bold text-gray-600">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <Link to="/story-books" className="hover:text-blue transition-colors flex items-center gap-1.5">
            <span>📖</span> Story Books
          </Link>
          <Link to="/colouring-books" className="hover:text-purple transition-colors flex items-center gap-1.5">
            <span>🎨</span> Colouring Books
          </Link>
          <Link to="/categories" className="hover:text-primary transition-colors">Themes</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/cart" aria-label="Cart" className="relative p-2 text-gray-600 hover:text-primary transition-colors">
            <ShoppingCart />
            {totalQuantity > 0 && (
              <span className="absolute top-0 right-0 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalQuantity}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link to={user?.role === 'ADMIN' ? '/admin' : '/profile'} className="flex items-center gap-2 text-gray-600 hover:text-primary font-bold">
                <User size={20} />
                <span className="hidden sm:inline">{user?.name}</span>
              </Link>
              <button onClick={handleLogout} aria-label="Log out" className="text-gray-500 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2 px-4">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
