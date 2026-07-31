import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Star, Download, Printer, FileText, Check, ShoppingCart, ArrowLeft, Pencil, Palette, BookOpen, Package, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { addItem } from '../store/slices/cartSlice';
import BookCard from '../components/books/BookCard';
import NotFound from './NotFound';

const BookDetails = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const books = useSelector((s) => s.catalog.books);
  const isAdmin = useSelector((s) => s.auth.user?.role === 'ADMIN');
  const book = books.find((b) => b.slug === slug) || null;
  const related = book
    ? books.filter((b) => b.categorySlug === book.categorySlug && b.slug !== book.slug).slice(0, 4)
    : [];

  if (!book) return <NotFound />;

  // A cart belongs to an account, so buying requires signing in first.
  const requireLogin = () => {
    if (localStorage.getItem('token')) return false;
    toast('Please log in to add books to your cart.', { icon: '🔐' });
    navigate(`/login?next=/books/${book.slug}`);
    return true;
  };

  const handleAdd = () => {
    if (requireLogin()) return;
    dispatch(addItem(book));
    toast.success(`${book.name} added to cart! ${book.emoji}`);
  };
  const handleBuy = () => {
    if (requireLogin()) return;
    dispatch(addItem(book));
    navigate('/cart');
  };

  const perks = [
    { icon: Download, text: 'Instant PDF download' },
    { icon: Printer, text: 'Print as many times as you like' },
    { icon: FileText, text: book.pages > 0 ? `${book.pages} high-resolution pages` : 'High-resolution printable pages' },
  ];

  // TODO: replace with your production domain
  const SITE = 'https://www.kidscolour.com';
  const url = `${SITE}/books/${book.slug}`;
  const metaDesc = (book.description || `${book.name} — a premium printable colouring book for kids.`).slice(0, 160);

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: book.name,
    description: metaDesc,
    image: book.coverImageUrl,
    category: book.categoryName,
    brand: { '@type': 'Brand', name: 'KidsColour' },
    offers: {
      '@type': 'Offer',
      url,
      price: String(book.finalPrice),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
    ...(book.reviews > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(book.rating),
        reviewCount: String(book.reviews),
      },
    }),
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{`${book.name} — KidsColour`}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={`${book.name} — KidsColour`} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={book.coverImageUrl} />
        <meta property="og:url" content={url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={book.coverImageUrl} />
        <script type="application/ld+json">{JSON.stringify(productLd)}</script>
      </Helmet>

      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to="/books" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary font-bold">
            <ArrowLeft size={18} /> Back to books
          </Link>
          {isAdmin && (
            <Link
              to={`/admin/books?edit=${book.id}`}
              className="inline-flex items-center gap-2 bg-blue text-white font-bold text-sm py-2 px-4 rounded-xl shadow-soft hover:bg-blue-dark transition-colors"
            >
              <Pencil size={16} /> Edit book
            </Link>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Cover */}
          <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="absolute -inset-4 blob-shape opacity-30" style={{ background: `linear-gradient(135deg, ${book.colors[0]}, ${book.colors[1]})` }} />
            <img
              src={book.coverImageUrl}
              onError={(e) => { e.currentTarget.src = book.fallbackCover; }}
              alt={book.name}
              className="relative w-full rounded-3xl shadow-float object-cover aspect-[5/6]"
            />
            {book.bestseller && (
              <span className="absolute -top-3 -right-3 bg-secondary text-gray-900 font-extrabold px-4 py-2 rounded-full shadow-float animate-wiggle">
                ⭐ Bestseller
              </span>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
            <Link to={`/categories/${book.categorySlug}`} className="inline-block glass-panel px-3 py-1 rounded-full text-sm font-bold text-primary mb-4">
              {book.categoryEmoji} {book.categoryName}
            </Link>
            <h1 className="text-4xl md:text-5xl mb-4">{book.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1 text-secondary-dark">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill={i < Math.round(book.rating) ? 'currentColor' : 'none'} />
                ))}
                <span className="text-gray-700 font-bold ml-1">{book.rating}</span>
              </div>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500 font-bold">{book.reviews} reviews</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500 font-bold">Age {book.ageRange}</span>
            </div>

            <p className="text-lg text-gray-600 mb-6">{book.description}</p>

            <div className="flex items-baseline gap-3 mb-6">
              {book.isFree ? (
                <span className="text-4xl font-display text-green-dark">Free</span>
              ) : (
                <>
                  <span className="text-4xl font-display text-gray-900">₹{book.finalPrice}</span>
                  {book.discount > 0 && (
                    <>
                      <span className="text-xl text-gray-400 line-through">₹{book.price}</span>
                      <span className="bg-green-100 text-green-dark text-sm font-extrabold px-3 py-1 rounded-full">Save {book.discount}%</span>
                    </>
                  )}
                </>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {perks.map((p, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700 font-bold">
                  <span className="w-8 h-8 rounded-full bg-green-100 text-green-dark flex items-center justify-center">
                    <Check size={18} />
                  </span>
                  {p.text}
                </li>
              ))}
            </ul>

            <Link
              to={(book.bookType === 'STORY' ? '/read/' : '/color/') + book.slug}
              className="mb-4 w-full text-white font-bold py-4 rounded-xl shadow-soft hover:shadow-float hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              style={{
                background: book.bookType === 'STORY'
                  ? 'linear-gradient(135deg, #4D96FF, #6BCB77)'
                  : 'linear-gradient(135deg, #9B5DE5, #4D96FF)',
              }}
            >
              {book.bookType === 'STORY'
                ? <><BookOpen size={20} /> Read Online</>
                : <><Palette size={20} /> Colour Online</>}
              {book.isFree ? ' · Free' : ' · Premium'}
            </Link>

            {/* Free books are opened straight from the button above — no buying. */}
            {!book.isFree && (
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleAdd} className="btn-outline flex items-center justify-center gap-2 flex-1">
                  <ShoppingCart size={20} /> Add to Cart
                </button>
                <button onClick={handleBuy} className="btn-primary flex items-center justify-center gap-2 flex-1">
                  Buy Now
                </button>
              </div>
            )}

            {/* Printed edition on Amazon KDP — only shown once a link is set */}
            {book.amazonKdpLink && (
              <a
                href={book.amazonKdpLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full font-bold py-4 rounded-xl border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <Package size={20} /> Buy Physical Book
                <ExternalLink size={16} className="opacity-60" />
              </a>
            )}
          </motion.div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-24">
            <h2 className="text-3xl mb-8">More {book.categoryName} Books {book.categoryEmoji}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((b, i) => <BookCard key={b.id} book={b} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetails;
