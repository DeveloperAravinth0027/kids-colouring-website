import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Brush, Pencil, Highlighter, Pen, SprayCan, PaintBucket, Eraser,
  Undo2, Redo2, Trash2, ZoomIn, ZoomOut, Maximize2, Hand, Expand,
  Download, Printer, Save, ChevronLeft, ChevronRight, ArrowLeft, Lock, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPagesForBook } from '../data/coloringPages';
import { floodFill } from '../utils/floodFill';
import coloringService from '../services/coloringService';
import accessService from '../services/accessService';
import Loader from '../components/common/Loader';

const SIZE = 1000; // internal canvas resolution

const TOOLS = [
  { id: 'brush', name: 'Brush', icon: Brush },
  { id: 'pencil', name: 'Pencil', icon: Pencil },
  { id: 'marker', name: 'Marker', icon: Highlighter },
  { id: 'crayon', name: 'Crayon', icon: Pen },
  { id: 'spray', name: 'Spray', icon: SprayCan },
  { id: 'bucket', name: 'Fill', icon: PaintBucket },
  { id: 'eraser', name: 'Eraser', icon: Eraser },
];

const PALETTE = [
  '#FF6B6B', '#FF9F43', '#FFD93D', '#6BCB77', '#4D96FF', '#9B5DE5', '#F15BB5', '#000000',
  '#E74C3C', '#E67E22', '#F1C40F', '#2ECC71', '#1ABC9C', '#3498DB', '#8E44AD', '#34495E',
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E0BBE4', '#FEC8D8', '#FFFFFF',
  '#39FF14', '#FF073A', '#00E5FF', '#FF00FF', '#FFFF00', '#FF6EC7', '#7CFC00', '#FF5F1F',
  '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#5C3317', '#7F8C8D', '#BDC3C7', '#2C3E50',
];

// Turn an uploaded page's white/light background transparent, keeping the dark
// line art. This is what lets raster artwork behave like a proper outline layer:
// paint sits underneath, and the flood fill treats only the lines as walls.
const keyOutBackground = (ctx) => {
  const data = ctx.getImageData(0, 0, SIZE, SIZE);
  const p = data.data;
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] === 0) continue; // already transparent
    const lum = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    if (lum > 225) {
      p[i + 3] = 0;                       // paper white -> transparent
    } else if (lum > 120) {
      // anti-aliased edge: fade it out proportionally so lines stay smooth
      p[i + 3] = Math.round(p[i + 3] * (225 - lum) / 105);
    }
  }
  ctx.putImageData(data, 0, 0);
};

// Access is decided by the server (free / purchased / admin-granted / admin).
const useBookAccess = (book) => {
  const [state, setState] = useState({ loading: true, hasAccess: false, reason: 'NONE', loggedIn: false });
  useEffect(() => {
    if (!book?.id) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    accessService.check(book.id)
      .then((r) => alive && setState({ loading: false, ...r }))
      .catch(() => alive && setState({
        loading: false, hasAccess: false, reason: 'NONE', loggedIn: !!localStorage.getItem('token'),
      }));
    return () => { alive = false; };
  }, [book?.id]);
  return state;
};

const ColoringStudio = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const book = useSelector((s) => s.catalog.books.find((b) => b.slug === slug));
  const isAdmin = useSelector((s) => s.auth.user?.role === 'ADMIN');
  // Artwork is saved per-user so one person's colouring never shows up for
  // another on the same browser/device.
  const userKey = useSelector((s) => s.auth.user?.email || s.auth.user?.id || 'guest');

  // Sample outlines are the fallback; admin-uploaded pages replace them.
  const samplePages = useMemo(() => (book ? getPagesForBook(book) : []), [book]);
  const [pages, setPages] = useState(samplePages);
  const [pageIndex, setPageIndex] = useState(0);
  const [tool, setTool] = useState('bucket');
  const [color, setColor] = useState('#FF6B6B');
  const [size, setSize] = useState(28);
  const [opacity, setOpacity] = useState(100);
  const [recent, setRecent] = useState(['#FF6B6B']);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [histVer, setHistVer] = useState(0);
  const [saved, setSaved] = useState('');
  const [tick, setTick] = useState(0);

  const access = useBookAccess(book);
  const unlocked = access.hasAccess;

  const paintRef = useRef(null);
  const outlineRef = useRef(null);
  const outlineDataRef = useRef(null);
  const containerRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const undoRef = useRef([]);
  const redoRef = useRef([]);
  const sprayTimer = useRef(null);
  const sprayPos = useRef({ x: 0, y: 0 });
  const saveTimer = useRef(null);
  const panStart = useRef(null);

  const pCtx = () => paintRef.current.getContext('2d', { willReadFrequently: true });
  const storageKey = (i = pageIndex) => `art_${userKey}_${book?.id}_${i}`;
  const isPremiumExporter = isAdmin; // demo: admins export HD without watermark

  // ---- history ----
  const bump = () => setHistVer((v) => v + 1);
  const snapshot = () => {
    undoRef.current.push(paintRef.current.toDataURL());
    if (undoRef.current.length > 24) undoRef.current.shift();
    redoRef.current = [];
    bump();
  };
  const restore = (d) => new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const ctx = pCtx();
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, 0, 0);
      res();
    };
    img.src = d;
  });
  const undo = async () => {
    if (!undoRef.current.length) return;
    redoRef.current.push(paintRef.current.toDataURL());
    await restore(undoRef.current.pop());
    bump(); scheduleSave();
  };
  const redo = async () => {
    if (!redoRef.current.length) return;
    undoRef.current.push(paintRef.current.toDataURL());
    await restore(redoRef.current.pop());
    bump(); scheduleSave();
  };

  // ---- save ----
  const saveNow = useCallback(() => {
    if (!paintRef.current || !book) return;
    try { localStorage.setItem(storageKey(), paintRef.current.toDataURL()); } catch { /* quota */ }
    setSaved('Saved ✓');
    setTick((t) => t + 1);
    setTimeout(() => setSaved(''), 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, pageIndex]);
  const scheduleSave = () => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveNow, 700);
  };

  // ---- fetch admin-uploaded pages (falls back to the sample outlines) ----
  useEffect(() => {
    setPages(samplePages);
    setPageIndex(0);
    if (!book?.slug) return;
    let alive = true;
    coloringService
      .getPages(book.slug)
      .then((apiPages) => {
        if (!alive || !apiPages?.length) return;
        setPages(
          apiPages.map((p, i) => ({
            id: `api-${p.id}`,
            index: i,
            name: `Page ${p.pageNumber}`,
            svg: p.imageUrl, // streamed by the backend (same-origin via the Vite proxy)
            raster: true,    // white background must be keyed out before use
          }))
        );
      })
      .catch(() => { /* keep the sample outlines */ });
    return () => { alive = false; };
  }, [book?.slug, samplePages]);

  // ---- load a page (outline mask + saved paint) ----
  useEffect(() => {
    if (!unlocked || !pages.length || !paintRef.current || !outlineRef.current) return;
    const page = pages[pageIndex];
    const oCtx = outlineRef.current.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    img.onload = () => {
      oCtx.clearRect(0, 0, SIZE, SIZE);
      // Fit the artwork inside the square canvas, preserving its aspect ratio.
      const scale = Math.min(SIZE / img.width, SIZE / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      oCtx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);

      // Uploaded line art has an opaque white background. Key it out so the
      // paint layer shows through and the flood fill only treats the dark
      // lines as walls.
      if (page.raster) keyOutBackground(oCtx);

      outlineDataRef.current = oCtx.getImageData(0, 0, SIZE, SIZE);

      const ctx = pCtx();
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, SIZE, SIZE);
      const savedArt = localStorage.getItem(storageKey());
      if (savedArt) {
        const s = new Image();
        s.onload = () => ctx.drawImage(s, 0, 0);
        s.src = savedArt;
      }
      undoRef.current = [];
      redoRef.current = [];
      bump();
    };
    img.src = page.svg;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, unlocked, pages]);

  // ---- auto save every 30s ----
  useEffect(() => {
    if (!unlocked) return;
    const id = setInterval(saveNow, 30000);
    return () => clearInterval(id);
  }, [unlocked, saveNow]);

  // ---- keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="text-2xl">Book not found</h1>
        <Link to="/books" className="btn-primary">Browse books</Link>
      </div>
    );
  }

  // ---- access gate: log in, then own it ----
  if (access.loading) return <Loader fullScreen />;

  if (!unlocked) {
    const needsLogin = !access.loggedIn;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-purple-50 to-white">
        <Helmet><title>{`${book.name} — KidsColour`}</title></Helmet>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 max-w-md w-full text-center">
          <img src={book.coverImageUrl} onError={(e) => { e.currentTarget.src = book.fallbackCover; }} alt={book.name} className="w-40 h-48 object-cover rounded-2xl mx-auto mb-5 shadow-soft" />
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple font-bold px-3 py-1 rounded-full text-sm mb-3">
            <Lock size={16} /> {needsLogin ? 'Login required' : 'Premium Book'}
          </div>
          <h1 className="text-2xl mb-2">{book.name}</h1>

          {needsLogin ? (
            <>
              <p className="text-gray-500 mb-6">
                Log in to colour this book online — we save your artwork to your account so you can pick up where you left off.
              </p>
              <div className="flex flex-col gap-3">
                <Link to={`/login?next=/color/${book.slug}`} className="btn-primary">Log in to colour</Link>
                <Link to={`/register?next=/color/${book.slug}`} className="btn-outline">Create a free account</Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-6">Purchase this book to unlock all {pages.length} colouring pages online.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => navigate(`/books/${book.slug}`)} className="btn-primary">Buy for ₹{book.finalPrice}</button>
              </div>
            </>
          )}
          <Link to="/colouring-books" className="text-gray-400 text-sm font-bold hover:text-primary block mt-4">← Back to books</Link>
        </motion.div>
      </div>
    );
  }

  // ---- drawing helpers ----
  const coords = (e) => {
    const r = paintRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * SIZE, y: (e.clientY - r.top) / r.height * SIZE };
  };

  const sprayDots = (ctx, pos) => {
    const r = size; const n = Math.round(size * 1.1);
    ctx.fillStyle = color; ctx.globalAlpha = (opacity / 100) * 0.5;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2; const rad = Math.random() * r;
      ctx.fillRect(pos.x + Math.cos(a) * rad, pos.y + Math.sin(a) * rad, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  };

  const stroke = (ctx, from, to) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const col = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.strokeStyle = col; ctx.fillStyle = col;
    let s = size; let a = opacity / 100;

    if (tool === 'pencil') s = size * 0.5;
    if (tool === 'marker') { a *= 0.35; s = size * 1.3; ctx.lineCap = 'butt'; }
    if (tool === 'eraser') { a = 1; s = size * 1.4; }

    if (tool === 'crayon') {
      ctx.globalAlpha = a * 0.85; ctx.lineWidth = s;
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
      const steps = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y) / 4);
      ctx.globalAlpha = a * 0.22;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        ctx.fillRect(from.x + (to.x - from.x) * t + (Math.random() - 0.5) * s,
          from.y + (to.y - from.y) * t + (Math.random() - 0.5) * s, 2, 2);
      }
      ctx.globalAlpha = 1;
      return;
    }

    ctx.globalAlpha = a; ctx.lineWidth = s;
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const doFill = (p) => {
    const ctx = pCtx();
    const img = ctx.getImageData(0, 0, SIZE, SIZE);
    if (floodFill(img, outlineDataRef.current, p.x, p.y, color, 24)) {
      ctx.putImageData(img, 0, 0);
      scheduleSave();
    }
  };

  const onDown = (e) => {
    paintRef.current.setPointerCapture?.(e.pointerId);
    if (panMode) { panStart.current = { mx: e.clientX, my: e.clientY, ...pan }; return; }
    const p = coords(e);
    if (tool === 'bucket') { snapshot(); doFill(p); return; }
    snapshot();
    drawing.current = true;
    last.current = p;
    if (tool === 'spray') {
      sprayPos.current = p;
      sprayDots(pCtx(), p);
      sprayTimer.current = setInterval(() => sprayDots(pCtx(), sprayPos.current), 45);
    } else {
      stroke(pCtx(), p, p);
    }
  };
  const onMove = (e) => {
    if (panMode && panStart.current) {
      setPan({ x: panStart.current.x + (e.clientX - panStart.current.mx), y: panStart.current.y + (e.clientY - panStart.current.my) });
      return;
    }
    if (!drawing.current) return;
    const p = coords(e);
    if (tool === 'spray') { sprayPos.current = p; last.current = p; return; }
    stroke(pCtx(), last.current, p);
    last.current = p;
  };
  const onUp = () => {
    panStart.current = null;
    if (!drawing.current) return;
    drawing.current = false;
    clearInterval(sprayTimer.current);
    scheduleSave();
  };

  const pick = (c) => { setColor(c); setRecent((r) => [c, ...r.filter((x) => x !== c)].slice(0, 10)); };
  const clearPage = () => { snapshot(); const ctx = pCtx(); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, SIZE, SIZE); scheduleSave(); };

  const compose = (scale, watermark) => {
    const c = document.createElement('canvas');
    c.width = SIZE * scale; c.height = SIZE * scale;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(paintRef.current, 0, 0, c.width, c.height);
    ctx.drawImage(outlineRef.current, 0, 0, c.width, c.height);
    if (watermark) {
      ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#111827';
      ctx.font = `bold ${64 * scale}px Nunito, sans-serif`; ctx.textAlign = 'center';
      ctx.translate(c.width / 2, c.height / 2); ctx.rotate(-Math.PI / 6);
      ctx.fillText('KidsColour • Free', 0, 0); ctx.restore();
    }
    return c;
  };
  const exportPng = () => {
    const scale = isPremiumExporter ? 2 : 1;
    const c = compose(scale, !isPremiumExporter);
    const a = document.createElement('a');
    a.download = `${book.slug}-page-${pageIndex + 1}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
    toast.success(isPremiumExporter ? 'Exported HD PNG 🎉' : 'Exported PNG (free — watermarked)');
  };
  const printPage = () => {
    const c = compose(2, !isPremiumExporter);
    const w = window.open('');
    if (!w) return toast.error('Please allow pop-ups to print.');
    w.document.write(`<img src="${c.toDataURL()}" style="width:100%" onload="window.print()"/>`);
    w.document.close();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const changePage = (i) => { saveNow(); setPageIndex(i); setZoom(1); setPan({ x: 0, y: 0 }); };
  const coloredCount = pages.filter((_, i) => localStorage.getItem(storageKey(i))).length; // eslint-disable-line no-unused-vars
  const progress = Math.round((coloredCount / pages.length) * 100);

  return (
    <div ref={containerRef} className="fixed inset-0 flex flex-col bg-gray-100">
      <Helmet><title>{`Colouring: ${book.name} — KidsColour`}</title></Helmet>

      {/* ===== Top bar ===== */}
      <header className="flex items-center gap-3 px-3 sm:px-4 h-14 bg-white shadow-sm z-20 shrink-0">
        <button onClick={() => navigate(`/books/${book.slug}`)} className="p-2 text-gray-500 hover:text-primary" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <div className="font-display text-primary leading-tight truncate max-w-[40vw]">{book.name}</div>
          <div className="text-xs text-gray-400">Page {pageIndex + 1} of {pages.length}{saved && <span className="text-green-dark font-bold ml-2">{saved}</span>}</div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <IconBtn onClick={undo} disabled={!undoRef.current.length} title="Undo"><Undo2 size={18} /></IconBtn>
          <IconBtn onClick={redo} disabled={!redoRef.current.length} title="Redo"><Redo2 size={18} /></IconBtn>
          <IconBtn onClick={clearPage} title="Clear page"><Trash2 size={18} /></IconBtn>
          <span className="w-px h-6 bg-gray-200 mx-1" />
          <IconBtn onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))} title="Zoom out"><ZoomOut size={18} /></IconBtn>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="text-xs font-bold text-gray-500 w-12 hover:text-primary" title="Fit">{Math.round(zoom * 100)}%</button>
          <IconBtn onClick={() => setZoom((z) => Math.min(4, z + 0.2))} title="Zoom in"><ZoomIn size={18} /></IconBtn>
          <IconBtn onClick={() => setPanMode((v) => !v)} active={panMode} title="Pan"><Hand size={18} /></IconBtn>
          <IconBtn onClick={toggleFullscreen} title="Fullscreen"><Expand size={18} /></IconBtn>
          <span className="w-px h-6 bg-gray-200 mx-1" />
          <IconBtn onClick={saveNow} title="Save"><Save size={18} /></IconBtn>
          <IconBtn onClick={printPage} title="Print"><Printer size={18} /></IconBtn>
          <button onClick={exportPng} className="btn-primary text-sm py-2 px-3 hidden sm:flex items-center gap-1"><Download size={16} /> Export</button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* ===== Left: pages ===== */}
        <aside className="w-28 bg-white border-r border-gray-100 hidden md:flex flex-col shrink-0">
          <div className="p-3 border-b">
            <div className="text-xs font-bold text-gray-500 mb-1">Progress</div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {pages.map((p, i) => (
              <button
                key={p.id}
                onClick={() => changePage(i)}
                className={`relative block w-full rounded-xl overflow-hidden border-2 transition-all ${i === pageIndex ? 'border-primary shadow-soft' : 'border-transparent hover:border-gray-200'}`}
              >
                <img src={p.svg} alt={p.name} className="w-full bg-white" />
                <span className="absolute top-1 left-1 bg-white/90 text-[10px] font-bold px-1.5 rounded-full">{i + 1}</span>
                {localStorage.getItem(storageKey(i)) && <span className="absolute bottom-1 right-1 bg-green text-white rounded-full p-0.5"><Check size={10} /></span>}
              </button>
            ))}
          </div>
          <div className="flex border-t">
            <button onClick={() => pageIndex > 0 && changePage(pageIndex - 1)} disabled={pageIndex === 0} className="flex-1 p-3 text-gray-500 hover:text-primary disabled:opacity-30 flex justify-center"><ChevronLeft size={20} /></button>
            <button onClick={() => pageIndex < pages.length - 1 && changePage(pageIndex + 1)} disabled={pageIndex === pages.length - 1} className="flex-1 p-3 text-gray-500 hover:text-primary disabled:opacity-30 flex justify-center"><ChevronRight size={20} /></button>
          </div>
        </aside>

        {/* ===== Center: canvas ===== */}
        <main className="flex-1 relative overflow-hidden flex items-center justify-center bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
          <div
            className="relative shadow-float rounded-lg bg-white"
            style={{ width: 'min(88vh, 92vw)', aspectRatio: '1 / 1', transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, cursor: panMode ? 'grab' : 'crosshair', touchAction: 'none' }}
          >
            <canvas ref={paintRef} width={SIZE} height={SIZE} className="absolute inset-0 w-full h-full rounded-lg" />
            <canvas ref={outlineRef} width={SIZE} height={SIZE} className="absolute inset-0 w-full h-full pointer-events-none" />
            {/* pointer surface on top */}
            <canvas
              width={SIZE} height={SIZE}
              className="absolute inset-0 w-full h-full"
              style={{ touchAction: 'none' }}
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
            />
          </div>
          {/* mobile page controls */}
          <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 glass-panel rounded-full px-2 py-1">
            <button onClick={() => pageIndex > 0 && changePage(pageIndex - 1)} disabled={pageIndex === 0} className="p-2 disabled:opacity-30"><ChevronLeft size={18} /></button>
            <span className="text-sm font-bold">{pageIndex + 1}/{pages.length}</span>
            <button onClick={() => pageIndex < pages.length - 1 && changePage(pageIndex + 1)} disabled={pageIndex === pages.length - 1} className="p-2 disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
        </main>

        {/* ===== Right: tools ===== */}
        <aside className="w-64 bg-white border-l border-gray-100 overflow-y-auto shrink-0 hidden sm:block">
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Tools</h3>
              <div className="grid grid-cols-4 gap-2">
                {TOOLS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTool(t.id); setPanMode(false); }}
                    title={t.name}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${tool === t.id ? 'bg-primary text-white shadow-soft' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    <t.icon size={18} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Brush</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                  <span className="rounded-full" style={{ width: Math.max(4, size / 2.2), height: Math.max(4, size / 2.2), background: color, display: 'block' }} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 flex justify-between"><span>Size</span><span>{size}</span></label>
                  <input type="range" min="2" max="90" value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-primary" />
                  <label className="text-xs text-gray-500 flex justify-between mt-1"><span>Opacity</span><span>{opacity}%</span></label>
                  <input type="range" min="10" max="100" value={opacity} onChange={(e) => setOpacity(+e.target.value)} className="w-full accent-primary" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase">Colours</h3>
                <label className="relative cursor-pointer" title="Custom colour">
                  <span className="text-xs font-bold text-primary">+ Custom</span>
                  <input type="color" value={color} onChange={(e) => pick(e.target.value)} className="absolute inset-0 opacity-0 w-full cursor-pointer" />
                </label>
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => pick(c)}
                    title={c}
                    className={`aspect-square rounded-md border transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-primary ring-offset-1' : 'border-gray-200'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {recent.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Recent</h3>
                <div className="flex flex-wrap gap-1.5">
                  {recent.map((c, i) => (
                    <button key={i} onClick={() => pick(c)} className="w-7 h-7 rounded-md border border-gray-200 hover:scale-110 transition-transform" style={{ background: c }} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-xl p-3 bg-gray-50">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: color }}>
                <span className="text-xs font-bold mix-blend-difference">{color.toUpperCase().slice(0, 7)}</span>
              </div>
              <p className="text-xs text-gray-500">{isPremiumExporter ? 'Premium: HD export, no watermark.' : 'Free: exports are watermarked.'}</p>
            </div>
          </div>
        </aside>
      </div>

      {/* mobile tool dock */}
      <div className="sm:hidden bg-white border-t flex items-center gap-1 px-2 py-2 overflow-x-auto shrink-0">
        {TOOLS.map((t) => (
          <button key={t.id} onClick={() => { setTool(t.id); setPanMode(false); }} className={`p-2 rounded-lg shrink-0 ${tool === t.id ? 'bg-primary text-white' : 'text-gray-600'}`}><t.icon size={18} /></button>
        ))}
        <label className="p-2 rounded-lg relative"><span className="w-5 h-5 rounded-full block border border-gray-300" style={{ background: color }} /><input type="color" value={color} onChange={(e) => pick(e.target.value)} className="absolute inset-0 opacity-0" /></label>
        <button onClick={exportPng} className="ml-auto btn-primary text-xs py-2 px-3 shrink-0">Export</button>
      </div>
    </div>
  );
};

const IconBtn = ({ children, onClick, disabled, active, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${active ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-primary'}`}
  >
    {children}
  </button>
);

export default ColoringStudio;
