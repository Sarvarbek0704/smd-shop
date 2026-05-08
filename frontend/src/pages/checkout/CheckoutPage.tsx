import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useGetCartQuery } from '@/store/api/cartApi';
import { useCheckoutMutation } from '@/store/api/ordersApi';
import {
  MapPin,
  CreditCard,
  Check,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Banknote,
  Smartphone,
  PackageOpen,
} from 'lucide-react';

const addressSchema = z.object({
  region: z.string().min(2, 'Viloyatni kiriting'),
  city: z.string().min(2, 'Shaharni kiriting'),
  street: z.string().min(3, 'Manzilni kiriting'),
  zip: z.string().optional(),
  apartment: z.string().optional(),
  note: z.string().optional(),
});

type AddressForm = z.infer<typeof addressSchema>;

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Naqd pul', desc: 'Yetkazib berilganda to\'lash', icon: Banknote },
  { id: 'payme', label: 'Payme', desc: 'Karta orqali', icon: CreditCard },
  { id: 'click', label: 'Click', desc: 'Karta orqali', icon: Smartphone },
  { id: 'uzum', label: 'Uzum Bank', desc: 'Uzum karta orqali', icon: CreditCard },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading: cartLoading } = useGetCartQuery();
  const [checkout, { isLoading: submitting }] = useCheckoutMutation();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [notes, setNotes] = useState('');

  const items = cart?.items ?? [];
  const summary = cart?.summary ?? { totalItems: 0, totalAmount: 0, itemCount: 0 };

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<AddressForm>({ resolver: zodResolver(addressSchema) });

  const handleNextStep = () => {
    if (step === 1) {
      handleSubmit(() => setStep(2))();
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleCheckout = async () => {
    const address = getValues();
    try {
      const result = await checkout({
        shippingAddress: address,
        paymentMethod,
        ...(couponCode && { couponCode }),
        ...(notes && { notes }),
      }).unwrap();
      toast.success('Buyurtma muvaffaqiyatli yaratildi!');
      // result massiv bo'lishi mumkin (seller bo'yicha guruhlangan)
      const orderId = Array.isArray(result) ? result[0]?.id : result?.id;
      navigate(orderId ? `/orders/${orderId}` : '/orders');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Xatolik yuz berdi');
    }
  };

  if (cartLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <PackageOpen className="w-16 h-16 text-stone-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Savat bo'sh</h2>
        <Link to="/catalog" className="text-sm text-slate-500 hover:text-slate-900">Katalogga qaytish</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-900">Bosh sahifa</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/cart" className="hover:text-slate-900">Savat</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">Buyurtma berish</span>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { num: 1, label: 'Manzil' },
          { num: 2, label: 'To\'lov' },
          { num: 3, label: 'Tasdiqlash' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-3">
            {i > 0 && <div className={`w-12 h-px ${step > i ? 'bg-slate-900' : 'bg-stone-200'}`} />}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step > s.num ? 'bg-slate-900 text-white' :
                step === s.num ? 'bg-slate-900 text-white' :
                'bg-stone-100 text-slate-400'
              }`}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step >= s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form area */}
        <div className="lg:col-span-3">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-stone-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-bold text-slate-900">Yetkazish manzili</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Viloyat *</label>
                    <input
                      {...register('region')}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder="Toshkent viloyati"
                    />
                    {errors.region && <p className="mt-1 text-xs text-red-600">{errors.region.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Shahar *</label>
                    <input
                      {...register('city')}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder="Toshkent"
                    />
                    {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Ko'cha, uy *</label>
                  <input
                    {...register('street')}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Amir Temur ko'chasi, 12-uy"
                  />
                  {errors.street && <p className="mt-1 text-xs text-red-600">{errors.street.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Kvartira / Xonadon</label>
                    <input
                      {...register('apartment')}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder="15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Pochta indeksi</label>
                    <input
                      {...register('zip')}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder="100100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Qo'shimcha izoh</label>
                  <textarea
                    {...register('note')}
                    rows={2}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                    placeholder="Qo'ng'iroq qiling, eshik kodi 1234"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-stone-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-bold text-slate-900">To'lov usuli</h2>
              </div>

              <div className="space-y-2.5">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === pm.id
                        ? 'border-slate-900 bg-stone-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      paymentMethod === pm.id ? 'bg-slate-900 text-amber-400' : 'bg-stone-100 text-slate-500'
                    }`}>
                      <pm.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{pm.label}</p>
                      <p className="text-xs text-slate-500">{pm.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === pm.id ? 'border-slate-900' : 'border-stone-300'
                    }`}>
                      {paymentMethod === pm.id && <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Coupon */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Kupon kodi</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="SUMMER2026"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Buyurtma izohi</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                  placeholder="Tushdan keyin yetkazing..."
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Address summary */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Manzil
                  </h3>
                  <button onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-slate-900">O'zgartirish</button>
                </div>
                <p className="text-sm text-slate-600">
                  {getValues('region')}, {getValues('city')}, {getValues('street')}
                  {getValues('apartment') && `, kv. ${getValues('apartment')}`}
                </p>
              </div>

              {/* Payment summary */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> To'lov
                  </h3>
                  <button onClick={() => setStep(2)} className="text-xs text-slate-500 hover:text-slate-900">O'zgartirish</button>
                </div>
                <p className="text-sm text-slate-600">
                  {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label}
                </p>
                {couponCode && <p className="text-xs text-amber-700 mt-1">Kupon: {couponCode}</p>}
              </div>

              {/* Items summary */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Mahsulotlar</h3>
                <div className="space-y-3">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                        {item.product.image && (
                          <img src={`/uploads${item.product.image}`} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-slate-500">{item.quantity} dona</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 shrink-0">
                        {item.pricing.totalPrice.toLocaleString('uz-UZ')} so'm
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => step === 1 ? navigate('/cart') : setStep(step - 1)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 1 ? 'Savatga qaytish' : 'Ortga'}
            </button>

            {step < 3 ? (
              <motion.button
                onClick={handleNextStep}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
              >
                Davom etish
              </motion.button>
            ) : (
              <motion.button
                onClick={handleCheckout}
                disabled={submitting}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buyurtma berish'}
              </motion.button>
            )}
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sticky top-24">
            <h3 className="text-base font-bold text-slate-900 mb-4">Jami</h3>
            <div className="space-y-2.5 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Mahsulotlar ({summary.itemCount})</span>
                <span className="text-slate-700">{summary.totalAmount.toLocaleString('uz-UZ')} so'm</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Yetkazish</span>
                <span className="text-emerald-600">Bepul</span>
              </div>
            </div>
            <div className="border-t border-stone-100 pt-3 flex justify-between">
              <span className="font-bold text-slate-900">Jami</span>
              <span className="text-lg font-extrabold text-slate-900">
                {summary.totalAmount.toLocaleString('uz-UZ')} so'm
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}