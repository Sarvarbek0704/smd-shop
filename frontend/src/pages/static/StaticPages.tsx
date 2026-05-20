import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl font-black text-slate-900 mb-6">OnlineShop Haqida</h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Biz O'zbekistondagi eng zamonaviy online savdo platformasimiz. Bizning maqsadimiz — xaridorlar va sotuvchilar uchun qulay, xavfsiz va ishonchli muhit yaratish.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <StatsCard value="100k+" label="Xaridorlar" />
        <StatsCard value="5000+" label="Sotuvchilar" />
        <StatsCard value="1M+" label="Mahsulotlar" />
      </div>

      <div className="prose prose-slate max-w-none">
        <h2 className="text-2xl font-bold mb-4">Bizning vazifamiz</h2>
        <p className="mb-6">
          Biz har bir xaridor o'zi istagan mahsulotni eng maqbul narxlarda va eng tez fursatda topishini ta'minlashni istaymiz. Texnologiyalar yordamida savdo jarayonini maksimal darajada osonlashtiramiz.
        </p>
        <h2 className="text-2xl font-bold mb-4">Nega biz?</h2>
        <ul className="list-disc pl-6 space-y-2 mb-8 text-slate-600">
          <li><strong>Sifat kafolati:</strong> Platformamizdagi barcha sotuvchilar tekshirilgan.</li>
          <li><strong>Tez yetkazish:</strong> Butun O'zbekiston bo'ylab 1-3 kun ichida yetkazib beramiz.</li>
          <li><strong>Qulay to'lov:</strong> Click, Payme, Uzum va naqd pul orqali to'lash imkoniyati.</li>
          <li><strong>24/7 qo'llab-quvvatlash:</strong> Mutaxassislarimiz har doim yordamga tayyor.</li>
        </ul>
      </div>
    </div>
  );
}

export function ContactPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-4">Biz bilan bog'laning</h1>
        <p className="text-slate-500">Savollaringiz bormi? Bizga yozing yoki qo'ng'iroq qiling.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Info */}
        <div className="space-y-6">
          <ContactInfoCard
            icon={Phone}
            title="Telefon"
            value="+998 90 123 45 67"
            sub="Dush-Shan, 9:00 - 18:00"
          />
          <ContactInfoCard
            icon={Mail}
            title="Email"
            value="info@onlineshop.uz"
            sub="24 soat ichida javob beramiz"
          />
          <ContactInfoCard
            icon={MapPin}
            title="Manzil"
            value="Toshkent shahri, Yunusobod tumani, 12-uy"
            sub="Markaziy ofis"
          />
        </div>

        {/* Form */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Ismingiz</label>
              <input type="text" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="Ali Valiyev" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input type="email" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="ali@gmail.com" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mavzu</label>
              <input type="text" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="Savolim bor edi..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Xabar</label>
              <textarea rows={5} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none" placeholder="Xabaringizni yozing..." />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Xabarni yuborish
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 prose prose-slate">
      <h1 className="text-3xl font-black mb-8">Maxfiylik Siyosati</h1>
      <p>Oxirgi yangilanish: 2026-yil 8-may</p>
      
      <h3>1. Ma'lumotlarni yig'ish</h3>
      <p>Biz sizning shaxsiy ma'lumotlaringizni (ism, email, telefon, manzil) faqat xizmat ko'rsatish maqsadida yig'amiz.</p>
      
      <h3>2. Ma'lumotlardan foydalanish</h3>
      <p>Yig'ilgan ma'lumotlar buyurtmalarni yetkazib berish, to'lovlarni amalga oshirish va siz bilan bog'lanish uchun foydalaniladi.</p>
      
      <h3>3. Ma'lumotlar xavfsizligi</h3>
      <p>Biz zamonaviy shifrlash texnologiyalaridan foydalangan holda sizning ma'lumotlaringiz xavfsizligini ta'minlaymiz.</p>
      
      <h3>4. Uchinchi shaxslarga berish</h3>
      <p>Biz sizning shaxsiy ma'lumotlaringizni uchinchi shaxslarga sotmaymiz yoki bermaymiz (qonuniy talablar bundan mustasno).</p>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 prose prose-slate">
      <h1 className="text-3xl font-black mb-8">Foydalanish Shartlari</h1>
      <p>Oxirgi yangilanish: 2026-yil 8-may</p>
      
      <h3>1. Umumiy qoidalar</h3>
      <p>OnlineShop platformasidan foydalanish orqali siz ushbu shartlarga rozilik bildirasiz.</p>
      
      <h3>2. Ro'yxatdan o'tish</h3>
      <p>Foydalanuvchi haqiqiy ma'lumotlarni taqdim etishi va o'z paroli xavfsizligi uchun mas'uldir.</p>
      
      <h3>3. Buyurtma va to'lov</h3>
      <p>Buyurtma berilgan mahsulotlar uchun to'lov platformada ko'rsatilgan usullar orqali amalga oshirilishi shart.</p>
      
      <h3>4. Mahsulotni qaytarish</h3>
      <p>Sifatsiz yoki mos kelmagan mahsulotlarni 30 kun ichida qaytarish imkoniyati mavjud.</p>
    </div>
  );
}

// Helpers
function StatsCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-8 text-center shadow-sm">
      <div className="text-3xl font-black text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">{label}</div>
    </div>
  );
}

function ContactInfoCard({ icon: Icon, title, value, sub }: { icon: any; title: string; value: string; sub: string }) {
  return (
    <div className="flex gap-4 p-5 bg-stone-50 rounded-2xl border border-stone-100">
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
        <Icon className="w-6 h-6 text-slate-700" />
      </div>
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-tight">{title}</h4>
        <p className="text-base font-bold text-slate-900 mt-0.5">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
