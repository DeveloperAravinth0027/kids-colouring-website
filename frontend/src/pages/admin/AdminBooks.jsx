import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Trash2, Pencil, X, Star, FileUp, FileText, Download, ImagePlus, CheckCircle2, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import { addBook, updateBook, removeBook, buildBook, setBooks } from '../../store/slices/catalogSlice';
import { putFile, getFile, deleteFile, formatBytes, resizeImage } from '../../utils/fileStore';
import coloringService from '../../services/coloringService';
import bookService from '../../services/bookService';
import { getBooks } from '../../data/catalog';

const emptyForm = {
  name: '',
  categorySlug: '',
  price: '',
  discount: '',
  pages: '',
  ageRange: '',
  description: '',
  coverImageUrl: '',
  featured: true,
  isFree: false,
  bookType: 'COLOURING',
  amazonKdpLink: '',
  hasPdf: false,
  pdfName: '',
  pdfSize: 0,
};

// Convert a data: URL (the resized cover) into a Blob we can upload.
const dataUrlToBlob = (dataUrl) => {
  const [head, b64] = dataUrl.split(',');
  const mime = (head.match(/:(.*?);/) || [])[1] || 'image/jpeg';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

// Turn a stored book into editable form fields.
const bookToForm = (book) => ({
  id: book.id,
  slug: book.slug,
  name: book.name,
  categorySlug: book.categorySlug,
  price: String(book.price ?? ''),
  discount: String(book.discount || ''),
  pages: String(book.pages || ''),
  ageRange: book.ageRange || '',
  description: book.description || '',
  // Keep real covers (server path or external URL); blank only the generated
  // SVG fallback so its huge data URI doesn't clutter the form.
  coverImageUrl: book.coverImageUrl?.startsWith('data:image/svg') ? '' : book.coverImageUrl || '',
  featured: book.featured,
  isFree: !!book.isFree,
  bookType: book.bookType || 'COLOURING',
  amazonKdpLink: book.amazonKdpLink || '',
  hasPdf: !!book.hasPdf,
  pdfName: book.pdfName || '',
  pdfSize: book.pdfSize || 0,
  rating: book.rating,
  reviews: book.reviews,
  bestseller: book.bestseller,
});

const AdminBooks = () => {
  const books = useSelector((s) => s.catalog.books);
  const categories = useSelector((s) => s.catalog.categories);
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [typeTab, setTypeTab] = useState('COLOURING'); // which product line we're managing
  const [form, setForm] = useState({ ...emptyForm, categorySlug: categories[0]?.slug || '' });
  const [pdfFile, setPdfFile] = useState(null);   // freshly selected PDF (File)
  const [busy, setBusy] = useState(false);
  const [pages, setPages] = useState([]);         // server-side colouring pages
  const [pagesBusy, setPagesBusy] = useState(false);

  // Load the book's colouring pages whenever the edit modal opens.
  useEffect(() => {
    if (!showForm || !editingId) { setPages([]); return; }
    let alive = true;
    coloringService.adminListPages(editingId)
      .then((p) => { if (alive) setPages(p || []); })
      .catch(() => { if (alive) setPages([]); });
    return () => { alive = false; };
  }, [showForm, editingId]);

  const onPagesUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setPagesBusy(true);
    try {
      await coloringService.adminUpload(editingId, files);
      setPages(await coloringService.adminListPages(editingId));
      toast.success(`${files.length} colouring page(s) uploaded 🎨`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed — this book must exist on the server.');
    } finally {
      setPagesBusy(false);
      e.target.value = '';
    }
  };

  const deletePage = async (pageId) => {
    try {
      await coloringService.adminDelete(editingId, pageId);
      setPages((ps) => ps.filter((p) => p.id !== pageId));
      toast('Page removed', { icon: '🗑️' });
    } catch {
      toast.error('Could not remove that page.');
    }
  };

  const openAdd = () => {
    // Default the new book to whichever line you're currently viewing.
    setForm({ ...emptyForm, categorySlug: categories[0]?.slug || '', bookType: typeTab });
    setPdfFile(null);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (book) => {
    setForm(bookToForm(book));
    setPdfFile(null);
    setEditingId(book.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setPdfFile(null);
    if (searchParams.get('edit')) {
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const onPdfChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      return toast.error('Please choose a PDF file.');
    }
    setPdfFile(f);
    setForm((fm) => ({ ...fm, hasPdf: true, pdfName: f.name, pdfSize: f.size }));
  };

  const onCoverChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('Please choose an image file.');
    try {
      const dataUrl = await resizeImage(f);
      setForm((fm) => ({ ...fm, coverImageUrl: dataUrl }));
      toast.success('Cover image added ✓');
    } catch {
      toast.error('Could not read that image.');
    }
  };

  // Prefer the server copy (what customers actually get); fall back to the
  // browser-stored file for books saved while offline.
  const downloadPdf = async (book) => {
    try {
      const blob = await bookService.downloadBookPdf(book.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    } catch {
      const local = await getFile(`pdf_${book.id}`);
      if (!local) return toast.error('No PDF stored for this book.');
      const url = URL.createObjectURL(local);
      const a = document.createElement('a');
      a.href = url;
      a.download = book.pdfName || `${book.slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Deep-link: /admin/books?edit=<id> (used by the Book Details "Edit" button)
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    const book = books.find((b) => String(b.id) === editId);
    if (book) openEdit(book);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, books]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  // With a real admin session, books are created on the server so they get a
  // database id (required for orders, carts and colouring pages).
  const onServer = !!localStorage.getItem('token');

  const refreshFromServer = async () => {
    const r = await getBooks(undefined, { fresh: true });
    if (r.live && r.data?.length) dispatch(setBooks(r.data));
  };

  const toBookRequest = () => {
    const cat = categories.find((c) => c.slug === form.categorySlug) || categories[0];
    return {
      categoryId: cat.id,
      bookType: form.bookType || 'COLOURING',
      name: form.name.trim(),
      description: form.description?.trim() || form.name.trim(),
      shortDescription: (form.description?.trim() || form.name.trim()).slice(0, 150),
      ageGroup: form.ageRange?.trim() || '3-8',
      numPages: Number(form.pages) || 1,
      price: Number(form.price),
      discountPercent: Number(form.discount) || 0,
      isFeatured: !!form.featured,
      isFree: !!form.isFree,
      amazonKdpLink: form.amazonKdpLink?.trim() || null,
      // Only an external URL goes in the DB column. Uploaded files (data URLs)
      // and the server's own cover path are handled by the cover endpoint.
      coverImageUrl: /^https?:\/\//.test(form.coverImageUrl) ? form.coverImageUrl.trim() : null,
      isActive: true,
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Please enter a book name.');
    if (!form.price || Number(form.price) <= 0) return toast.error('Please enter a valid price.');

    setBusy(true);
    try {
      if (onServer) {
        // ---- real backend book ----
        const res = editingId
          ? await bookService.adminUpdateBook(editingId, toBookRequest())
          : await bookService.adminCreateBook(toBookRequest());
        const saved = res?.data;
        const savedId = saved?.id ?? editingId;
        // An uploaded cover is a resized JPEG data URL — store it on the server.
        if (savedId && form.coverImageUrl?.startsWith('data:image')) {
          try {
            await bookService.adminUploadCover(savedId, dataUrlToBlob(form.coverImageUrl));
          } catch {
            toast.error('The book saved, but the cover image could not be uploaded.');
          }
        }
        // One upload does both: sellable download + the online pages.
        if (pdfFile && savedId) {
          const up = await bookService.adminUploadBookPdf(savedId, pdfFile);
          const pages = up?.data?.pagesGenerated;
          if (pages) toast.success(`PDF converted into ${pages} online page${pages !== 1 ? 's' : ''} 📄→🎨`);
          else if (up?.data?.warning) toast(up.data.warning, { icon: '⚠️', duration: 6000 });
        }
        await refreshFromServer();
        toast.success(editingId ? `"${form.name}" updated!` : `"${form.name}" added to the store! 🎉`);
      } else {
        // ---- offline fallback: local catalogue only ----
        const book = buildBook(form, categories);
        if (pdfFile) {
          await putFile(`pdf_${book.id}`, pdfFile);
          book.hasPdf = true;
          book.pdfName = pdfFile.name;
          book.pdfSize = pdfFile.size;
        }
        dispatch(editingId ? updateBook(book) : addBook(book));
        toast(
          `"${book.name}" saved in this browser only — it will disappear on refresh. Log in with a real admin account to save it to the database.`,
          { icon: '⚠️', duration: 7000 }
        );
      }
      closeForm();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save the book.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Remove "${book.name}" from the store?\n\nIf customers have already bought it, it will be archived instead of deleted so their orders and downloads keep working.`)) return;
    try {
      if (onServer) {
        const res = await bookService.adminDeleteBook(book.id);
        await refreshFromServer();
        // The server tells us whether it was deleted or archived.
        toast.success(res?.message || `"${book.name}" removed`, { duration: 6000 });
      } else {
        dispatch(removeBook(book.id));
        toast(`"${book.name}" removed`, { icon: '🗑️' });
      }
      await deleteFile(`pdf_${book.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not remove the book.');
    }
  };

  const shown = books.filter((b) => (b.bookType || 'COLOURING') === typeTab);

  return (
    <div>
      <Helmet><title>Manage Books - KidsColour Admin</title></Helmet>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl mb-1">Manage Books</h1>
          <p className="text-gray-500">{books.length} book{books.length !== 1 && 's'} across both lines</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> Add {typeTab === 'STORY' ? 'Story' : 'Colouring'} Book
        </button>
      </div>

      {/* The two product lines */}
      <div className="flex gap-3 mb-6 border-b border-gray-200">
        {[
          { id: 'COLOURING', label: 'Colouring Books', emoji: '🎨', accent: 'border-purple text-purple' },
          { id: 'STORY', label: 'Story Books', emoji: '📖', accent: 'border-blue text-blue' },
        ].map((t) => {
          const n = books.filter((b) => (b.bookType || 'COLOURING') === t.id).length;
          const on = typeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTypeTab(t.id)}
              className={`px-5 py-3 font-bold text-sm border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                on ? t.accent : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <span>{t.emoji}</span> {t.label}
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${on ? 'bg-gray-100' : 'bg-gray-50'}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* Book grid — only the selected line */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <AnimatePresence mode="popLayout">
          {shown.map((book) => (
            <motion.div
              key={book.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={book.coverImageUrl}
                  onError={(e) => { e.currentTarget.src = book.fallbackCover; }}
                  alt={book.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 glass-panel text-xs font-bold px-2 py-1 rounded-full">
                  {book.categoryEmoji} {book.categoryName}
                </span>
                <span className={`absolute bottom-2 left-2 text-[10px] font-extrabold px-2 py-1 rounded-full text-white ${
                  book.bookType === 'STORY' ? 'bg-blue' : 'bg-purple'
                }`}>
                  {book.bookType === 'STORY' ? '📖 STORY' : '🎨 COLOURING'}
                </span>
                {book.featured && (
                  <span className="absolute top-2 right-2 bg-secondary text-gray-900 text-[10px] font-extrabold px-2 py-1 rounded-full">
                    FEATURED
                  </span>
                )}
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <button
                    onClick={() => openEdit(book)}
                    aria-label={`Edit ${book.name}`}
                    className="bg-white/90 text-blue hover:bg-blue hover:text-white rounded-full p-2 shadow-soft transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(book)}
                    aria-label={`Delete ${book.name}`}
                    className="bg-white/90 text-red-500 hover:bg-red-500 hover:text-white rounded-full p-2 shadow-soft transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 truncate">{book.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-display text-lg text-primary">₹{book.finalPrice}</span>
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <Star size={14} fill="currentColor" className="text-secondary-dark" /> {book.rating}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-50">
                  {book.hasPdf ? (
                    <button onClick={() => downloadPdf(book)} className="w-full flex items-center gap-2 text-sm font-bold text-green-dark hover:underline">
                      <FileText size={15} /> <span className="truncate flex-1 text-left">{book.pdfName || 'PDF attached'}</span>
                      <Download size={15} />
                    </button>
                  ) : (
                    <button onClick={() => openEdit(book)} className="w-full flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary">
                      <FileUp size={15} /> No PDF — upload one
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {shown.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">{typeTab === 'STORY' ? '📖' : '🎨'}</div>
          <p className="text-lg font-bold mb-2">
            No {typeTab === 'STORY' ? 'story' : 'colouring'} books yet
          </p>
          <button onClick={openAdd} className="text-primary font-bold">
            Add your first {typeTab === 'STORY' ? 'story' : 'colouring'} book →
          </button>
        </div>
      )}

      {/* Add / Edit modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeForm}
          >
            <motion.form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSave}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-float w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl">{editingId ? 'Edit Book' : 'Add a New Book'}</h2>
                <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Product line — decides whether customers read it or colour it */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Product line</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setForm((f) => ({ ...f, bookType: 'COLOURING' }))}
                      className={`py-3 rounded-xl font-bold text-sm border-2 transition-colors ${form.bookType !== 'STORY' ? 'border-purple bg-purple-100 text-purple' : 'border-gray-200 text-gray-500'}`}>
                      🎨 Colouring Book
                      <span className="block text-[10px] font-normal opacity-70">Colour online / print</span>
                    </button>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, bookType: 'STORY' }))}
                      className={`py-3 rounded-xl font-bold text-sm border-2 transition-colors ${form.bookType === 'STORY' ? 'border-blue bg-blue-100 text-blue' : 'border-gray-200 text-gray-500'}`}>
                      📖 Story Book
                      <span className="block text-[10px] font-normal opacity-70">Read online</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Book name *</label>
                  <input value={form.name} onChange={set('name')} className="input-field" placeholder="e.g. Jungle Safari" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Category</label>
                    <select value={form.categorySlug} onChange={set('categorySlug')} className="input-field">
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Age range</label>
                    <input value={form.ageRange} onChange={set('ageRange')} className="input-field" placeholder="e.g. 3-6" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Price (₹) *</label>
                    <input type="number" min="0" value={form.price} onChange={set('price')} className="input-field" placeholder="199" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Discount %</label>
                    <input type="number" min="0" max="90" value={form.discount} onChange={set('discount')} className="input-field" placeholder="0" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Pages</label>
                    <input type="number" min="0" value={form.pages} onChange={set('pages')} className="input-field" placeholder="30" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Cover image <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="flex gap-3 items-start">
                    <div className="w-16 h-20 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                      {form.coverImageUrl
                        ? <img src={form.coverImageUrl} alt="cover" className="w-full h-full object-cover" />
                        : <ImagePlus size={20} className="text-gray-300" />}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="btn-outline text-sm py-2 px-3 inline-flex items-center gap-2 cursor-pointer">
                        <ImagePlus size={16} /> Upload image
                        <input type="file" accept="image/*" onChange={onCoverChange} className="hidden" />
                      </label>
                      <input
                        value={/^https?:\/\//.test(form.coverImageUrl || '') ? form.coverImageUrl : ''}
                        onChange={set('coverImageUrl')}
                        className="input-field text-sm"
                        placeholder="…or paste an image URL"
                      />
                    </div>
                  </div>
                </div>

                {/* E-book PDF upload */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">E-book file (PDF) <span className="text-gray-400 font-normal">— the file customers buy</span></label>
                  {form.hasPdf ? (
                    <div className="flex items-center gap-3 rounded-xl border-2 border-green bg-green-100 p-3">
                      <FileText size={22} className="text-green-dark shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-green-dark truncate flex items-center gap-1">
                          <CheckCircle2 size={14} /> {form.pdfName}
                        </div>
                        {form.pdfSize > 0 && <div className="text-xs text-green-dark/70">{formatBytes(form.pdfSize)}</div>}
                      </div>
                      <label className="text-sm font-bold text-green-dark hover:underline cursor-pointer shrink-0">
                        Replace
                        <input type="file" accept="application/pdf" onChange={onPdfChange} className="hidden" />
                      </label>
                      <button type="button" onClick={() => { setPdfFile(null); setForm((f) => ({ ...f, hasPdf: false, pdfName: '', pdfSize: 0 })); }} className="text-gray-400 hover:text-red-500 shrink-0">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-gray-50 p-6 cursor-pointer transition-colors text-center">
                      <FileUp size={26} className="text-gray-400" />
                      <span className="font-bold text-gray-600">Click to upload your PDF</span>
                      <span className="text-xs text-gray-400">
                        Customers download this file — and every page is turned into the
                        online {form.bookType === 'STORY' ? 'story pages automatically' : 'colouring pages automatically'}
                      </span>
                      <input type="file" accept="application/pdf" onChange={onPdfChange} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Colouring pages — what kids actually colour online */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Online pages
                    <span className="text-gray-400 font-normal"> — created from the PDF above; add extras here if you want</span>
                  </label>

                  {!editingId ? (
                    <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
                      Save the book first, then re-open it to upload colouring pages.
                    </p>
                  ) : (
                    <>
                      {pages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {pages.map((p) => (
                            <div key={p.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                              <img src={p.imageUrl} alt={`Page ${p.pageNumber}`} className="w-full h-20 object-contain" />
                              <span className="absolute top-1 left-1 bg-white/90 text-[10px] font-bold px-1 rounded">{p.pageNumber}</span>
                              <button
                                type="button"
                                onClick={() => deletePage(p.id)}
                                aria-label={`Delete page ${p.pageNumber}`}
                                className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <label className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-4 text-center transition-colors ${pagesBusy ? 'border-gray-200 opacity-60' : 'border-gray-300 hover:border-purple hover:bg-gray-50 cursor-pointer'}`}>
                        <Palette size={22} className="text-purple" />
                        <span className="font-bold text-gray-600 text-sm">
                          {pagesBusy ? 'Uploading…' : 'Upload colouring images'}
                        </span>
                        <span className="text-xs text-gray-400">PNG / JPG line art · you can select several at once</span>
                        <input type="file" accept="image/*" multiple onChange={onPagesUpload} className="hidden" disabled={pagesBusy} />
                      </label>

                      <p className="text-xs text-gray-400 mt-1">
                        {pages.length} page{pages.length !== 1 && 's'} live in the Colouring Studio
                        {pages.length === 0 && ' — sample outlines are shown until you upload some'}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Amazon KDP link <span className="text-gray-400 font-normal">— for the printed edition</span>
                  </label>
                  <input
                    value={form.amazonKdpLink}
                    onChange={set('amazonKdpLink')}
                    className="input-field"
                    placeholder="https://www.amazon.in/dp/XXXXXXXXXX"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Adds a "Buy Physical Book" button on the book's page. Leave blank to hide it.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={set('description')} rows={3} className="input-field resize-none" placeholder="A short, fun description…" />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Book type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setForm((f) => ({ ...f, isFree: true }))}
                      className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-colors ${form.isFree ? 'border-green bg-green-100 text-green-dark' : 'border-gray-200 text-gray-500'}`}>
                      🆓 Free
                    </button>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, isFree: false }))}
                      className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-colors ${!form.isFree ? 'border-purple bg-purple-100 text-purple' : 'border-gray-200 text-gray-500'}`}>
                      👑 Premium
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 font-bold text-gray-700">
                  <input type="checkbox" checked={form.featured} onChange={set('featured')} className="w-5 h-5 accent-primary" />
                  Feature on homepage
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={closeForm} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={busy} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                  {busy ? 'Saving…' : editingId ? <><Pencil size={18} /> Save Changes</> : <><Plus size={18} /> Add Book</>}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBooks;
