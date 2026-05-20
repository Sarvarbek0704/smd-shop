import { motion } from "framer-motion";
import { useGetDeliveryHistoryQuery } from "@/store/api/deliveryApi";
import { Loader2, CheckCircle2, XCircle, Clock, Truck } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  delivered: { label: "Yetkazildi", color: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Muvaffaqiyatsiz", color: "bg-red-100 text-red-700" },
};

export function DeliveryHistory() {
  const { data, isLoading } = useGetDeliveryHistoryQuery();
  const items = data?.data ?? data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Clock className="w-16 h-16 text-stone-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-1">Tarix bo'sh</h3>
        <p className="text-sm text-slate-500">Yakunlangan buyurtmalar shu yerda ko'rinadi</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((d: any, i: number) => {
        const st = STATUS_LABELS[d.status] ?? { label: d.status, color: "bg-stone-100 text-stone-700" };
        const address = d.deliveryAddress ?? d.delivery_address;

        return (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-white border border-stone-100 rounded-xl p-4 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              d.status === "delivered" ? "bg-emerald-100" : "bg-red-100"
            }`}>
              {d.status === "delivered" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-slate-900">
                  #{d.order?.orderNumber ?? d.orderId?.slice(0, 8)}
                </p>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${st.color}`}>
                  {st.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {address
                  ? typeof address === "string"
                    ? address
                    : `${address.city ?? ""}, ${address.street ?? ""}`
                  : "Manzil yo'q"}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-xs text-slate-500">
                {d.deliveredAt
                  ? new Date(d.deliveredAt).toLocaleDateString("uz-UZ", {
                      month: "short",
                      day: "numeric",
                    })
                  : d.updatedAt
                  ? new Date(d.updatedAt).toLocaleDateString("uz-UZ", {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
