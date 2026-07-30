import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import BookCard from '../components/books/BookCard';
import NotFound from './NotFound';

const CategoryDetails = () => {
  const { slug } = useParams();
  const category = useSelector((s) => s.catalog.categories.find((c) => c.slug === slug)) || null;
  const list = useSelector((s) => s.catalog.books.filter((b) => b.categorySlug === slug));

  if (!category) return <NotFound />;

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{`${category.name} Colouring Books — KidsColour`}</title>
        <meta name="description" content={`${category.description || `${category.name} colouring books for kids.`} Instant printable PDF download.`} />
        <link rel="canonical" href={`https://www.kidscolour.com/categories/${category.slug}`} />
      </Helmet>

      <section
        className="py-16 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${category.colors[0]}, ${category.colors[1]})` }}
      >
        <div className="absolute -top-10 -right-10 text-[12rem] opacity-20 select-none">{category.emoji}</div>
        <div className="container mx-auto px-4 relative z-10">
          <Link to="/categories" className="inline-flex items-center gap-2 text-white/90 hover:text-white font-bold mb-4">
            <ArrowLeft size={18} /> All categories
          </Link>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl text-white mb-2">
            {category.emoji} {category.name}
          </motion.h1>
          <p className="text-white/90 text-lg">{category.description}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {list.map((book, i) => <BookCard key={book.id} book={book} index={i} />)}
        </div>
      </div>
    </div>
  );
};

export default CategoryDetails;
