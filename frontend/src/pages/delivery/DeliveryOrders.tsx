import { useState } from "react";
import { motion } from "framer-motion";
import { useGetMyDeliveriesQuery, useUpdateDeliveryStatusMutation } from "@/store/api/deliveryApi";
import toast from "react-hot-toast";
import {
  MapPin,
  Phone,
  Package,
  Clock,
  Loader2,
  Truck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const STATUS_FLOW: Record<string, { next: string; label: string; color: string }> = {
  assigned: { next: "picked_up", label: "Olib olindi", color: "bg-blue-100 text-blue-700" },
  picked_up: { next: "on_the_way", label: "Yo'lda", color: "bg-indigo-100 text-indigo-700" },
  on_the_way: { next: "delivered", label: "Yetkazildi", color: "bg-amber-100 text-amber-700" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting: { label: "Kutilmoqda", color: "bg-stone-100 text-stone-700" },
  assigned: { label: "Tayinlangan", color: "bg-blue-100 text-blue-700" },
  picked_up: { label: "Olib olindi", color: "bg-indigo-100 text-indigo-700" },
  on_the_way: { label: "Yo'lda", color: "bg-amber-100 text-amber-700" },
  delivered: { label: "Yetkazildi", color: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Muvaffaqiyatsiz", color: "bg-red-100 text-red-700" },
};

export function DeliveryOrders() {
  const { data, isLoading } = useGetMyDeliveriesQuery();
  const [updateStatus, { isLoading: updating }] = useUpdateDeliveryStatusMutation();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const deliveries = data?.data ?? data ?? [];

  const handleStatusUpdate = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success("Holat yangilandi!");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
    setUpdatingId(null);
  };

  const handleFailed = async (id: string) => {
    const notes = prompt("Sabab:");
    if (!notes) return;
    setUpdatingId(id);
    try {
      await updateStatus({ id, status: "failed", notes }).unwrap();
      toast.success("Holat yangilandi");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
    setUpdatingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Truck className="w-16 h-16 text-stone-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-1">
          Hozircha buyurtma yo'q
        </h3>
        <p className="text-sm text-slate-500">
          Sizga tayinlangan buyurtmalar shu yerda ko'rinadi
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deliveries.map((d: any, i: number) => {
        const st = STATUS_LABELS[d.status] ?? STATUS_LABELS.waiting;
        const flow = STATUS_FLOW[d.status];
        const address = d.deliveryAddress ?? d.delivery_address;
        const isUpdating = updatingId === d.id;

        return (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-stone-100 rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  #{d.order?.orderNumber ?? d.orderId?.slice(0, 8)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {d.estimatedAt
                    ? new Date(d.estimatedAt).toLocaleString("uz-UZ", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Vaqt belgilanmagan"}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${st.color}`}>
                {st.label}
              </span>
            </div>

            {/* Addresses */}
            <div className="space-y-2 mb-4">
              {d.pickupAddress && (
                <div className="flex items-start gap-2 text-sm">
                  <Package className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Olish</p>
                    <p className="text-slate-700">
                      {typeof d.pickupAddress === "string"
                        ? d.pickupAddress
                        : `${d.pickupAddress.city}, ${d.pickupAddress.street}`}
                    </p>
                  </div>
                </div>
              )}
              {address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Yetkazish</p>
                    <p className="text-slate-700">
                      {typeof address === "string"
                        ? address
                        : `${address.region ?? ""}, ${address.city ?? ""}, ${address.street ?? ""}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {flow && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusUpdate(d.id, flow.next)}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> {flow.label}
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleFailed(d.id)}
                  disabled={isUpdating}
                  className="px-4 py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <AlertCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            {d.status === "delivered" && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> Muvaffaqiyatli yetkazildi
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
