import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { Mail, Lock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { login } from '../store/slices/authSlice';
import logo from '../assets/logo.webp';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Where to send the customer back to after logging in (?next=/color/xyz)
  const next = params.get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setBusy(true);
    try {
      const user = await dispatch(login({ email, password })).unwrap();
      toast.success(`Welcome back, ${user.name || ''}!`);
      navigate(next || (user.role === 'ADMIN' ? '/admin' : '/'));
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Login needs the backend running (port 8080).');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-blue-50 to-white">
      <Helmet><title>Login - KidsColour</title></Helmet>
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="card p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img src={logo} alt="Kids Colors" className="h-24 w-auto mx-auto mb-3" />
          <h1 className="text-3xl mb-1">Welcome back!</h1>
          <p className="text-gray-500">Log in to access your colouring books.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10" placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="font-bold text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-sm text-primary font-bold hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10" placeholder="••••••••"
              />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-600 flex items-center justify-center gap-1.5">
            <Shield size={14} className="text-purple" /> Admins sign in here with their normal account
          </p>
        </div>

        <p className="text-center text-gray-500 mt-6">
          New here?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">Create an account</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
