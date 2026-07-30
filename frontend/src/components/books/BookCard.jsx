import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { Star, ShoppingCart, Palette, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { addItem } from '../../store/slices/cartSlice';

const BookCard = ({ book, index = 0 }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // A cart belongs to an account, so buying requires signing in first.
    if (!localStorage.getItem('token')) {
      toast('Please log in to add books to your cart.', { icon: '🔐' });
      navigate(`/login?next=/books/${book.slug}`);
      return;
    }
    dispatch(addItem(book));
    toast.success(`${book.name} added to cart! ${book.emoji}`);
  };

  const isStory = (book.bookType || 'COLOURING') === 'STORY';

  const handleOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(isStory ? `/read/${book.slug}` : `/color/${book.slug}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link to={`/books/${book.slug}`} className="card block h-full">
        <div className="relative overflow-hidden">
          <img
            src={book.coverImageUrl}
            onError={(e) => { e.currentTarget.src = book.fallbackCover; }}
            alt={book.name}
            loading="lazy"
            className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Category chip */}
          <span className="absolute top-3 left-3 glass-panel text-xs font-bold px-3 py-1 rounded-full">
            {book.categoryEmoji} {book.categoryName}
          </span>
          {/* Discount / bestseller badge */}
          {book.discount > 0 && (
            <span className="absolute top-3 right-3 bg-primary text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-soft">
              -{book.discount}%
            </span>
          )}
          {book.isFree ? (
            <span className="absolute bottom-3 left-3 bg-green text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-soft">
              🆓 FREE
            </span>
          ) : book.bestseller && (
            <span className="absolute bottom-3 left-3 bg-secondary text-gray-900 text-xs font-extrabold px-3 py-1 rounded-full shadow-soft animate-bounce-slow">
              ⭐ Bestseller
            </span>
          )}

          {/* Read / Colour — appears on hover */}
          <button
            onClick={handleOpen}
            className={`absolute inset-x-3 bottom-3 sm:opacity-0 sm:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all text-white font-bold py-2 rounded-xl shadow-float flex items-center justify-center gap-2 ${
              isStory ? 'bg-blue hover:bg-blue-dark' : 'bg-purple hover:bg-purple-dark'
            }`}
          >
            {isStory ? <><BookOpen size={16} /> Read Online</> : <><Palette size={16} /> Colour Online</>}
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-1 text-secondary-dark mb-1">
            <Star size={16} fill="currentColor" />
            <span className="text-sm font-bold text-gray-700">{book.rating}</span>
            <span className="text-xs text-gray-500">({book.reviews})</span>
            <span className="ml-auto text-xs font-bold text-gray-500">Age {book.ageRange}</span>
          </div>

          <h3 className="text-xl mb-1 group-hover:text-primary transition-colors">{book.name}</h3>
          <p className="text-sm text-gray-500 mb-4">{book.pages} colouring pages</p>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display text-gray-900">₹{book.finalPrice}</span>
              {book.discount > 0 && (
                <span className="text-sm text-gray-500 line-through">₹{book.price}</span>
              )}
            </div>
            <button
              onClick={handleAdd}
              aria-label={`Add ${book.name} to cart`}
              className="bg-primary text-white rounded-full p-3 shadow-soft hover:bg-primary-dark hover:scale-110 active:scale-95 transition-all"
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default BookCard;
