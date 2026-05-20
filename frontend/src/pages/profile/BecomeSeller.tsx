import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useGetMeQuery, useApplyToBeSellerMutation } from '@/store/api/usersApi';
import {
  Store,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Rocket,
  ShieldCheck,
} from 'lucide-react';

export function BecomeSeller() {
  const { data: user } = useGetMeQuery();
  const [applyToBeSeller, { isLoading: loading }] = useApplyToBeSellerMutation();

  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');

  const status = user?.sellerStatus;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !storeDescription.trim()) {
      return toast.error('Hamma maydonlarni to\'ldiring');
    }
    try {
      await applyToBeSeller({ storeName, storeDescription }).unwrap();
      toast.success('Ariza yuborildi!');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Xatolik yuz berdi');
    }
  };

  if (status === 'approved') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Siz allaqachon sotuvchisiz!</h1>
        <p className="text-slate-500 mb-8">Do'koningiz tasdiqlangan. Mahsulotlarni boshqarishni boshlashingiz mumkin.</p>
        <Link
          to="/seller"
          className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all"
        >
          Sotuvchi paneliga o'tish <Rocket className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ariza ko'rib chiqilmoqda</h1>
        <p className="text-slate-500 mb-4">
          Sizning "<strong>{user?.storeName}</strong>" do'koningiz uchun arizangiz adminlarimiz tomonidan tekshirilmoqda.
        </p>
        <p className="text-sm text-slate-400">Odatda bu 24 soatgacha vaqt oladi. Natija haqida xabar beramiz.</p>
        <div className="mt-8">
          <Link to="/" className="text-sm font-medium text-slate-900 hover:underline">Asosiy sahifaga qaytish</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-900">Bosh sahifa</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/profile" className="hover:text-slate-900">Profil</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">Sotuvchi bo'lish</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
              O'z biznesingizni <span className="text-amber-500">OnlineShop</span> bilan boshlang!
            </h1>
            <p className="text-slate-600 leading-relaxed">
              Millionlab xaridorlar sizning mahsulotlaringizni kutmoqda. Biz bilan do'kon oching va sotuvlarni oshiring.
            </p>
          </div>

          <div className="space-y-4">
            <FeatureItem
              icon={CheckCircle2}
              title="Oson ro'yxatdan o'tish"
              desc="Bor-yo'g'i 2 daqiqa vaqt oladi. Hujjatlarsiz boshlang."
            />
            <FeatureItem
              icon={Rocket}
              title="Tezkor sotuvlar"
              desc="Mahsulotlaringizni joylang va birinchi buyurtmani bugunoq oling."
            />
            <FeatureItem
              icon={ShieldCheck}
              title="Ishonchli to'lovlar"
              desc="Barcha to'lovlar xavfsiz va o'z vaqtida amalga oshiriladi."
            />
          </div>

          {status === 'rejected' && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-red-800">Oldingi arizangiz rad etilgan</h3>
                <p className="text-sm text-red-600 mt-1">{user?.rejectedReason}</p>
                <p className="text-xs text-red-500 mt-2 font-medium">Iltimos, ma'lumotlarni to'g'rilab qaytadan yuboring.</p>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-stone-200 rounded-3xl p-8 shadow-xl shadow-stone-200/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-slate-900 text-amber-400 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Do'kon ma'lumotlari</h2>
          </div>

          <form onSubmit={handleApply} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Do'kon nomi *</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Masalan: Apple Store Uzbekistan"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Do'kon haqida *</label>
              <textarea
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                rows={4}
                placeholder="Qanday mahsulotlar sotishingiz va do'koningiz haqida qisqacha..."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all resize-none"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-900/20"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <FileText className="w-5 h-5" /> Arizani yuborish
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-[11px] text-center text-slate-400 mt-6 px-4">
            Arizani yuborish orqali siz OnlineShop <Link to="/terms" className="underline hover:text-slate-600">foydalanish shartlari</Link> va <Link to="/privacy" className="underline hover:text-slate-600">maxfiylik siyosatiga</Link> rozilik bildirasiz.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 bg-white border border-stone-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
        <Icon className="w-6 h-6 text-slate-700" />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
