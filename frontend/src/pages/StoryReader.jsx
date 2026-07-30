import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, ArrowLeft, Lock, Expand, ZoomIn, ZoomOut, BookOpen, List,
} from 'lucide-react';
import toast from 'react-hot-toast';
import coloringService from '../services/coloringService';
import accessService from '../services/accessService';
import Loader from '../components/common/Loader';
import { getPagesForBook } from '../data/coloringPages';

/**
 * Read-online experience for STORY books. Shares the same page-image pipeline
 * as the Colouring Studio — admins upload pages, this just turns them.
 */
const StoryReader = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const book = useSelector((s) => s.catalog.books.find((b) => b.slug === slug));
  const isAdmin = useSelector((s) => s.auth.user?.role === 'ADMIN');
  // Reading position is remembered per-user, not per-browser.
  const userKey = useSelector((s) => s.auth.user?.email || s.auth.user?.id || 'guest');

  const samplePages = useMemo(() => (book ? getPagesForBook(book) : []), [book]);
  const [pages, setPages] = useState(samplePages);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showThumbs, setShowThumbs] = useState(false);
  const [access, setAccess] = useState({ loading: true, hasAccess: false, loggedIn: false });
  const containerRef = useRef(null);

  // The server decides: free / purchased / admin-granted / admin.
  useEffect(() => {
    if (!book?.id) return;
    let alive = true;
    accessService.check(book.id)
      .then((r) => alive && setAccess({ loading: false, ...r }))
      .catch(() => alive && setAccess({
        loading: false, hasAccess: false, loggedIn: !!localStorage.getItem('token'),
      }));
    return () => { alive = false; };
  }, [book?.id]);

  const unlocked = access.hasAccess;
  const progressKey = `read_${userKey}_${book?.id}`;

  // Load the real uploaded pages
  useEffect(() => {
    setPages(samplePages);
    if (!book?.slug) return;
    let alive = true;
    coloringService.getPages(book.slug)
      .then((api) => {
        if (!alive || !api?.length) return;
        setPages(api.map((p, i) => ({ id: `api-${p.id}`, index: i, name: `Page ${p.pageNumber}`, svg: p.imageUrl })));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [book?.slug, samplePages]);

  // Resume where the reader left off
  useEffect(() => {
    if (!book) return;
    const saved = Number(localStorage.getItem(progressKey));
    if (saved > 0) setIndex(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id]);

  const go = useCallback((next) => {
    setIndex((i) => {
      const v = Math.min(Math.max(next, 0), pages.length - 1);
      try { localStorage.setItem(progressKey, String(v)); } catch { /* ignore */ }
      return v;
    });
  }, [pages.length, progressKey]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, go]);

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6">
        <div className="text-6xl">🔍</div>
        <h1 className="text-2xl">Book not found</h1>
        <Link to="/story-books" className="btn-primary">Browse story books</Link>
      </div>
    );
  }

  if (access.loading) return <Loader fullScreen />;

  if (!unlocked) {
    const needsLogin = !access.loggedIn;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
        <Helmet><title>{`${book.name} — KidsColour`}</title></Helmet>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 max-w-md w-full text-center">
          <img src={book.coverImageUrl} onError={(e) => { e.currentTarget.src = book.fallbackCover; }} alt={book.name} className="w-40 h-48 object-cover rounded-2xl mx-auto mb-5 shadow-soft" />
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue font-bold px-3 py-1 rounded-full text-sm mb-3">
            <Lock size={16} /> {needsLogin ? 'Login required' : 'Premium Story Book'}
          </div>
          <h1 className="text-2xl mb-2">{book.name}</h1>

          {needsLogin ? (
            <>
              <p className="text-gray-500 mb-6">
                Log in to read this story online — we remember which page you stopped on.
              </p>
              <div className="flex flex-col gap-3">
                <Link to={`/login?next=/read/${book.slug}`} className="btn-primary">Log in to read</Link>
                <Link to={`/register?next=/read/${book.slug}`} className="btn-outline">Create a free account</Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-6">Purchase this book to read all {pages.length} pages online.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => navigate(`/books/${book.slug}`)} className="btn-primary">Buy for ₹{book.finalPrice}</button>
              </div>
            </>
          )}
          <Link to="/story-books" className="text-gray-400 text-sm font-bold hover:text-primary block mt-4">← Back to story books</Link>
        </motion.div>
      </div>
    );
  }

  const page = pages[index];
  const pct = Math.round(((index + 1) / pages.length) * 100);

  return (
    <div ref={containerRef} className="fixed inset-0 flex flex-col bg-gray-900">
      <Helmet><title>{`Reading: ${book.name} — KidsColour`}</title></Helmet>

      {/* Top bar */}
      <header className="flex items-center gap-3 px-3 sm:px-4 h-14 bg-white shadow-sm z-20 shrink-0">
        <button onClick={() => navigate(`/books/${book.slug}`)} className="p-2 text-gray-500 hover:text-primary" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <div className="font-display text-blue leading-tight truncate max-w-[40vw] flex items-center gap-2">
            <BookOpen size={16} /> {book.name}
          </div>
          <div className="text-xs text-gray-400">Page {index + 1} of {pages.length}</div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setShowThumbs((v) => !v)} className={`p-2 rounded-lg ${showThumbs ? 'bg-blue text-white' : 'text-gray-500 hover:bg-gray-100'}`} title="Pages"><List size={18} /></button>
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Zoom out"><ZoomOut size={18} /></button>
          <button onClick={() => setZoom(1)} className="text-xs font-bold text-gray-500 w-12 hover:text-primary">{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.15))} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Zoom in"><ZoomIn size={18} /></button>
          <button
            onClick={() => (document.fullscreenElement ? document.exitFullscreen?.() : containerRef.current?.requestFullscreen?.())}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Fullscreen"
          ><Expand size={18} /></button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Thumbnails */}
        {showThumbs && (
          <aside className="w-28 bg-white border-r border-gray-100 overflow-y-auto p-2 space-y-2 shrink-0">
            {pages.map((p, i) => (
              <button
                key={p.id}
                onClick={() => go(i)}
                className={`relative block w-full rounded-lg overflow-hidden border-2 ${i === index ? 'border-blue shadow-soft' : 'border-transparent hover:border-gray-200'}`}
              >
                <img src={p.svg} alt={p.name} className="w-full bg-white" />
                <span className="absolute top-1 left-1 bg-white/90 text-[10px] font-bold px-1.5 rounded-full">{i + 1}</span>
              </button>
            ))}
          </aside>
        )}

        {/* Page view */}
        <main className="flex-1 relative overflow-auto flex items-center justify-center p-4">
          <button
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="absolute left-3 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-float disabled:opacity-25 transition-opacity"
            aria-label="Previous page"
          ><ChevronLeft size={24} /></button>

          <AnimatePresence mode="wait">
            <motion.img
              key={page?.id}
              src={page?.svg}
              alt={page?.name}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-lg shadow-float max-h-full object-contain"
              style={{ transform: `scale(${zoom})`, maxWidth: '90%' }}
            />
          </AnimatePresence>

          <button
            onClick={() => go(index + 1)}
            disabled={index === pages.length - 1}
            className="absolute right-3 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-float disabled:opacity-25 transition-opacity"
            aria-label="Next page"
          ><ChevronRight size={24} /></button>
        </main>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-gray-800 shrink-0">
        <div className="h-full bg-blue transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default StoryReader;
