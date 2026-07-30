import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import BookCard from '../components/books/BookCard';

const Books = () => {
  const [active, setActive] = useState('all');
  const books = useSelector((s) => s.catalog.books);
  const categories = useSelector((s) => s.catalog.categories);

  const filtered = active === 'all' ? books : books.filter((b) => b.categorySlug === active);
  const filters = [{ slug: 'all', name: 'All', emoji: '🌈' }, ...categories];

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>All Colouring Books — KidsColour</title>
        <meta name="description" content="Browse all our premium printable colouring books for kids. Filter by theme — animals, ocean, space, dinosaurs, fantasy and vehicles." />
        <link rel="canonical" href="https://www.kidscolour.com/books" />
      </Helmet>

      <section className="bg-gradient-to-b from-purple-50 to-white py-14">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl mb-3"
          >
            Our Colouring Books 🎨
          </motion.h1>
          <p className="text-gray-600 text-lg">Pick your favourite and start creating!</p>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20">
        <div className="flex flex-wrap justify-center gap-3 mb-12">
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

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((book, i) => (
              <BookCard key={book.id} book={book} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-gray-400 mt-10 font-bold">
          Showing {filtered.length} book{filtered.length !== 1 && 's'}
        </p>
      </div>
    </div>
  );
};

export default Books;
