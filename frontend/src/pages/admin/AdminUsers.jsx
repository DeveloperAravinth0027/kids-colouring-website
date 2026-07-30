import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Plus, X, Users, Shield, KeyRound, Trash2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import userService from '../../services/userService';
import Loader from '../../components/common/Loader';

const emptyForm = { name: '', email: '', password: '', phone: '', role: 'CUSTOMER' };

const initialsOf = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

const AdminUsers = () => {
  const me = useSelector((s) => s.auth.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [pwUser, setPwUser] = useState(null);
  const [newPw, setNewPw] = useState('');

  const load = async () => {
    try { setUsers(await userService.adminList()); }
    catch { toast.error('Could not load users.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    setBusy(true);
    try {
      await userService.adminCreate(form);
      await load();
      toast.success(`${form.name} can now log in with ${form.email} 🎉`);
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not create the user.');
    } finally { setBusy(false); }
  };

  const changeRole = async (u, role) => {
    try {
      await userService.adminSetRole(u.id, role);
      setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, role } : x)));
      toast.success(`${u.name} is now ${role}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not change the role.');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (newPw.length < 6) return toast.error('Password must be at least 6 characters.');
    setBusy(true);
    try {
      await userService.adminSetPassword(pwUser.id, newPw);
      toast.success(`New password set for ${pwUser.name}`);
      setPwUser(null); setNewPw('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not set the password.');
    } finally { setBusy(false); }
  };

  const remove = async (u) => {
    if (u.email === me?.email) return toast.error("You can't delete your own account.");
    if (!window.confirm(`Delete ${u.name} (${u.email})?`)) return;
    try {
      await userService.adminDelete(u.id);
      setUsers((us) => us.filter((x) => x.id !== u.id));
      toast(`${u.name} removed`, { icon: '🗑️' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete (they may have orders).');
    }
  };

  if (loading) return <Loader />;

  const admins = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <div>
      <Helmet><title>Manage Users - KidsColour Admin</title></Helmet>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl mb-1">Users</h1>
          <p className="text-gray-500">{users.length} account{users.length !== 1 && 's'} · {admins} admin{admins !== 1 && 's'}</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> Add User
        </button>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-light bg-blue-100/50 p-4">
        <Info className="text-blue shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-gray-700">
          <strong>Passwords can't be displayed.</strong> They're stored as one-way encrypted hashes, so nobody —
          not even an admin — can read an existing password. You can set a <em>new</em> one with the key button.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <th className="p-4">User</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Sign-in</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: u.role === 'ADMIN' ? 'linear-gradient(135deg,#9B5DE5,#4D96FF)' : 'linear-gradient(135deg,#FF6B6B,#FF9F43)' }}>
                        {initialsOf(u.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate">
                          {u.name} {u.email === me?.email && <span className="text-[10px] text-gray-400">(you)</span>}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">{u.phone || '—'}</td>
                  <td className="p-4">
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                      {u.provider === 'GOOGLE' ? 'Google' : 'Email'}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value)}
                      className={`text-[11px] font-extrabold px-2 py-1.5 rounded-full border-0 cursor-pointer ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple' : 'bg-green-100 text-green-dark'
                      }`}
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setPwUser(u); setNewPw(''); }} title="Set a new password"
                        className="p-2 rounded-lg text-gray-400 hover:text-blue hover:bg-blue-100">
                        <KeyRound size={16} />
                      </button>
                      <button onClick={() => remove(u)} title="Delete user"
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-2 text-gray-300" />
            <p className="font-bold">No users yet</p>
          </div>
        )}
      </div>

      {/* Add user modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)}>
            <motion.form onClick={(e) => e.stopPropagation()} onSubmit={create}
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-float w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl">Add a User</h2>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Full name *</label>
                  <input required value={form.name} onChange={set('name')} className="input-field" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email (their username) *</label>
                  <input required type="email" value={form.email} onChange={set('email')} className="input-field" placeholder="jane@example.com" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Password *</label>
                  <input required type="text" value={form.password} onChange={set('password')} className="input-field font-mono" placeholder="At least 6 characters" />
                  <p className="text-xs text-gray-400 mt-1">Shown here so you can copy it — you won't be able to read it again afterwards.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Phone</label>
                    <input value={form.phone} onChange={set('phone')} className="input-field" placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Role</label>
                    <select value={form.role} onChange={set('role')} className="input-field">
                      <option value="CUSTOMER">👤 Customer</option>
                      <option value="ADMIN">🛡️ Admin</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={busy} className="btn-primary flex-1 disabled:opacity-60">
                  {busy ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set password modal */}
      <AnimatePresence>
        {pwUser && (
          <motion.div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPwUser(null)}>
            <motion.form onClick={(e) => e.stopPropagation()} onSubmit={savePassword}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-float w-full max-w-sm p-6">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="text-blue" size={20} />
                <h2 className="text-xl">Set a new password</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">For <strong>{pwUser.name}</strong> ({pwUser.email})</p>
              <input autoFocus type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                className="input-field font-mono" placeholder="At least 6 characters" />
              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setPwUser(null)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={busy} className="btn-primary flex-1 disabled:opacity-60">
                  {busy ? 'Saving…' : 'Set password'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
