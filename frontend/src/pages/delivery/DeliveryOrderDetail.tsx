import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  useGetDeliveryDetailQuery,
  useUpdateDeliveryStatusMutation,
} from "@/store/api/deliveryApi";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting: { label: "Kutilmoqda", color: "bg-stone-100 text-stone-700" },
  assigned: { label: "Tayinlangan", color: "bg-blue-100 text-blue-700" },
  picked_up: { label: "Olib olindi", color: "bg-indigo-100 text-indigo-700" },
  on_the_way: { label: "Yo'lda", color: "bg-amber-100 text-amber-700" },
  delivered: { label: "Yetkazildi", color: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Muvaffaqiyatsiz", color: "bg-red-100 text-red-700" },
};

const STATUS_FLOW: Record<string, { next: string; label: string }> = {
  assigned: { next: "picked_up", label: "Olib oldim" },
  picked_up: { next: "on_the_way", label: "Yo'lga chiqdim" },
  on_the_way: { next: "delivered", label: "Yetkazib berdim" },
};

const TIMELINE = [
  { key: "assigned", label: "Tayinlandi" },
  { key: "picked_up", label: "Olib olindi" },
  { key: "on_the_way", label: "Yo'lda" },
  { key: "delivered", label: "Yetkazildi" },
];

const TIMELINE_ORDER = ["assigned", "picked_up", "on_the_way", "delivered"];

export function DeliveryOrderDetail() {
  const { orderId } = useParams();
  const { data: delivery, isLoading } = useGetDeliveryDetailQuery(orderId ?? "");
  const [updateStatus, { isLoading: updating }] = useUpdateDeliveryStatusMutation();
  const [showFailModal, setShowFailModal] = useState(false);
  const [failNote, setFailNote] = useState("");

  const handleNextStatus = async () => {
    if (!delivery) return;
    const flow = STATUS_FLOW[delivery.status];
    if (!flow) return;
    try {
      await updateStatus({ id: delivery.id, status: flow.next }).unwrap();
      toast.success("Holat yangilandi!");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik yuz berdi");
    }
  };

  const handleFail = async () => {
    if (!delivery || !failNote.trim()) return;
    try {
      await updateStatus({ id: delivery.id, status: "failed", notes: failNote }).unwrap();
      toast.success("Holat yangilandi");
      setShowFailModal(false);
      setFailNote("");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Truck className="w-14 h-14 text-stone-300 mb-4" />
        <p className="text-slate-700 font-medium">Buyurtma topilmadi</p>
        <Link to="/delivery" className="mt-3 text-sm text-slate-500 hover:text-slate-900">
          Orqaga
        </Link>
      </div>
    );
  }

  const st = STATUS_LABELS[delivery.status] ?? { label: delivery.status, color: "bg-stone-100 text-stone-700" };
  const flow = STATUS_FLOW[delivery.status];
  const address = delivery.deliveryAddress ?? delivery.delivery_address;
  const pickupAddr = delivery.pickupAddress ?? delivery.pickup_address;
  const order = delivery.order;

  const currentStep = TIMELINE_ORDER.indexOf(delivery.status);

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link
        to="/delivery"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Orqaga
      </Link>

      {/* Header */}
      <div className="bg-white border border-stone-100 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide mb-1">Buyurtma</p>
            <h1 className="text-xl font-bold text-slate-900">
              #{order?.orderNumber ?? delivery.id?.slice(0, 8)}
            </h1>
          </div>
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${st.color}`}>
            {st.label}
          </span>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-0 mt-2">
          {TIMELINE.map((step, i) => {
            const done = i <= currentStep && delivery.status !== "failed";
            const active = i === currentStep && delivery.status !== "failed";
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center">
                <div className="relative flex items-center w-full">
                  {i > 0 && (
                    <div className={`flex-1 h-0.5 ${done ? "bg-slate-900" : "bg-stone-200"}`} />
                  )}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                      active
                        ? "border-slate-900 bg-slate-900"
                        : done
                        ? "border-slate-900 bg-slate-900"
                        : "border-stone-200 bg-white"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-stone-300" />
                    )}
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className={`flex-1 h-0.5 ${i < currentStep && delivery.status !== "failed" ? "bg-slate-900" : "bg-stone-200"}`} />
                  )}
                </div>
                <p className={`text-[10px] mt-1.5 font-medium text-center ${done ? "text-slate-900" : "text-slate-400"}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>

        {delivery.status === "failed" && (
          <div className="mt-4 flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 px-4 py-3 rounded-xl">
            <XCircle className="w-4 h-4" />
            Yetkazib bo'lmadi: {delivery.notes ?? "sabab ko'rsatilmagan"}
          </div>
        )}
      </div>

      {/* Addresses */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-stone-100 rounded-xl p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Manzillar</h2>

        {pickupAddr && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Olish manzili</p>
              <p className="text-sm text-slate-700 font-medium">
                {typeof pickupAddr === "string"
                  ? pickupAddr
                  : [pickupAddr.region, pickupAddr.city, pickupAddr.street].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
        )}

        {address && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Yetkazish manzili</p>
              <p className="text-sm text-slate-700 font-medium">
                {typeof address === "string"
                  ? address
                  : [address.region, address.city, address.street].filter(Boolean).join(", ")}
              </p>
              {address.zip && (
                <p className="text-xs text-slate-400">{address.zip}</p>
              )}
            </div>
          </div>
        )}

        {delivery.estimatedAt && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Kutilgan vaqt</p>
              <p className="text-sm text-slate-700 font-medium">
                {new Date(delivery.estimatedAt).toLocaleString("uz-UZ", {
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Buyer info */}
      {order?.buyer && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-stone-100 rounded-xl p-5"
        >
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Mijoz</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {order.buyer.firstName} {order.buyer.lastName}
              </p>
              {order.buyer.phone && (
                <a
                  href={`tel:${order.buyer.phone}`}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mt-0.5"
                >
                  <Phone className="w-3 h-3" />
                  {order.buyer.phone}
                </a>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Order items */}
      {order?.items && order.items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-stone-100 rounded-xl"
        >
          <div className="flex items-center gap-2 px-5 py-4 border-b border-stone-100">
            <ShoppingBag className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              Mahsulotlar ({order.items.length})
            </h2>
          </div>
          <div className="divide-y divide-stone-50">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                {item.productImage ? (
                  <img
                    src={`/uploads${item.productImage}`}
                    alt={item.productName}
                    className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-stone-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{item.productName}</p>
                  <p className="text-xs text-slate-500">{item.quantity} ta × {Number(item.unitPrice).toLocaleString("uz-UZ")} so'm</p>
                </div>
                <p className="text-sm font-bold text-slate-900 shrink-0">
                  {Number(item.totalPrice).toLocaleString("uz-UZ")} so'm
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 py-3.5 bg-stone-50 rounded-b-xl flex justify-between items-center">
            <span className="text-sm text-slate-600 font-medium">Jami</span>
            <span className="text-base font-bold text-slate-900">
              {Number(order.finalAmount ?? order.totalAmount).toLocaleString("uz-UZ")} so'm
            </span>
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      {flow && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex gap-3"
        >
          <button
            onClick={handleNextStatus}
            disabled={updating}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            {updating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                {flow.label}
              </>
            )}
          </button>
          <button
            onClick={() => setShowFailModal(true)}
            disabled={updating}
            className="px-5 py-3.5 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            Muammo
          </button>
        </motion.div>
      )}

      {delivery.status === "delivered" && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 text-emerald-700 font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          Buyurtma muvaffaqiyatli yetkazildi!
        </div>
      )}

      {/* Fail modal */}
      {showFailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2">Muammoni bildiring</h3>
            <p className="text-sm text-slate-500 mb-4">Nima uchun yetkazib bo'lmadi?</p>
            <textarea
              value={failNote}
              onChange={(e) => setFailNote(e.target.value)}
              placeholder="Sababni yozing..."
              rows={3}
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/20 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowFailModal(false); setFailNote(""); }}
                className="flex-1 py-2.5 border border-stone-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                Bekor
              </button>
              <button
                onClick={handleFail}
                disabled={!failNote.trim() || updating}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Yuborish"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
