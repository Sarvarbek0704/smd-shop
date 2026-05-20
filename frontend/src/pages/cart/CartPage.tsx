import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useApplyCouponMutation,
  useRemoveCouponMutation,
} from "@/store/api/cartApi";
import toast from "react-hot-toast";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ChevronRight,
  ArrowRight,
  Loader2,
  PackageOpen,
  AlertTriangle,
  Ticket,
  X,
} from "lucide-react";

export function CartPage() {
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const { data: cart, isLoading } = useGetCartQuery();
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [clearCart, { isLoading: clearing }] = useClearCartMutation();
  const [applyCoupon, { isLoading: applying }] = useApplyCouponMutation();
  const [removeCoupon, { isLoading: removing }] = useRemoveCouponMutation();

  const items = cart?.items ?? [];
  const summary = cart?.summary ?? {
    totalItems: 0,
    totalAmount: 0,
    itemCount: 0,
    subtotal: 0,
    discountAmount: 0,
    couponCode: null,
  };
  const warnings = cart?.warnings ?? [];

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await updateItem({ itemId, quantity }).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  const handleRemove = async (itemId: string, name: string) => {
    try {
      await removeItem(itemId).unwrap();
      toast.success(`"${name}" savatdan olib tashlandi`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  const handleClear = async () => {
    if (!confirm("Savatni to'liq tozalashni xohlaysizmi?")) return;
    try {
      await clearCart().unwrap();
      toast.success("Savat tozalandi");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Xatolik");
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      await applyCoupon(couponCode).unwrap();
      toast.success("Kupon muvaffaqiyatli qo'llanildi");
      setCouponCode("");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Kupon yaroqsiz");
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon().unwrap();
      toast.success("Kupon olib tashlandi");
    } catch (err: any) {
      toast.error("Xatolik yuz berdi");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mb-5">
            <ShoppingBag className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Savat bo'sh</h2>
          <p className="text-slate-500 mb-6 text-sm">Mahsulotlarni qidirib savatga qo'shing</p>
          <Link
            to="/catalog"
            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            Xarid qilish
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-900">
          Bosh sahifa
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">Savat</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Savat{" "}
          <span className="text-slate-400 font-normal text-lg">({summary.totalItems})</span>
        </h1>
        <button
          onClick={handleClear}
          disabled={clearing}
          className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Tozalash
        </button>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">Diqqat</p>
              {warnings.map((w: string, i: number) => (
                <p key={i} className="text-sm text-amber-700">
                  {w}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence mode="popLayout">
            {items.map((item: any) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sticky top-24 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Buyurtma xulosasi</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Mahsulotlar ({summary.itemCount})</span>
                <span className="text-slate-900 font-medium">
                  {(summary.subtotal ?? summary.totalAmount).toLocaleString("uz-UZ")} so'm
                </span>
              </div>

              {summary.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Chegirma (Kupon)</span>
                  <span className="text-emerald-600 font-medium">
                    -{summary.discountAmount.toLocaleString("uz-UZ")} so'm
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Yetkazish</span>
                <span className="text-emerald-600 font-medium">Bepul</span>
              </div>
              <div className="border-t border-stone-100 pt-3 flex justify-between">
                <span className="text-base font-bold text-slate-900">Jami</span>
                <span className="text-xl font-extrabold text-slate-900">
                  {summary.totalAmount.toLocaleString("uz-UZ")} so'm
                </span>
              </div>
            </div>

            {/* Coupon input */}
            <div className="mb-6">
              {summary.couponCode ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <Ticket className="w-4 h-4" />
                    {summary.couponCode}
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    disabled={removing}
                    className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Promokod"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applying || !couponCode.trim()}
                    className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-40 transition-all"
                  >
                    {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Qo'llash"}
                  </button>
                </div>
              )}
            </div>

            <motion.button
              onClick={() => navigate("/checkout")}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
            >
              Buyurtma berish <ArrowRight className="w-4 h-4" />
            </motion.button>

            <Link
              to="/catalog"
              className="block mt-3 text-center text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              Xaridni davom ettirish
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: any;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string, name: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.25 }}
      className="bg-white border border-stone-100 rounded-xl p-4 flex gap-4"
    >
      {/* Image */}
      <Link to={`/products/${item.product.slug}`} className="shrink-0">
        <div className="w-24 h-24 bg-stone-100 rounded-lg overflow-hidden">
          {item.product.image ? (
            <img
              src={`/uploads${item.product.image}`}
              alt={item.product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PackageOpen className="w-8 h-8 text-stone-300" />
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/products/${item.product.slug}`}
          className="text-sm font-medium text-slate-900 hover:text-slate-700 line-clamp-2 mb-1"
        >
          {item.product.name}
        </Link>

        {item.variant && (
          <p className="text-xs text-slate-500 mb-2">{item.variant.name}</p>
        )}

        <div className="flex items-end justify-between mt-auto">
          {/* Quantity */}
          <div className="flex items-center bg-stone-100 rounded-lg overflow-hidden">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-stone-200 disabled:opacity-30 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-9 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-stone-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Price + remove */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">
                {item.pricing.totalPrice.toLocaleString('uz-UZ')} so'm
              </p>
              {item.quantity > 1 && (
                <p className="text-[11px] text-slate-400">
                  {item.pricing.unitPrice.toLocaleString('uz-UZ')} x {item.quantity}
                </p>
              )}
            </div>
            <button
              onClick={() => onRemove(item.id, item.product.name)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}