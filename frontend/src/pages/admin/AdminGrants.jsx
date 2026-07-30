import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Gift, Plus, X, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import accessService from '../../services/accessService';
import userService from '../../services/userService';
import Loader from '../../components/common/Loader';

const fmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—');

const AdminGrants = () => {
  const books = useSelector((s) => s.catalog.books);

  const [grants, setGrants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const [userId, setUserId] = useState('');
  const [bookId, setBookId] = useState('');
  const [note, setNote] = useState('');
  const [q, setQ] = useState('');

  const load = async () => {
    try {
      const [g, u] = await Promise.all([accessService.adminList(), userService.adminList()]);
      setGrants(g || []);
      setUsers(u || []);
    } catch {
      toast.error('Could not load free access list.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const give = async (e) => {
    e.preventDefault();
    if (!userId || !bookId) return toast.error('Pick a customer and a book.');
    setBusy(true);
    try {
      await accessService.adminGrant(Number(userId), Number(bookId), note || null);
      await load();
      toast.success('Free access granted 🎁');
      setShowForm(false);
      setUserId(''); setBookId(''); setNote('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not grant access.');
    } finally { setBusy(false); }
  };

  const revoke = async (g) => {
    if (!window.confirm(`Remove ${g.userName}'s free access to "${g.bookName}"?`)) return;
    try {
      await accessService.adminRevoke(g.id);
      setGrants((gs) => gs.filter((x) => x.id !== g.id));
      toast('Free access removed', { icon: '🗑️' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not remove access.');
    }
  };

  if (loading) return <Loader />;

  const shown = q
    ? grants.filter((g) =>
        [g.userName, g.userEmail, g.bookName].some((v) => (v || '').toLowerCase().includes(q.toLowerCase())))
    : grants;

  return (
    <div>
      <Helmet><title>Free Access - KidsColour Admin</title></Helmet>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl mb-1">Free Access</h1>
          <p className="text-gray-500">Give a specific customer a book for free — no payment needed</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> Give a Book
        </button>
      </div>

      {grants.length > 0 && (
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input-field pl-9 py-2 text-sm" placeholder="Search customer or book…" />
        </div>
      )}

      {shown.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <Gift size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-bold mb-2">{grants.length === 0 ? 'No free access given yet' : 'No matches'}</p>
          {grants.length === 0 && (
            <button onClick={() => setShowForm(true)} className="text-primary font-bold">Give your first book →</button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Book</th>
                  <th className="p-4">Note</th>
                  <th className="p-4">Given</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((g) => (
                  <tr key={g.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{g.userName}</div>
                      <div className="text-xs text-gray-400">{g.userEmail}</div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full mr-2 text-white ${g.bookType === 'STORY' ? 'bg-blue' : 'bg-purple'}`}>
                        {g.bookType === 'STORY' ? '📖' : '🎨'}
                      </span>
                      <span className="font-bold text-gray-800">{g.bookName}</span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs max-w-[180px] truncate">{g.note || '—'}</td>
                    <td className="p-4 text-gray-500 text-xs">
                      {fmt(g.createdAt)}
                      {g.grantedBy && <div className="text-[10px] text-gray-400">by {g.grantedBy}</div>}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => revoke(g)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50" title="Remove access">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Give a book modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)}>
            <motion.form onClick={(e) => e.stopPropagation()} onSubmit={give}
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-float w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl flex items-center gap-2"><Gift className="text-primary" size={22} /> Give a Book</h2>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700"><X size={24} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Customer *</label>
                  <select value={userId} onChange={(e) => setUserId(e.target.value)} className="input-field">
                    <option value="">Choose a customer…</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Book *</label>
                  <select value={bookId} onChange={(e) => setBookId(e.target.value)} className="input-field">
                    <option value="">Choose a book…</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bookType === 'STORY' ? '📖' : '🎨'} {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Note <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input value={note} onChange={(e) => setNote(e.target.value)} className="input-field" placeholder="e.g. Competition winner" />
                </div>
                <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                  They'll be able to read/colour and download this book straight away, without paying.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={busy} className="btn-primary flex-1 disabled:opacity-60">
                  {busy ? 'Giving…' : 'Give Free Access'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminGrants;
