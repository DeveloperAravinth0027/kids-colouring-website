import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, IndianRupee, CheckCircle2, Clock, ChevronDown, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import orderService from '../../services/orderService';
import Loader from '../../components/common/Loader';

const STATUSES = ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'];

const statusStyle = (s) => {
  switch ((s || '').toUpperCase()) {
    case 'PAID': return 'bg-green-100 text-green-dark';
    case 'PENDING': return 'bg-secondary-light/60 text-gray-700';
    case 'FAILED':
    case 'CANCELLED': return 'bg-red-100 text-red-500';
    case 'REFUNDED': return 'bg-purple-100 text-purple';
    default: return 'bg-gray-100 text-gray-500';
  }
};

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return d; }
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [open, setOpen] = useState(null);
  const [saving, setSaving] = useState(null);

  const load = async () => {
    try {
      const res = await orderService.adminGetAllOrders({ size: 100 });
      setOrders(res?.data?.content ?? []);
    } catch {
      toast.error('Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const changeStatus = async (order, status) => {
    setSaving(order.id);
    try {
      await orderService.adminUpdateOrderStatus(order.id, status);
      setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status } : o)));
      toast.success(`${order.orderNumber} → ${status}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update the status.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <Loader />;

  const shown = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);
  const paid = orders.filter((o) => o.status === 'PAID');
  const revenue = paid.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const stats = [
    { icon: ShoppingBag, label: 'Total orders', value: orders.length, bg: 'bg-blue-100', fg: 'text-blue' },
    { icon: CheckCircle2, label: 'Paid', value: paid.length, bg: 'bg-green-100', fg: 'text-green-dark' },
    { icon: Clock, label: 'Pending', value: orders.filter((o) => o.status === 'PENDING').length, bg: 'bg-secondary-light/50', fg: 'text-secondary-dark' },
    { icon: IndianRupee, label: 'Revenue (paid)', value: `₹${revenue.toFixed(2)}`, bg: 'bg-primary-100', fg: 'text-primary' },
  ];

  return (
    <div>
      <Helmet><title>Manage Orders - KidsColour Admin</title></Helmet>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl mb-1">Orders</h1>
          <p className="text-gray-500">Every purchase across the store</p>
        </div>
        <button onClick={load} className="btn-outline text-sm py-2 px-4 flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
          >
            <div className={`w-11 h-11 rounded-xl ${s.bg} ${s.fg} flex items-center justify-center mb-3`}>
              <s.icon size={20} />
            </div>
            <div className="text-2xl font-display text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 font-bold">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['ALL', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all ${
              filter === s ? 'bg-primary text-white shadow-soft' : 'bg-white border border-gray-200 text-gray-500 hover:border-primary'
            }`}
          >
            {s} {s !== 'ALL' && `(${orders.filter((o) => o.status === s).length})`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <ShoppingBag size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-bold">{orders.length === 0 ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}</p>
          {orders.length === 0 && <p className="text-sm mt-1">Orders appear here as soon as customers check out.</p>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <th className="p-4">Order</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((o) => (
                  <>
                    <tr key={o.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4 font-mono text-xs font-bold text-gray-900">{o.orderNumber}</td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{o.customerName || '—'}</div>
                        <div className="text-xs text-gray-400">{o.customerEmail}</div>
                      </td>
                      <td className="p-4 text-gray-500 text-xs">{fmtDate(o.createdAt)}</td>
                      <td className="p-4 text-gray-500">{o.items?.length || 0}</td>
                      <td className="p-4 font-display text-primary">₹{o.totalAmount}</td>
                      <td className="p-4">
                        <select
                          value={o.status}
                          disabled={saving === o.id}
                          onChange={(e) => changeStatus(o, e.target.value)}
                          className={`text-[11px] font-extrabold px-2 py-1.5 rounded-full border-0 cursor-pointer ${statusStyle(o.status)}`}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setOpen(open === o.id ? null : o.id)}
                          className="text-gray-400 hover:text-primary"
                          aria-label="Toggle items"
                        >
                          <ChevronDown size={18} className={`transition-transform ${open === o.id ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {open === o.id && (
                        <tr key={`${o.id}-details`}>
                          <td colSpan={7} className="p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-gray-50"
                            >
                              <div className="p-4 space-y-2">
                                {(o.items || []).map((it) => (
                                  <div key={it.id} className="flex justify-between text-sm">
                                    <span className="text-gray-700">{it.bookName} × {it.quantity}</span>
                                    <span className="font-bold">₹{it.totalPrice}</span>
                                  </div>
                                ))}
                                {o.couponCode && (
                                  <div className="flex justify-between text-sm text-green-dark">
                                    <span>Coupon {o.couponCode}</span>
                                    <span>−₹{o.discountAmount}</span>
                                  </div>
                                )}
                                {o.payment && (
                                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-200">
                                    Payment: {o.payment.gateway || '—'} · {o.payment.status || '—'}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
