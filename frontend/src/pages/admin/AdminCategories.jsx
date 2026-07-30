import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Pencil, Trash2, X, Tags } from 'lucide-react';
import toast from 'react-hot-toast';
import categoryService from '../../services/categoryService';
import { setCategories } from '../../store/slices/catalogSlice';
import { getCategories } from '../../data/catalog';
import Loader from '../../components/common/Loader';

const PRESET_COLORS = ['#FF6B6B', '#FF9F43', '#FFD93D', '#6BCB77', '#4D96FF', '#9B5DE5', '#F15BB5', '#34495E'];

// A kid-friendly spread of icons to choose from.
const PRESET_EMOJIS = [
  '🦁', '🐶', '🐱', '🐘', '🦕', '🦖', '🐢', '🐠', '🦋', '🐝',
  '🦄', '🐉', '🐰', '🐼', '🦊', '🐸', '🦉', '🐧', '🦩', '🐴',
  '🚗', '🚚', '🚂', '✈️', '🚀', '🚁', '🚜', '🚲', '⛵', '🏎️',
  '🌸', '🌳', '🌈', '☀️', '🌙', '⭐', '🌻', '🍎', '🍦', '🎈',
  '🏰', '👑', '🧚', '🦸', '🧙', '🎃', '🎄', '⚽', '🎵', '❤️',
  '🔤', '🔢', '📚', '✏️', '🎨', '🖍️', '🧩', '🎁', '🌀', '🎉',
];

const emptyForm = { name: '', description: '', colorHex: '#FF6B6B', emoji: '🎨', sortOrder: 0, isActive: true, bookType: 'BOTH' };

// A theme shows in a tab when it's scoped to that line, or shared (BOTH).
const inTab = (cat, tab) => {
  const t = cat.bookType || 'BOTH';
  return t === 'BOTH' || t === tab;
};

const AdminCategories = () => {
  const books = useSelector((s) => s.catalog.books);
  const dispatch = useDispatch();

  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [typeTab, setTypeTab] = useState('COLOURING');

  // fresh=true after an edit so the browser cache doesn't hand back stale data.
  const load = async (fresh = false) => {
    try {
      setCats(await categoryService.getAll(fresh));
    } catch {
      toast.error('Could not load categories.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // keep the storefront's category list in sync after changes
  const refreshStore = async () => {
    const r = await getCategories({ fresh: true });
    if (r.live && r.data?.length) dispatch(setCategories(r.data));
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // New themes default to the line you're viewing.
  const openAdd = () => { setForm({ ...emptyForm, bookType: typeTab }); setEditingId(null); setShowForm(true); };
  const openEdit = (c) => {
    setForm({
      name: c.name || '',
      description: c.description || '',
      colorHex: c.colorHex || '#FF6B6B',
      emoji: c.emoji || '🎨',
      sortOrder: c.sortOrder ?? 0,
      isActive: true,
      bookType: c.bookType || 'BOTH',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Please enter a category name.');
    setBusy(true);
    try {
      if (editingId) await categoryService.adminUpdate(editingId, form);
      else await categoryService.adminCreate(form);
      await load(true);
      await refreshStore();
      toast.success(editingId ? 'Category updated!' : 'Category added! 🎉');
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save the category.');
    } finally {
      setBusy(false);
    }
  };

  const lineName = (t) => (t === 'STORY' ? 'Story' : 'Colouring');

  const remove = async (c) => {
    const scope = c.bookType || 'BOTH';
    const otherLine = typeTab === 'STORY' ? 'COLOURING' : 'STORY';

    // A SHARED theme is one record used by both lines. "Removing" it from the
    // tab you're on must NOT delete it — it just stops offering it on this line,
    // so the other product line keeps it. This is the fix for a story-category
    // removal wiping the colouring one too.
    if (scope === 'BOTH') {
      if (!window.confirm(
        `Remove "${c.name}" from ${lineName(typeTab)} themes?\n\nIt stays available for ${lineName(otherLine)} books.`
      )) return;
      try {
        await categoryService.adminUpdate(c.id, {
          name: c.name,
          description: c.description,
          colorHex: c.colorHex,
          bookType: otherLine, // narrow the scope instead of deleting
        });
        await load(true);
        await refreshStore();
        toast.success(`"${c.name}" removed from ${lineName(typeTab)} — still available for ${lineName(otherLine)}.`, { duration: 6000 });
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Could not update the category.');
      }
      return;
    }

    // Belongs to this line only — actually remove it (server deletes or archives).
    const visible = books.filter(
      (b) => b.categorySlug === c.slug && (b.bookType || 'COLOURING') === typeTab
    ).length;
    const warn = visible > 0
      ? `\n\nIt still holds ${visible} book${visible !== 1 ? 's' : ''}, so it will be archived (hidden) rather than deleted.`
      : '';
    if (!window.confirm(`Remove "${c.name}" from ${lineName(typeTab)} themes?${warn}`)) return;
    try {
      const res = await categoryService.adminDelete(c.id);
      await load(true);
      await refreshStore();
      toast.success(res?.message || `"${c.name}" removed`, { duration: 6000 });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not remove the category.');
    }
  };

  if (loading) return <Loader />;

  const shown = cats.filter((c) => inTab(c, typeTab));

  return (
    <div>
      <Helmet><title>Manage Categories - KidsColour Admin</title></Helmet>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl mb-1">Categories</h1>
          <p className="text-gray-500">{cats.length} theme{cats.length !== 1 && 's'} across the store</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> Add Category
        </button>
      </div>

      {/* The two product lines */}
      <div className="flex gap-3 mb-6 border-b border-gray-200">
        {[
          { id: 'COLOURING', label: 'Colouring Themes', emoji: '🎨', accent: 'border-purple text-purple' },
          { id: 'STORY', label: 'Story Themes', emoji: '📖', accent: 'border-blue text-blue' },
        ].map((t) => {
          const n = cats.filter((c) => inTab(c, t.id)).length;
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

      {shown.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-3">{typeTab === 'STORY' ? '📖' : '🎨'}</div>
          <p className="font-bold mb-2">No {typeTab === 'STORY' ? 'story' : 'colouring'} themes yet</p>
          <button onClick={openAdd} className="text-primary font-bold">Add your first theme →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shown.map((c, i) => {
            // Count only the books of the line you're viewing.
            const count = books.filter(
              (b) => b.categorySlug === c.slug && (b.bookType || 'COLOURING') === typeTab
            ).length;
            const scope = c.bookType || 'BOTH';
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i % 6) * 0.04 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-2xl" style={{ background: c.colorHex || '#FF6B6B' }}>
                  {c.emoji || ''}
                </div>
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 truncate">{c.name}</h3>
                    {scope === 'BOTH' && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0" title="Used by both story and colouring books">
                        SHARED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-mono truncate">/{c.slug}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description || '—'}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs font-bold text-gray-400">
                      {count} {typeTab === 'STORY' ? 'story' : 'colouring'} book{count !== 1 && 's'}
                    </span>
                    <button onClick={() => openEdit(c)} className="text-blue hover:underline text-xs font-bold flex items-center gap-1">
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => remove(c)} className="text-red-500 hover:underline text-xs font-bold flex items-center gap-1">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.form
              onClick={(e) => e.stopPropagation()}
              onSubmit={save}
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-float w-full max-w-md p-6 max-h-[88vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl">{editingId ? 'Edit Category' : 'Add Category'}</h2>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700"><X size={24} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Name *</label>
                  <input value={form.name} onChange={set('name')} className="input-field" placeholder="e.g. Dinosaurs" />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Icon</label>
                  <div className="flex items-center gap-3">
                    {/* Live preview on the chosen colour */}
                    <div className="w-11 h-11 rounded-lg shrink-0 flex items-center justify-center text-2xl" style={{ background: form.colorHex }}>
                      {form.emoji}
                    </div>
                    <div className="grid grid-cols-10 gap-0.5 flex-1 max-h-16 overflow-y-auto p-1 rounded-lg border border-gray-100 bg-gray-50">
                      {PRESET_EMOJIS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, emoji: em }))}
                          className={`aspect-square rounded text-base leading-none transition-transform hover:scale-125 ${form.emoji === em ? 'bg-primary-100 ring-1 ring-primary' : ''}`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Used by</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'COLOURING', label: '🎨 Colouring', on: 'border-purple bg-purple-100 text-purple' },
                      { id: 'STORY', label: '📖 Story', on: 'border-blue bg-blue-100 text-blue' },
                      { id: 'BOTH', label: '🔗 Both', on: 'border-gray-800 bg-gray-100 text-gray-800' },
                    ].map((o) => (
                      <button
                        key={o.id} type="button"
                        onClick={() => setForm((f) => ({ ...f, bookType: o.id }))}
                        className={`py-2.5 rounded-xl font-bold text-xs border-2 transition-colors ${
                          form.bookType === o.id ? o.on : 'border-gray-200 text-gray-500'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    "Both" shows the theme under Story <em>and</em> Colouring books.
                  </p>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={set('description')} rows={2} className="input-field resize-none" placeholder="Short, fun description…" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Colour</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c} type="button"
                        onClick={() => setForm((f) => ({ ...f, colorHex: c }))}
                        className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${form.colorHex === c ? 'ring-2 ring-offset-2 ring-gray-800' : ''}`}
                        style={{ background: c }}
                      />
                    ))}
                    <input type="color" value={form.colorHex} onChange={set('colorHex')} className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={busy} className="btn-primary flex-1 disabled:opacity-60">
                  {busy ? 'Saving…' : editingId ? 'Save Changes' : 'Add Category'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCategories;
