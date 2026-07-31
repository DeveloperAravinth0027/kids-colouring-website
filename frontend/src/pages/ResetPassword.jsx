import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import logo from '../assets/logo.webp';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { toast.error('The two passwords don’t match.'); return; }
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      toast.success('Password reset! Please log in with your new password.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setBusy(false);
    }
  };

  // A reset link without a token is useless — guide the user back.
  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <Helmet><title>Reset Password - KidsColour</title></Helmet>
        <div className="card p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-3">⚠️</div>
          <h1 className="text-2xl mb-2">Invalid reset link</h1>
          <p className="text-gray-500 mb-6">This link is missing its token. Please request a new one.</p>
          <Link to="/forgot-password" className="btn-primary">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-blue-50 to-white">
      <Helmet><title>Reset Password - KidsColour</title></Helmet>
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="card p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img src={logo} alt="Kids Colors" className="h-20 w-auto mx-auto mb-3" />
          <h1 className="text-3xl mb-1">Set a new password</h1>
          <p className="text-gray-500">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-bold text-gray-700 mb-1">New password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10" placeholder="At least 8 characters"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="input-field pl-10" placeholder="Re-enter your password"
              />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
