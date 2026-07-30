import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import BookCard from '../components/books/BookCard';

/**
 * One of the two product lines. `type` is 'STORY' or 'COLOURING'.
 */
const COPY = {
  STORY: {
    title: 'Story Books',
    emoji: '📖',
    tagline: 'Magical stories to read online, anytime.',
    blurb: 'Buy once, then read every page right here in the browser — no downloads needed.',
    from: 'from-blue-50',
    canonical: 'https://www.kidscolour.com/story-books',
  },
  COLOURING: {
    title: 'Colouring Books',
    emoji: '🎨',
    tagline: 'Bright line art to colour online or print.',
    blurb: 'Paint straight on the page with our colouring studio, or print it at home.',
    from: 'from-purple-50',
    canonical: 'https://www.kidscolour.com/colouring-books',
  },
};

const BooksByType = ({ type }) => {
  const copy = COPY[type];
  const allBooks = useSelector((s) => s.catalog.books);
  const categories = useSelector((s) => s.catalog.categories);
  const [active, setActive] = useState('all');

  const books = allBooks.filter((b) => (b.bookType || 'COLOURING') === type);
  const filtered = active === 'all' ? books : books.filter((b) => b.categorySlug === active);

  // Only offer themes that actually have books in this line.
  const themes = categories.filter((c) => books.some((b) => b.categorySlug === c.slug));
  const filters = [{ slug: 'all', name: 'All', emoji: '🌈' }, ...themes];

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{`${copy.title} — KidsColour`}</title>
        <meta name="description" content={`${copy.tagline} ${copy.blurb}`} />
        <link rel="canonical" href={copy.canonical} />
      </Helmet>

      <section className={`bg-gradient-to-b ${copy.from} to-white py-14`}>
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-6xl mb-3">{copy.emoji}</div>
            <h1 className="text-4xl md:text-5xl mb-3">{copy.title}</h1>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">{copy.blurb}</p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20">
        {themes.length > 1 && (
          <div className="flex flex-wrap justify-center gap-3 my-10">
            {filters.map((f) => (
              <button
                key={f.slug}
                onClick={() => setActive(f.slug)}
                className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                  active === f.slug
                    ? 'bg-primary text-white shadow-soft scale-105'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                }`}
              >
                {f.emoji} {f.name}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">{copy.emoji}</div>
            <p className="text-lg font-bold">No {copy.title.toLowerCase()} here yet</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((book, i) => (
                <BookCard key={book.id} book={book} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <p className="text-center text-gray-400 mt-10 font-bold">
          Showing {filtered.length} book{filtered.length !== 1 && 's'}
        </p>
      </div>
    </div>
  );
};

export default BooksByType;
