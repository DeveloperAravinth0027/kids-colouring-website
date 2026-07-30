import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, X, Ticket, Copy, CheckCircle2, Percent, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import couponService from '../../services/couponService';
import Loader from '../../components/common/Loader';

// datetime-local wants "YYYY-MM-DDTHH:mm"
const toLocalInput = (d) => {
  const dt = d ? new Date(d) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};
const fmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—');

const emptyForm = () => ({
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: '',
  minOrderAmount: '0',
  maxDiscountAmount: '',
  maxUses: '',
  isActive: true,
  validFrom: toLocalInput(),
  validUntil: '',
});

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await couponService.adminList({ size: 100 });
      setCoupons(res?.content ?? []);
    } catch {
      toast.error('Could not load coupons.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const openAdd = () => { setForm(emptyForm()); setEditingId(null); setShowForm(true); };
  const openEdit = (c) => {
    setForm({
      code: c.code || '',
      description: c.description || '',
      discountType: c.discountType || 'PERCENT',
      discountValue: String(c.discountValue ?? ''),
      minOrderAmount: String(c.minOrderAmount ?? '0'),
      maxDiscountAmount: c.maxDiscountAmount != null ? String(c.maxDiscountAmount) : '',
      maxUses: c.maxUses != null ? String(c.maxUses) : '',
      isActive: c.isActive !== false,
      validFrom: toLocalInput(c.validFrom),
      validUntil: c.validUntil ? toLocalInput(c.validUntil) : '',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const payload = () => ({
    code: form.code.trim().toUpperCase(),
    description: form.description?.trim() || null,
    discountType: form.discountType,
    discountValue: Number(form.discountValue) || 0,
    minOrderAmount: Number(form.minOrderAmount) || 0,
    maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
    maxUses: form.maxUses ? Number(form.maxUses) : null,
    isActive: !!form.isActive,
    validFrom: form.validFrom ? `${form.validFrom}:00` : `${toLocalInput()}:00`,
    validUntil: form.validUntil ? `${form.validUntil}:00` : null,
  });

  const save = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error('Please enter a coupon code.');
    if (!form.discountValue || Number(form.discountValue) <= 0) return toast.error('Enter a discount value.');
    if (form.discountType === 'PERCENT' && Number(form.discountValue) > 100) {
      return toast.error('A percentage discount cannot exceed 100%.');
    }
    setBusy(true);
    try {
      if (editingId) await couponService.adminUpdate(editingId, payload());
      else await couponService.adminCreate(payload());
      await load();
      toast.success(editingId ? 'Coupon updated!' : `Coupon ${form.code.toUpperCase()} created! 🎟️`);
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save the coupon.');
    } finally { setBusy(false); }
  };

  const toggleActive = async (c) => {
    try {
      await couponService.adminUpdate(c.id, {
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount ?? 0,
        maxDiscountAmount: c.maxDiscountAmount,
        maxUses: c.maxUses,
        isActive: !c.isActive,
        validFrom: c.validFrom ? `${toLocalInput(c.validFrom)}:00` : `${toLocalInput()}:00`,
        validUntil: c.validUntil ? `${toLocalInput(c.validUntil)}:00` : null,
      });
      setCoupons((cs) => cs.map((x) => (x.id === c.id ? { ...x, isActive: !x.isActive } : x)));
      toast.success(`${c.code} ${!c.isActive ? 'activated' : 'paused'}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update the coupon.');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    toast.success(`${code} copied`);
  };

  if (loading) return <Loader />;

  const active = coupons.filter((c) => c.isActive).length;
  const totalUses = coupons.reduce((s, c) => s + (c.usedCount || 0), 0);
  const stats = [
    { icon: Ticket, label: 'Coupons', value: coupons.length, bg: 'bg-primary-100', fg: 'text-primary' },
    { icon: CheckCircle2, label: 'Active', value: active, bg: 'bg-green-100', fg: 'text-green-dark' },
    { icon: Percent, label: 'Times used', value: totalUses, bg: 'bg-blue-100', fg: 'text-blue' },
  ];

  return (
    <div>
      <Helmet><title>Manage Coupons - KidsColour Admin</title></Helmet>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl mb-1">Coupons</h1>
          <p className="text-gray-500">Discount codes customers enter at checkout</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> Add Coupon
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className={`w-11 h-11 rounded-xl ${s.bg} ${s.fg} flex items-center justify-center mb-3`}><s.icon size={20} /></div>
            <div className="text-2xl font-display text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 font-bold">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <Ticket size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-bold mb-2">No coupons yet</p>
          <button onClick={openAdd} className="text-primary font-bold">Create your first coupon →</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <th className="p-4">Code</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Min order</th>
                  <th className="p-4">Used</th>
                  <th className="p-4">Valid</th>
                  <th className="p-4">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4">
                      <button onClick={() => copyCode(c.code)} className="font-mono font-extrabold text-gray-900 flex items-center gap-1.5 hover:text-primary group">
                        {c.code} <Copy size={12} className="opacity-0 group-hover:opacity-100" />
                      </button>
                      <div className="text-xs text-gray-400 truncate max-w-[180px]">{c.description || '—'}</div>
                    </td>
                    <td className="p-4 font-bold text-primary">
                      {c.discountType === 'PERCENT' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                      {c.maxDiscountAmount && <span className="block text-[10px] font-normal text-gray-400">max ₹{c.maxDiscountAmount}</span>}
                    </td>
                    <td className="p-4 text-gray-500">{Number(c.minOrderAmount) > 0 ? `₹${c.minOrderAmount}` : '—'}</td>
                    <td className="p-4 text-gray-500">
                      {c.usedCount || 0}{c.maxUses ? ` / ${c.maxUses}` : ''}
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {fmt(c.validFrom)} → {c.validUntil ? fmt(c.validUntil) : 'no end'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`text-[11px] font-extrabold px-3 py-1.5 rounded-full ${
                          c.isActive ? 'bg-green-100 text-green-dark' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {c.isActive ? 'ACTIVE' : 'PAUSED'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-gray-400 hover:text-blue hover:bg-blue-100" title="Edit">
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)}>
            <motion.form onClick={(e) => e.stopPropagation()} onSubmit={save}
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-float w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl">{editingId ? 'Edit Coupon' : 'Add Coupon'}</h2>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700"><X size={24} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Code *</label>
                  <input value={form.code} onChange={set('code')} className="input-field font-mono uppercase" placeholder="SUMMER20" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Description</label>
                  <input value={form.description} onChange={set('description')} className="input-field" placeholder="Summer sale — 20% off" />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Discount type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setForm((f) => ({ ...f, discountType: 'PERCENT' }))}
                      className={`py-2.5 rounded-xl font-bold text-sm border-2 flex items-center justify-center gap-1.5 ${form.discountType === 'PERCENT' ? 'border-primary bg-primary-100 text-primary' : 'border-gray-200 text-gray-500'}`}>
                      <Percent size={15} /> Percentage
                    </button>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, discountType: 'FLAT' }))}
                      className={`py-2.5 rounded-xl font-bold text-sm border-2 flex items-center justify-center gap-1.5 ${form.discountType === 'FLAT' ? 'border-blue bg-blue-100 text-blue' : 'border-gray-200 text-gray-500'}`}>
                      <IndianRupee size={15} /> Flat amount
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      {form.discountType === 'PERCENT' ? 'Percent off *' : 'Amount off (₹) *'}
                    </label>
                    <input type="number" min="0" value={form.discountValue} onChange={set('discountValue')} className="input-field"
                      placeholder={form.discountType === 'PERCENT' ? '20' : '50'} />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Max discount (₹) {form.discountType === 'FLAT' && <span className="text-gray-400 font-normal">n/a</span>}
                    </label>
                    <input type="number" min="0" value={form.maxDiscountAmount} onChange={set('maxDiscountAmount')}
                      disabled={form.discountType === 'FLAT'} className="input-field disabled:opacity-50" placeholder="Optional cap" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Min order (₹)</label>
                    <input type="number" min="0" value={form.minOrderAmount} onChange={set('minOrderAmount')} className="input-field" placeholder="0" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Max uses</label>
                    <input type="number" min="0" value={form.maxUses} onChange={set('maxUses')} className="input-field" placeholder="Unlimited" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Valid from *</label>
                    <input type="datetime-local" value={form.validFrom} onChange={set('validFrom')} className="input-field" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Valid until</label>
                    <input type="datetime-local" value={form.validUntil} onChange={set('validUntil')} className="input-field" />
                  </div>
                </div>

                <label className="flex items-center gap-2 font-bold text-gray-700">
                  <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="w-5 h-5 accent-primary" />
                  Active (customers can use it now)
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={busy} className="btn-primary flex-1 disabled:opacity-60">
                  {busy ? 'Saving…' : editingId ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCoupons;
