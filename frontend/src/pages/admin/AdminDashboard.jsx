import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { BookOpen, Tags, Star, IndianRupee, Plus, ArrowRight } from 'lucide-react';

const AdminDashboard = () => {
  const books = useSelector((s) => s.catalog.books);
  const categories = useSelector((s) => s.catalog.categories);
  const { user } = useSelector((s) => s.auth);

  const featuredCount = books.filter((b) => b.featured).length;
  const avgPrice = books.length
    ? Math.round(books.reduce((sum, b) => sum + b.finalPrice, 0) / books.length)
    : 0;

  const stats = [
    { label: 'Total Books', value: books.length, icon: BookOpen, bg: 'bg-primary-100', fg: 'text-primary' },
    { label: 'Categories', value: categories.length, icon: Tags, bg: 'bg-blue-100', fg: 'text-blue' },
    { label: 'Featured', value: featuredCount, icon: Star, bg: 'bg-secondary-light/40', fg: 'text-secondary-dark' },
    { label: 'Avg. Price', value: `₹${avgPrice}`, icon: IndianRupee, bg: 'bg-green-100', fg: 'text-green-dark' },
  ];

  const recent = books.slice(0, 6);

  return (
    <div>
      <Helmet><title>Dashboard - KidsColour Admin</title></Helmet>

      <div className="mb-8">
        <h1 className="text-3xl mb-1">Welcome back, {user?.name || 'Admin'} 👋</h1>
        <p className="text-gray-500">Here's what's happening in your store.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
          >
            <div className={`w-12 h-12 rounded-xl ${s.bg} ${s.fg} flex items-center justify-center mb-4`}>
              <s.icon size={24} />
            </div>
            <div className="text-3xl font-display text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 font-bold">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick action */}
      <div className="grid md:grid-cols-2 gap-5 mb-10">
        <Link to="/admin/books" className="rounded-2xl p-6 text-white shadow-soft hover:shadow-float transition-shadow flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #FF6B6B, #9B5DE5)' }}>
          <div>
            <div className="text-xl font-display">Add a New Book</div>
            <div className="text-white/90 text-sm">Create a colouring book in seconds</div>
          </div>
          <Plus size={32} />
        </Link>
        <Link to="/admin/books" className="rounded-2xl p-6 bg-white border border-gray-100 shadow-sm hover:shadow-soft transition-shadow flex items-center justify-between">
          <div>
            <div className="text-xl font-display text-gray-900">Manage Books</div>
            <div className="text-gray-500 text-sm">Edit or remove existing books</div>
          </div>
          <ArrowRight size={28} className="text-primary" />
        </Link>
      </div>

      {/* Recent books */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl">Recent Books</h2>
        <Link to="/admin/books" className="text-primary font-bold hover:underline flex items-center gap-1">
          View all <ArrowRight size={16} />
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {recent.map((b) => (
          <div key={b.id} className="flex items-center gap-4 p-4">
            <img
              src={b.coverImageUrl}
              onError={(e) => { e.currentTarget.src = b.fallbackCover; }}
              alt={b.name}
              className="w-12 h-14 object-cover rounded-lg"
            />
            <div className="flex-grow min-w-0">
              <div className="font-bold text-gray-900 truncate">{b.name}</div>
              <div className="text-sm text-gray-400">{b.categoryEmoji} {b.categoryName}</div>
            </div>
            <div className="font-display text-primary">₹{b.finalPrice}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
