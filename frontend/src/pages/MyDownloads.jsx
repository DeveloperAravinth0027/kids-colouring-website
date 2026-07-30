import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Download, Palette, PackageOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import orderService from '../services/orderService';
import bookService from '../services/bookService';
import { coverFallbackFor } from '../data/catalog';
import Loader from '../components/common/Loader';

const statusStyle = (s) => {
  switch ((s || '').toUpperCase()) {
    case 'PAID': return 'bg-green-100 text-green-dark';
    case 'PENDING': return 'bg-secondary-light/50 text-gray-700';
    case 'FAILED': case 'CANCELLED': return 'bg-red-100 text-red-500';
    default: return 'bg-gray-100 text-gray-500';
  }
};

const MyDownloads = () => {
  const books = useSelector((s) => s.catalog.books);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    orderService
      .getMyOrders({ size: 50 })
      .then((res) => { if (alive) setOrders(res?.data?.content ?? []); })
      .catch(() => { if (alive) setOrders([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // Flatten every order's items into a unique list of purchased books.
  const purchases = [];
  const seen = new Set();
  orders.forEach((o) =>
    (o.items || []).forEach((it) => {
      if (seen.has(it.bookId)) return;
      seen.add(it.bookId);
      purchases.push({ ...it, orderNumber: o.orderNumber, status: o.status, createdAt: o.createdAt });
    })
  );

  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (bookId, bookName) => {
    setDownloading(bookId);
    try {
      const blob = await bookService.downloadBookPdf(bookId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bookName || 'colouring-book'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started 📥');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) toast.error('No PDF has been uploaded for this book yet.');
      else if (status === 401 || status === 403) toast.error('You need to purchase this book first.');
      else toast.error('Could not download the PDF.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>My Downloads - KidsColour</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section className="bg-gradient-to-b from-green-100/60 to-white py-14">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-6xl mb-3">📥</div>
            <h1 className="text-4xl md:text-5xl mb-2">My Downloads</h1>
            <p className="text-gray-600">Every book you've bought, ready to colour or print.</p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-14">
        {purchases.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <PackageOpen size={64} className="text-gray-300 mb-4" />
            <h2 className="text-2xl mb-2">No purchases yet</h2>
            <p className="text-gray-500 mb-8">Once you buy a book, it appears here forever.</p>
            <Link to="/books" className="btn-primary">Browse Books</Link>
          </div>
        ) : (
          <>
            <p className="text-gray-500 font-bold mb-6">
              {purchases.length} book{purchases.length !== 1 && 's'} purchased
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchases.map((p, i) => {
                const book = books.find((b) => b.id === p.bookId);
                const fallback = coverFallbackFor(book?.categorySlug);
                const cover = p.bookCoverUrl || book?.coverImageUrl || fallback;
                return (
                  <motion.div
                    key={p.bookId}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i % 6) * 0.05 }}
                    className="card p-4 flex gap-4"
                  >
                    <img
                      src={cover}
                      onError={(e) => { e.currentTarget.src = fallback; }}
                      alt={p.bookName}
                      className="w-24 h-32 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex flex-col min-w-0 flex-grow">
                      <h3 className="text-lg font-bold truncate">{p.bookName}</h3>
                      <div className="text-xs text-gray-400 mb-1">{p.orderNumber}</div>
                      <span className={`self-start text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-3 ${statusStyle(p.status)}`}>
                        {p.status}
                      </span>

                      <div className="mt-auto flex flex-col gap-2">
                        {book?.slug && (
                          <Link
                            to={`/color/${book.slug}`}
                            className="text-white text-sm font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform"
                            style={{ background: 'linear-gradient(135deg, #9B5DE5, #4D96FF)' }}
                          >
                            <Palette size={16} /> Colour Online
                          </Link>
                        )}
                        <button
                          onClick={() => handleDownload(p.bookId, p.bookName)}
                          disabled={downloading === p.bookId}
                          className="btn-outline text-sm py-2 px-3 flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          <Download size={16} /> {downloading === p.bookId ? 'Downloading…' : 'Download PDF'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyDownloads;
