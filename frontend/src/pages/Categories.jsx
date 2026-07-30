import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const Categories = () => {
  const categories = useSelector((s) => s.catalog.categories);
  const allBooks = useSelector((s) => s.catalog.books);

  const countFor = (slug) => allBooks.filter((b) => b.categorySlug === slug).length;

  return (
  <div className="min-h-screen">
    <Helmet>
      <title>Colouring Book Categories — KidsColour</title>
      <meta name="description" content="Explore colouring book themes for kids — animals, ocean, space, dinosaurs, fantasy, vehicles and more. Find your child's favourite!" />
      <link rel="canonical" href="https://www.kidscolour.com/categories" />
    </Helmet>

    <section className="bg-gradient-to-b from-secondary-light/30 to-white py-14">
      <div className="container mx-auto px-4 text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl mb-3">
          Explore Themes 🌈
        </motion.h1>
        <p className="text-gray-600 text-lg">Every kid has a favourite — find yours!</p>
      </div>
    </section>

    <div className="container mx-auto px-4 pb-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((c, i) => {
          const count = countFor(c.slug);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -8, rotate: -1 }}
            >
              <Link
                to={`/categories/${c.slug}`}
                className="block rounded-3xl p-8 h-52 relative overflow-hidden shadow-soft hover:shadow-float transition-shadow text-white"
                style={{ background: `linear-gradient(135deg, ${c.colors[0]}, ${c.colors[1]})` }}
              >
                <div className="absolute -bottom-6 -right-4 text-9xl opacity-30 select-none">{c.emoji}</div>
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/10 blob-shape" />
                <div className="relative z-10">
                  <div className="text-5xl mb-3">{c.emoji}</div>
                  <h2 className="text-3xl text-white mb-1">{c.name}</h2>
                  <p className="text-white/90 text-sm mb-3">{c.description}</p>
                  <span className="inline-block glass-panel text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
                    {count} book{count !== 1 && 's'}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  </div>
  );
};

export default Categories;
