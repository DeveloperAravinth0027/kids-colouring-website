import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { Lock, Mail, User, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { clearItems, removeItem } from '../store/slices/cartSlice';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';

// Razorpay's publishable key. Set VITE_RAZORPAY_KEY_ID in frontend/.env to turn
// on real payments; without it checkout stays in demo mode (order still saved).
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;
const razorpayEnabled = !!RAZORPAY_KEY && !RAZORPAY_KEY.includes('xxx');

const Checkout = () => {
  const { items, subtotal } = useSelector((state) => state.cart);
  const authUser = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [name, setName] = useState(authUser?.name || '');
  const [email, setEmail] = useState(authUser?.email || '');

  // An order must belong to an account, so a real backend session is required.
  const isAuthed = !!localStorage.getItem('token');

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center min-h-[50vh] flex flex-col items-center justify-center">
        <Helmet><title>Checkout - KidsColour</title></Helmet>
        <div className="text-7xl mb-4">🛒</div>
        <h1 className="text-3xl mb-4">Nothing to check out yet</h1>
        <Link to="/books" className="btn-primary">Browse Books</Link>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="container mx-auto px-4 py-24 text-center min-h-[50vh] flex flex-col items-center justify-center">
        <Helmet><title>Checkout - KidsColour</title></Helmet>
        <div className="text-7xl mb-4">🔐</div>
        <h1 className="text-3xl mb-3">Log in to complete your order</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          We save your books to your account so you can download and colour them anytime, on any device.
        </p>
        <div className="flex gap-3">
          <Link to="/login" className="btn-primary flex items-center gap-2"><LogIn size={18} /> Log In</Link>
          <Link to="/register" className="btn-outline">Create Account</Link>
        </div>
      </div>
    );
  }

  const finish = (msg) => {
    dispatch(clearItems());
    toast.success(msg);
    navigate('/payment-success');
  };

  // Load Razorpay's checkout script only when a payment is actually started,
  // so it isn't fetched (with its third-party cookies) on every page load.
  const ensureRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const payWithRazorpay = async (order) => {
    // 1) ask our backend to open a Razorpay order for this purchase
    const rp = (await paymentService.createRazorpayOrder({
      orderId: order.id,
      amount: order.totalAmount,
    })).data;

    // 2) hand off to Razorpay's checkout widget
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY,
      order_id: rp.id,
      amount: rp.amount,
      currency: rp.currency || 'INR',
      name: 'KidsColour',
      description: `Order ${order.orderNumber}`,
      prefill: { name, email },
      theme: { color: '#FF6B6B' },
      // 3) Razorpay hands the signature back — our backend verifies it and
      //    only then marks the order PAID.
      handler: async (r) => {
        try {
          await paymentService.verifyRazorpayPayment({
            razorpayOrderId: r.razorpay_order_id,
            razorpayPaymentId: r.razorpay_payment_id,
            razorpaySignature: r.razorpay_signature,
          });
          finish('Payment successful! 🎉 Your books are in My Downloads.');
        } catch {
          toast.error(`Payment taken but not verified. Quote order ${order.orderNumber} to support.`);
        } finally {
          setProcessing(false);
        }
      },
      modal: {
        ondismiss: () => {
          setProcessing(false);
          toast(`Payment cancelled — order ${order.orderNumber} is saved as pending.`, { icon: '↩️' });
        },
      },
    });
    rzp.on('payment.failed', (resp) => {
      setProcessing(false);
      toast.error(resp?.error?.description || 'Payment failed. Please try again.');
    });
    rzp.open();
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      // Always record the order first, then take payment against it.
      const order = (await orderService.createOrder({
        items: items.map((i) => ({ bookId: i.id, quantity: i.quantity })),
        billingName: name,
        billingEmail: email,
      })).data;

      // Free order (all free books / 100%-off): nothing to pay — the backend
      // already marked it PAID, so just confirm and send them to their books.
      const totalDue = Number(order.totalAmount ?? subtotal);
      if (totalDue > 0 && razorpayEnabled && (await ensureRazorpay())) {
        await payWithRazorpay(order);
        return; // the modal drives the rest
      }

      finish(totalDue > 0
        ? 'Order placed! 🎉 Find your books in My Downloads.'
        : 'Enjoy your free book! 🎉 It’s now in My Downloads.');
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      // A book that only ever existed in this browser (not on the server) can't
      // be ordered — drop it from the cart instead of dead-ending the customer.
      const missing = msg.match(/Book not found with id:\s*(\d+)/i);
      if (missing) {
        dispatch(removeItem(Number(missing[1])));
        toast.error('A book in your cart is no longer available, so we removed it. Please try again.');
      } else {
        toast.error(msg || 'Could not place the order. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen container mx-auto px-4 py-12">
      <Helmet><title>Checkout - KidsColour</title></Helmet>
      <h1 className="text-4xl mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <motion.form
          onSubmit={handlePay}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 card p-8 space-y-5"
        >
          {razorpayEnabled ? (
            <div className="bg-green-100 text-green-dark text-sm font-bold rounded-xl p-3 text-center">
              🔒 Secure payment by Razorpay — test mode uses test cards, no real money.
            </div>
          ) : (
            <div className="bg-secondary-light/30 text-gray-700 text-sm font-bold rounded-xl p-3 text-center">
              🧪 Demo checkout — no card is charged. Your order is still saved to your account.
            </div>
          )}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input required value={name} onChange={(e) => setName(e.target.value)} className="input-field pl-10" placeholder="Little Artist's Parent" />
            </div>
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Email (for your download link)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" />
            </div>
          </div>
          <button type="submit" disabled={processing} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
            <Lock size={18} /> {processing ? 'Processing…' : (subtotal > 0 ? `Pay ₹${subtotal}` : 'Get Free Book')}
          </button>
        </motion.form>

        <motion.div layout className="card p-6 sticky top-24">
          <h2 className="text-2xl mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm gap-3">
                <span className="text-gray-600 truncate">{item.name}</span>
                <span className="font-bold shrink-0">₹{item.price}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between text-lg">
            <span className="font-bold">Total</span>
            <span className="font-display text-2xl text-primary">₹{subtotal}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
