import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { removeItem, clearItems } from '../store/slices/cartSlice';

const Cart = () => {
  const { items, subtotal } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const handleRemove = (item) => {
    dispatch(removeItem(item.id));
    toast(`${item.name} removed`, { icon: '🗑️' });
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <Helmet><title>Your Cart - KidsColour</title></Helmet>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-8xl mb-6 animate-float">🛒</motion.div>
        <h1 className="text-4xl mb-3">Your cart is empty</h1>
        <p className="text-gray-500 mb-8">Let's find some fun colouring books to fill it up!</p>
        <Link to="/books" className="btn-primary text-lg">Browse Books</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen container mx-auto px-4 py-12">
      <Helmet><title>{`Your Cart (${items.length}) - KidsColour`}</title></Helmet>
      <h1 className="text-4xl mb-8 flex items-center gap-3"><ShoppingBag /> Your Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40 }}
                className="card p-4 flex items-center gap-4"
              >
                <img
                  src={item.coverImageUrl}
                  onError={(e) => { if (item.fallbackCover) e.currentTarget.src = item.fallbackCover; }}
                  alt={item.name}
                  className="w-20 h-24 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-grow">
                  <Link to={`/books/${item.slug}`} className="text-lg font-bold hover:text-primary">{item.name}</Link>
                  <p className="text-sm text-gray-400">Digital PDF · Instant download</p>
                </div>
                <span className="text-xl font-display text-gray-900">₹{item.price}</span>
                <button onClick={() => handleRemove(item)} className="text-gray-300 hover:text-red-500 transition-colors p-2">
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <button onClick={() => dispatch(clearItems())} className="text-sm text-gray-400 hover:text-red-500 font-bold">
            Clear cart
          </button>
        </div>

        {/* Summary */}
        <motion.div layout className="card p-6 sticky top-24">
          <h2 className="text-2xl mb-6">Order Summary</h2>
          <div className="space-y-3 mb-6 text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal ({items.length} item{items.length !== 1 && 's'})</span>
              <span className="font-bold text-gray-900">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="font-bold text-green-dark">FREE · digital</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between text-lg">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-display text-2xl text-primary">₹{subtotal}</span>
            </div>
          </div>
          <Link to="/checkout" className="btn-primary w-full flex items-center justify-center gap-2">
            Checkout <ArrowRight size={20} />
          </Link>
          <Link to="/books" className="block text-center text-sm text-gray-400 hover:text-primary font-bold mt-4">
            Continue shopping
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Cart;
