import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetAllDeliveriesQuery,
  useGetDeliveryStatsQuery,
  useAssignCourierMutation,
  useGetAdminUsersQuery,
} from "@/store/api/adminApi";
import toast from "react-hot-toast";
import { Loader2, Truck, MapPin, UserCheck, X, Check } from "lucide-react";

const ST: Record<string, string> = {
  waiting: "bg-amber-100 text-amber-800",
  assigned: "bg-blue-100 text-blue-800",
  picked_up: "bg-indigo-100 text-indigo-800",
  on_the_way: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
};

const ST_LABEL: Record<string, string> = {
  waiting: "Kutilmoqda",
  assigned: "Tayinlangan",
  picked_up: "Olib ketildi",
  on_the_way: "Yo'lda",
  delivered: "Yetkazildi",
  failed: "Muvaffaqiyatsiz",
};

export function AdminDelivery() {
  const { data: stats, isLoading: statsLoading } = useGetDeliveryStatsQuery();
  const { data, isLoading, refetch } = useGetAllDeliveriesQuery({ limit: 50 });
  const { data: usersData } = useGetAdminUsersQuery({ role: "delivery", limit: 50 });
  const [assignCourier, { isLoading: assigning }] = useAssignCourierMutation();

  const [assignModal, setAssignModal] = useState<{
    deliveryId: string;
    orderNumber: string;
  } | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState("");
  const [notes, setNotes] = useState("");

  const deliveries = data?.data ?? [];
  const couriers = usersData?.data ?? [];

  const handleAssign = async () => {
    if (!assignModal || !selectedCourierId) {
      toast.error("Kuryerni tanlang");
      return;
    }
    try {
      await assignCourier({
        deliveryId: assignModal.deliveryId,
        courierId: selectedCourierId,
        notes: notes || undefined,
      }).unwrap();
      toast.success("Kuryer tayinlandi");
      setAssignModal(null);
      setSelectedCourierId("");
      setNotes("");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">Yetkazmalar</h1>

      {/* Stats */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {Object.entries(ST).map(([key, color]) => (
            <div
              key={key}
              className="bg-white border border-stone-100 rounded-xl p-3 text-center"
            >
              <p className="text-lg font-bold text-slate-900">
                {(stats as any)[key] ?? 0}
              </p>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-1 ${color}`}>
                {ST_LABEL[key] ?? key}
              </span>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : deliveries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Truck className="w-16 h-16 text-stone-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">Yetkazmalar yo'q</h3>
        </div>
      ) : (
        <div className="space-y-2.5">
          {deliveries.map((d: any) => {
            const canAssign = ["waiting", "assigned"].includes(d.status);
            return (
              <div
                key={d.id}
                className="bg-white border border-stone-100 rounded-xl p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-slate-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {d.order?.orderNumber ?? "Noma'lum"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                      {d.courier ? (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <UserCheck className="w-3 h-3" />
                          {d.courier.firstName} {d.courier.lastName}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          Kuryer tayinlanmagan
                        </span>
                      )}
                      {d.deliveryAddress && (
                        <span className="flex items-center gap-1 hidden sm:flex">
                          <MapPin className="w-3 h-3" />
                          {String(d.deliveryAddress).slice(0, 30)}
                          {String(d.deliveryAddress).length > 30 ? "…" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${ST[d.status] ?? "bg-stone-100 text-stone-700"}`}>
                      {ST_LABEL[d.status] ?? d.status}
                    </span>
                    {canAssign && (
                      <button
                        onClick={() =>
                          setAssignModal({
                            deliveryId: d.id,
                            orderNumber: d.order?.orderNumber ?? d.id,
                          })
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Kuryer tayinlash</span>
                        <span className="sm:hidden">Tayinlash</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign courier modal */}
      <AnimatePresence>
        {assignModal && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
            onClick={(e) => e.target === e.currentTarget && setAssignModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate-900">Kuryer tayinlash</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {assignModal.orderNumber}
                  </p>
                </div>
                <button
                  onClick={() => setAssignModal(null)}
                  className="p-2 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                    Kuryer *
                  </label>
                  {couriers.length === 0 ? (
                    <p className="text-sm text-slate-500 py-2">
                      Kuryer topilmadi. Avval delivery roli bering.
                    </p>
                  ) : (
                    <select
                      value={selectedCourierId}
                      onChange={(e) => setSelectedCourierId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 bg-white"
                    >
                      <option value="">— Kuryerni tanlang —</option>
                      {couriers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                          {c.phone ? ` · ${c.phone}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                    Izoh (ixtiyoriy)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Qo'shimcha ko'rsatmalar..."
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setAssignModal(null)}
                  className="flex-1 py-2.5 border border-stone-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
                >
                  Bekor
                </button>
                <button
                  onClick={handleAssign}
                  disabled={assigning || !selectedCourierId}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {assigning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Check className="w-4 h-4" /> Tayinlash</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
