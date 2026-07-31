import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import logo from '../assets/logo.webp';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } catch {
      // Intentionally ignore errors: we never reveal whether an email is
      // registered. Either way the user sees the same confirmation.
    } finally {
      setBusy(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-blue-50 to-white">
      <Helmet><title>Forgot Password - KidsColour</title></Helmet>
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="card p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img src={logo} alt="Kids Colors" className="h-20 w-auto mx-auto mb-3" />
          <h1 className="text-3xl mb-1">Forgot password?</h1>
          <p className="text-gray-500">Enter your email and we’ll send you a reset link.</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">📧</div>
            <p className="text-gray-800 font-bold">Check your inbox</p>
            <p className="text-gray-500 text-sm">
              If an account exists for <b>{email}</b>, we’ve sent a password reset link.
              It can take a minute to arrive — remember to check your spam folder.
            </p>
            <Link to="/login" className="btn-primary inline-flex items-center gap-2">
              <ArrowLeft size={18} /> Back to login
            </Link>
          </div>
        ) : (
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
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
            <p className="text-center text-gray-500">
              Remembered it?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">Back to login</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
