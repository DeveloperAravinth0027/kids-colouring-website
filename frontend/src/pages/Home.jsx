import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Palette, Download, Sparkles, ArrowRight } from 'lucide-react';
import BookCard from '../components/books/BookCard';

const floatEmojis = [
  { e: '🎨', top: '18%', left: '8%', d: 0 },
  { e: '🖍️', top: '30%', left: '86%', d: 0.6 },
  { e: '🦄', top: '62%', left: '12%', d: 1.2 },
  { e: '🚀', top: '70%', left: '82%', d: 0.3 },
  { e: '⭐', top: '12%', left: '70%', d: 0.9 },
  { e: '🌈', top: '78%', left: '48%', d: 1.5 },
];

const Home = () => {
  const books = useSelector((s) => s.catalog.books);
  const categories = useSelector((s) => s.catalog.categories);
  const featuredBooks = books.filter((b) => b.featured);
  const featured = (featuredBooks.length ? featuredBooks : books).slice(0, 8);

  return (
    <>
      <Helmet>
        <title>KidsColour — Premium Digital Colouring Books for Kids</title>
        <meta name="description" content="Premium, printable digital colouring books for kids — animals, space, dinosaurs, unicorns and more. Instant PDF download, print unlimited at home." />
        <link rel="canonical" href="https://www.kidscolour.com/" />
      </Helmet>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-purple-50/40 to-white pt-20 pb-32">
        <div className="absolute top-0 -left-64 w-96 h-96 bg-primary-light/20 blob-shape" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-light/20 blob-shape" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 right-32 w-80 h-80 bg-secondary-light/20 blob-shape" style={{ animationDelay: '4s' }} />

        {/* Floating emojis */}
        {floatEmojis.map((f, i) => (
          <motion.span
            key={i}
            className="absolute text-4xl md:text-5xl select-none pointer-events-none hidden sm:block"
            style={{ top: f.top, left: f.left }}
            animate={{ y: [0, -18, 0], rotate: [-6, 6, -6] }}
            transition={{ duration: 4 + f.d, repeat: Infinity, ease: 'easeInOut', delay: f.d }}
          >
            {f.e}
          </motion.span>
        ))}

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              className="inline-block glass-panel px-4 py-2 rounded-full text-sm font-bold text-primary mb-6"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎉 Over 10,000 happy little artists!
            </motion.span>
            <h1 className="text-5xl md:text-7xl mb-6 leading-tight">
              Spark <span className="gradient-text">Creativity</span> with<br />Digital Colouring
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Premium, beautifully illustrated colouring books for kids. Download instantly, print at home, and let the fun begin!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/story-books" className="btn-blue text-lg">📖 Story Books</Link>
              <Link to="/colouring-books" className="btn-primary text-lg">🎨 Colouring Books</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== The two product lines ===== */}
      <section className="py-16 bg-white relative z-20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6">
          {[
            {
              to: '/story-books', emoji: '📖', title: 'Story Books',
              copy: 'Buy once and read every page online — magical stories, anytime, on any device.',
              cta: 'Start reading', bg: 'linear-gradient(135deg, #4D96FF, #6BCB77)',
            },
            {
              to: '/colouring-books', emoji: '🎨', title: 'Colouring Books',
              copy: 'Paint straight on the page in our colouring studio, or print it out at home.',
              cta: 'Start colouring', bg: 'linear-gradient(135deg, #9B5DE5, #FF6B6B)',
            },
          ].map((c, i) => (
            <motion.div
              key={c.to}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
            >
              <Link
                to={c.to}
                className="block rounded-3xl p-8 h-full text-white shadow-soft hover:shadow-float transition-shadow relative overflow-hidden"
                style={{ background: c.bg }}
              >
                <div className="absolute -bottom-8 -right-4 text-9xl opacity-20 select-none">{c.emoji}</div>
                <div className="relative z-10">
                  <div className="text-5xl mb-3">{c.emoji}</div>
                  <h2 className="text-3xl text-white mb-2">{c.title}</h2>
                  <p className="text-white/90 mb-6 max-w-sm">{c.copy}</p>
                  <span className="inline-flex items-center gap-2 bg-white/95 text-gray-900 font-bold px-5 py-2.5 rounded-xl">
                    {c.cta} <ArrowRight size={18} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== Categories strip ===== */}
      <section className="py-16 bg-white relative z-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl text-center text-gray-900 mb-10">Pick a Fun Theme</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -6, rotate: -3 }}
              >
                <Link to={`/categories/${c.slug}`} className="flex flex-col items-center gap-2 group">
                  <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-soft group-hover:shadow-float transition-shadow"
                    style={{ background: `linear-gradient(135deg, ${c.colors[0]}, ${c.colors[1]})` }}
                  >
                    {c.emoji}
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-primary">{c.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="py-20 bg-gradient-to-b from-white to-blue-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-4xl text-gray-900 mb-4">Why Parents Love KidsColour</h2>
            <p className="text-lg text-gray-600">Designed with kids' creativity and parents' convenience in mind.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Download, bg: 'bg-blue-100', fg: 'text-blue', title: 'Instant Access', text: 'Download your PDF instantly after purchase. No waiting for shipping.' },
              { icon: Palette, bg: 'bg-primary-100', fg: 'text-primary', title: 'Print Unlimited', text: 'Mistakes happen! Print favourite pages as many times as you like.' },
              { icon: Sparkles, bg: 'bg-purple-100', fg: 'text-purple', title: 'Premium Art', text: 'High-resolution, custom illustrations designed by professional artists.' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-8 text-center flex flex-col items-center group hover:-translate-y-2 transition-transform"
              >
                <div className={`w-20 h-20 rounded-full ${f.bg} flex items-center justify-center ${f.fg} mb-6 group-hover:scale-110 transition-transform`}>
                  <f.icon size={40} />
                </div>
                <h3 className="text-2xl mb-3">{f.title}</h3>
                <p className="text-gray-600">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Featured books ===== */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl text-gray-900 mb-2">Featured Books</h2>
              <p className="text-gray-600">Our most popular collections</p>
            </div>
            <Link to="/books" className="text-primary font-bold hover:underline hidden sm:flex items-center gap-1">
              View All Books <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((book, i) => (
              <BookCard key={book.id} book={book} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl text-center py-16 px-6 text-white shadow-float"
            style={{ background: 'linear-gradient(135deg, #FF6B6B, #9B5DE5)' }}
          >
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 blob-shape" />
            <div className="absolute -bottom-12 -right-8 w-48 h-48 bg-white/10 blob-shape" style={{ animationDelay: '3s' }} />
            <h2 className="text-4xl md:text-5xl text-white mb-4 relative z-10">Ready to start colouring? 🖍️</h2>
            <p className="text-lg text-white/90 mb-8 relative z-10">Join thousands of families making screen-free memories.</p>
            <Link to="/books" className="relative z-10 inline-block bg-white text-primary font-bold py-4 px-8 rounded-xl shadow-soft hover:-translate-y-1 hover:shadow-float transition-all">
              Shop the Collection
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Home;
