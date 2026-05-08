import { Link } from "react-router-dom";
import { useGetCategoryTreeQuery } from "@/store/api/categoriesApi";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { useState } from "react";

export function Footer() {
  const { data: categories } = useGetCategoryTreeQuery();
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-slate-950 text-slate-400 mt-auto">
      {/* Newsletter */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Yangiliklardan xabardor bo'ling
              </h3>
              <p className="text-sm text-slate-500">
                Chegirmalar va yangi mahsulotlar haqida birinchilardan bo'lib
                biling
              </p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email manzilingiz"
                className="flex-1 md:w-72 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-l-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
              />
              <button className="px-5 py-2.5 bg-amber-400 text-slate-900 font-semibold rounded-r-xl hover:bg-amber-300 transition-colors flex items-center gap-2">
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Obuna</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center">
                <span className="text-amber-400 font-extrabold">O</span>
              </div>
              <span className="text-lg font-bold text-white">OnlineShop</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              O'zbekistonning zamonaviy online do'koni. Sifatli mahsulotlar, tez
              yetkazish, ishonchli xizmat.
            </p>
            <div className="space-y-2">
              <a
                href="tel:+998901234567"
                className="flex items-center gap-2 text-sm hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4 text-slate-600" />
                +998 90 123 45 67
              </a>
              <a
                href="mailto:info@onlineshop.uz"
                className="flex items-center gap-2 text-sm hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 text-slate-600" />
                info@onlineshop.uz
              </a>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-slate-600" />
                Toshkent, O'zbekiston
              </div>
            </div>
          </div>

          {/* Kategoriyalar */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">
              Kategoriyalar
            </h4>
            <ul className="space-y-2.5">
              {(categories ?? []).slice(0, 6).map((cat: any) => (
                <li key={cat.id}>
                  <Link
                    to={`/catalog/${cat.slug}`}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/catalog"
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Barchasi →
                </Link>
              </li>
            </ul>
          </div>

          {/* Xaridorlar uchun */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">
              Xaridorlar uchun
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/catalog"
                  className="text-sm hover:text-white transition-colors"
                >
                  Katalog
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog?hasDiscount=true"
                  className="text-sm hover:text-white transition-colors"
                >
                  Chegirmalar
                </Link>
              </li>
              <li>
                <Link
                  to="/cart"
                  className="text-sm hover:text-white transition-colors"
                >
                  Savat
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  className="text-sm hover:text-white transition-colors"
                >
                  Buyurtmalarim
                </Link>
              </li>
              <li>
                <Link
                  to="/wishlist"
                  className="text-sm hover:text-white transition-colors"
                >
                  Sevimlilar
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="text-sm hover:text-white transition-colors"
                >
                  Profil
                </Link>
              </li>
            </ul>
          </div>

          {/* Ma'lumot */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Ma'lumot</h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/about"
                  className="text-sm hover:text-white transition-colors"
                >
                  Biz haqimizda
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm hover:text-white transition-colors"
                >
                  Aloqa
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-sm hover:text-white transition-colors"
                >
                  Ko'p so'raladigan savollar
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm hover:text-white transition-colors"
                >
                  Maxfiylik siyosati
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm hover:text-white transition-colors"
                >
                  Foydalanish shartlari
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} OnlineShop. Barcha huquqlar
              himoyalangan.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-600">To'lov usullari:</span>
              <div className="flex items-center gap-2">
                {["Payme", "Click", "Uzum"].map((name) => (
                  <span
                    key={name}
                    className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] font-semibold text-slate-400"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
