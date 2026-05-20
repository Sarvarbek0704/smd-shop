import { useState } from "react";
import { motion } from "framer-motion";
import {
  useGetAdminBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} from "@/store/api/adminApi";
import toast from "react-hot-toast";
import {
  Loader2,
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  GalleryHorizontal,
} from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  sortOrder: number;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
}

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  sortOrder: 0,
  isActive: true,
  startsAt: "",
  endsAt: "",
};

export function AdminBanners() {
  const { data, isLoading } = useGetAdminBannersQuery();
  const [createBanner, { isLoading: creating }] = useCreateBannerMutation();
  const [updateBanner, { isLoading: updating }] = useUpdateBannerMutation();
  const [deleteBanner] = useDeleteBannerMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const banners: Banner[] = data?.data ?? data ?? [];

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (b: Banner) => {
    setEditingId(b.id);
    setForm({
      title: b.title,
      subtitle: b.subtitle ?? "",
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl ?? "",
      sortOrder: b.sortOrder,
      isActive: b.isActive,
      startsAt: b.startsAt ? b.startsAt.slice(0, 10) : "",
      endsAt: b.endsAt ? b.endsAt.slice(0, 10) : "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" bannerni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await deleteBanner(id).unwrap();
      toast.success("Banner o'chirildi");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error("Sarlavha kiritish shart");
    if (!form.imageUrl.trim()) return toast.error("Rasm URL kiritish shart");
    try {
      const payload = {
        ...form,
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined,
        linkUrl: form.linkUrl || undefined,
        subtitle: form.subtitle || undefined,
      };
      if (editingId) {
        await updateBanner({ id: editingId, ...payload }).unwrap();
        toast.success("Banner yangilandi");
      } else {
        await createBanner(payload).unwrap();
        toast.success("Banner qo'shildi");
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GalleryHorizontal className="w-5 h-5 text-slate-700" />
          <h1 className="text-xl font-bold text-slate-900">Bannerlar</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Yangi banner
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-stone-100 rounded-xl text-center">
          <ImageIcon className="w-12 h-12 text-stone-300 mb-3" />
          <p className="text-slate-500 font-medium">Bannerlar yo'q</p>
          <button onClick={openCreate} className="mt-3 text-sm text-slate-900 font-semibold underline">
            Birinchi bannerni qo'shing
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {banners
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((banner, i) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white border rounded-2xl overflow-hidden group ${
                  banner.isActive ? "border-stone-100" : "border-stone-100 opacity-60"
                }`}
              >
                {/* Banner image preview */}
                <div className="relative h-36 bg-stone-100">
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl.startsWith("/uploads") ? banner.imageUrl : `/uploads${banner.imageUrl}`}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-stone-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <span
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold backdrop-blur-sm ${
                        banner.isActive
                          ? "bg-emerald-500/90 text-white"
                          : "bg-stone-500/80 text-white"
                      }`}
                    >
                      {banner.isActive ? "Aktiv" : "Nofaol"}
                    </span>
                    <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-black/50 text-white backdrop-blur-sm">
                      #{banner.sortOrder}
                    </span>
                  </div>
                </div>

                {/* Banner info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{banner.title}</p>
                      {banner.subtitle && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{banner.subtitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {banner.linkUrl && (
                        <a
                          href={banner.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg hover:bg-stone-100 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => openEdit(banner)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id, banner.title)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {(banner.startsAt || banner.endsAt) && (
                    <p className="text-[11px] text-slate-400 mt-2">
                      {banner.startsAt
                        ? new Date(banner.startsAt).toLocaleDateString("uz-UZ")
                        : "—"}{" "}
                      →{" "}
                      {banner.endsAt
                        ? new Date(banner.endsAt).toLocaleDateString("uz-UZ")
                        : "Cheksiz"}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl my-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? "Bannerni tahrirlash" : "Yangi banner"}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-900" />
              </button>
            </div>

            {/* Image preview in modal */}
            {form.imageUrl && (
              <div className="relative h-28 bg-stone-100 rounded-xl overflow-hidden mb-4">
                <img
                  src={form.imageUrl.startsWith("/uploads") ? form.imageUrl : form.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sarlavha *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  placeholder="Banner sarlavhasi"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Kichik matn</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  placeholder="Ixtiyoriy kichik matn"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Rasm URL *</label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  placeholder="/uploads/banners/image.jpg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Havola URL</label>
                <input
                  type="text"
                  value={form.linkUrl}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  placeholder="/catalog/telefon"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Boshlanish</label>
                  <input
                    type="date"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tugash</label>
                  <input
                    type="date"
                    value={form.endsAt}
                    onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                    className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tartib</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="mt-1 w-24 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    min={0}
                  />
                </div>
                <div className="flex items-center gap-2">
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
