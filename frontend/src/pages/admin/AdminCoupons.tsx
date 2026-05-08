import { useState } from "react";
import {
  useGetAdminCouponsQuery,
  useCreateCouponMutation,
  useDeleteCouponMutation,
} from "@/store/api/adminApi";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Trash2, Ticket, X, Check } from "lucide-react";

export function AdminCoupons() {
  const { data, isLoading, refetch } = useGetAdminCouponsQuery();
  const [createCoupon, { isLoading: creating }] = useCreateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    usageLimit: "",
    validUntil: "",
  });

  const coupons = data?.data ?? [];

  const handleCreate = async () => {
    if (!form.code || !form.value) {
      toast.error("Kod va qiymatni kiriting");
      return;
    }
    try {
      await createCoupon({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        ...(form.minOrderAmount && {
          minOrderAmount: Number(form.minOrderAmount),
        }),
        ...(form.maxDiscountAmount && {
          maxDiscountAmount: Number(form.maxDiscountAmount),
        }),
        ...(form.usageLimit && { usageLimit: Number(form.usageLimit) }),
        ...(form.validUntil && { validUntil: form.validUntil }),
      }).unwrap();
      toast.success("Kupon yaratildi");
      setShowForm(false);
      setForm({
        code: "",
        type: "percentage",
        value: "",
        minOrderAmount: "",
        maxDiscountAmount: "",
        usageLimit: "",
        validUntil: "",
      });
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`"${code}" kuponini o'chirishni xohlaysizmi?`)) return;
    try {
      await deleteCoupon(id).unwrap();
      toast.success("Kupon o'chirildi");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Kuponlar</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 flex items-center gap-2 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Yopish" : "Yangi kupon"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="Kod (SUMMER2026)"
                  className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="percentage">Foiz (%)</option>
                  <option value="fixed">Sobit summa</option>
                </select>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="Qiymat"
                  className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) =>
                    setForm({ ...form, minOrderAmount: e.target.value })
                  }
                  placeholder="Min buyurtma"
                  className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <input
                  type="number"
                  value={form.maxDiscountAmount}
                  onChange={(e) =>
                    setForm({ ...form, maxDiscountAmount: e.target.value })
                  }
                  placeholder="Max chegirma"
                  className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <input
                  type="number"
                  value={form.usageLimit}
                  onChange={(e) =>
                    setForm({ ...form, usageLimit: e.target.value })
                  }
                  placeholder="Foydalanish limiti"
                  className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <input
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(e) =>
                    setForm({ ...form, validUntil: e.target.value })
                  }
                  className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}{" "}
                Yaratish
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Ticket className="w-16 h-16 text-stone-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">
            Kuponlar yo'q
          </h3>
        </div>
      ) : (
        <div className="space-y-2.5">
          {coupons.map((c: any) => (
            <div
              key={c.id}
              className="bg-white border border-stone-100 rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-11 h-11 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 font-mono">
                    {c.code}
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"}`}
                  >
                    {c.isActive ? "Aktiv" : "Noaktiv"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>
                    {c.type === "percentage"
                      ? `${c.value}%`
                      : `${Number(c.value).toLocaleString()} so'm`}
                  </span>
                  <span>
                    {c.usageCount}/{c.usageLimit ?? "∞"} ishlatilgan
                  </span>
                  {c.validUntil && (
                    <span>
                      gacha:{" "}
                      {new Date(c.validUntil).toLocaleDateString("uz-UZ")}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(c.id, c.code)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
