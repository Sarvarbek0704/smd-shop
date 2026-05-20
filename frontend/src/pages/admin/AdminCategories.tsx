import { useState } from "react";
import { motion } from "framer-motion";
import {
  useGetAdminCategoriesQuery,
  useCreateAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
  useDeleteAdminCategoryMutation,
} from "@/store/api/adminApi";
import toast from "react-hot-toast";
import {
  Loader2,
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  X,
  Check,
  Tag,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  parentId?: string | null;
  children?: Category[];
}

function CategoryRow({
  cat,
  depth,
  onEdit,
  onDelete,
}: {
  cat: Category;
  depth: number;
  onEdit: (cat: Category) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = cat.children && cat.children.length > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 rounded-xl transition-colors group"
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-5 h-5 flex items-center justify-center text-slate-400 transition-transform ${
            hasChildren ? "" : "opacity-0 pointer-events-none"
          } ${expanded ? "rotate-90" : ""}`}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <div className={`w-2 h-2 rounded-full ${cat.isActive ? "bg-emerald-500" : "bg-stone-300"}`} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{cat.name}</p>
          <p className="text-[11px] text-slate-400">{cat.slug}</p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(cat)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(cat.id, cat.name)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
          cat.isActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"
        }`}>
          {cat.isActive ? "Aktiv" : "Nofaol"}
        </span>
      </motion.div>

      {hasChildren && expanded &&
        cat.children!.map((child) => (
          <CategoryRow
            key={child.id}
            cat={child}
            depth={depth + 1}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </>
  );
}

const EMPTY_FORM = { name: "", slug: "", description: "", isActive: true, sortOrder: 0, parentId: "" };

export function AdminCategories() {
  const { data, isLoading } = useGetAdminCategoriesQuery();
  const [createCategory, { isLoading: creating }] = useCreateAdminCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateAdminCategoryMutation();
  const [deleteCategory] = useDeleteAdminCategoryMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const categories: Category[] = data?.data ?? data ?? [];

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
      parentId: cat.parentId ?? "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" toifasini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await deleteCategory(id).unwrap();
      toast.success("Toifa o'chirildi");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error("Nom kiritish shart");
    try {
      const payload = {
        ...form,
        parentId: form.parentId || null,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
      };
      if (editingId) {
        await updateCategory({ id: editingId, ...payload }).unwrap();
        toast.success("Toifa yangilandi");
      } else {
        await createCategory(payload).unwrap();
        toast.success("Toifa qo'shildi");
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  // Flatten categories for parent selector
  const flatCats: Category[] = [];
  const flatten = (cats: Category[]) => {
    for (const c of cats) {
      flatCats.push(c);
      if (c.children?.length) flatten(c.children);
    }
  };
  flatten(categories);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-slate-700" />
          <h1 className="text-xl font-bold text-slate-900">Kategoriyalar</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Qo'shish
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-stone-100 rounded-xl text-center">
          <Tag className="w-12 h-12 text-stone-300 mb-3" />
          <p className="text-slate-500 font-medium">Toifalar yo'q</p>
          <button onClick={openCreate} className="mt-3 text-sm text-slate-900 font-semibold underline">
            Birinchisini qo'shing
          </button>
        </div>
      ) : (
        <div className="bg-white border border-stone-100 rounded-xl py-2">
          {categories.map((cat) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              depth={0}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? "Toifani tahrirlash" : "Yangi toifa"}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-900" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nom *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  placeholder="Toifa nomi"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  placeholder="avtomatik-generatsiya"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tavsif</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  placeholder="Ixtiyoriy tavsif"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Ota-toifa</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 bg-white"
                >
                  <option value="">— Asosiy toifa —</option>
                  {flatCats
                    .filter((c) => c.id !== editingId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tartib raqam</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    min={0}
                  />
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      form.isActive ? "bg-slate-900" : "bg-stone-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        form.isActive ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-slate-600">Aktiv</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-stone-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                Bekor
              </button>
              <button
                onClick={handleSubmit}
                disabled={creating || updating}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {creating || updating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Check className="w-4 h-4" /> Saqlash</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
