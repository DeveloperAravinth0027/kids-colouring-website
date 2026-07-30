import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { User, Mail, Phone, Shield, LogOut, Save, Package, BookOpen, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateProfile, logout } from '../store/slices/authSlice';
import orderService from '../services/orderService';

const initialsOf = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

const Profile = () => {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ orders: 0, books: 0 });

  // A real backend session (JWT) is needed to edit the profile.
  const isAuthed = !!localStorage.getItem('token');

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
  }, [user]);

  useEffect(() => {
    if (!isAuthed) return;
    let alive = true;
    orderService.getMyOrders({ size: 50 }).then((res) => {
      if (!alive) return;
      const orders = res?.data?.content ?? [];
      const bookIds = new Set();
      orders.forEach((o) => (o.items || []).forEach((it) => bookIds.add(it.bookId)));
      setStats({ orders: orders.length, books: bookIds.size });
    }).catch(() => {});
    return () => { alive = false; };
  }, [isAuthed]);

  if (!user) return null; // ProtectedRoute handles the redirect

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter your name.');
    setSaving(true);
    try {
      await dispatch(updateProfile({ name, phone })).unwrap();
      toast.success('Profile updated ✓');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const statCards = [
    { icon: Package, label: 'Orders', value: stats.orders, bg: 'bg-blue-100', fg: 'text-blue' },
    { icon: BookOpen, label: 'Books owned', value: stats.books, bg: 'bg-primary-100', fg: 'text-primary' },
  ];

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>My Profile - KidsColour</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-14">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full object-cover shadow-soft" />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-display shadow-soft shrink-0"
                style={{ background: 'linear-gradient(135deg, #FF6B6B, #9B5DE5)' }}
              >
                {initialsOf(user.name)}
              </div>
            )}
            <div>
              <h1 className="text-4xl mb-1">{user.name}</h1>
              <p className="text-gray-500">{user.email}</p>
              <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1 ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple' : 'bg-green-100 text-green-dark'}`}>
                  <Shield size={12} /> {user.role || 'CUSTOMER'}
                </span>
                {user.provider && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                    {user.provider === 'GOOGLE' ? 'Google account' : 'Email account'}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Details form */}
          <motion.form
            onSubmit={handleSave}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 card p-8 space-y-5"
          >
            <h2 className="text-2xl">Account details</h2>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input value={name} onChange={(e) => setName(e.target.value)} disabled={!isAuthed} className="input-field pl-10 disabled:opacity-60" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input value={user.email || ''} disabled className="input-field pl-10 opacity-60 cursor-not-allowed" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email can't be changed.</p>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!isAuthed} className="input-field pl-10 disabled:opacity-60" placeholder="Add a phone number" />
              </div>
            </div>

            {isAuthed ? (
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                <Save size={18} /> {saving ? 'Saving…' : 'Save changes'}
              </button>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
                You're in the offline demo session — log in with a real account to edit your profile.
              </p>
            )}
          </motion.form>

          {/* Side: stats + actions */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {statCards.map((s) => (
                <div key={s.label} className="card p-5">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.fg} flex items-center justify-center mb-3`}>
                    <s.icon size={20} />
                  </div>
                  <div className="text-3xl font-display text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-500 font-bold">{s.label}</div>
                </div>
              ))}
            </div>

            <Link to="/my-downloads" className="card p-5 flex items-center gap-3 hover:shadow-soft transition-shadow">
              <Download className="text-primary" size={22} />
              <div>
                <div className="font-bold text-gray-900">My Downloads</div>
                <div className="text-xs text-gray-500">Your purchased books</div>
              </div>
            </Link>

            {user.role === 'ADMIN' && (
              <Link to="/admin" className="card p-5 flex items-center gap-3 hover:shadow-soft transition-shadow">
                <Shield className="text-purple" size={22} />
                <div>
                  <div className="font-bold text-gray-900">Admin Panel</div>
                  <div className="text-xs text-gray-500">Manage books &amp; orders</div>
                </div>
              </Link>
            )}

            <button onClick={handleLogout} className="w-full card p-5 flex items-center gap-3 text-red-500 font-bold hover:bg-red-50 transition-colors">
              <LogOut size={20} /> Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
