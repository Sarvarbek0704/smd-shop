import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Truck,
  ShieldCheck,
  Headphones,
  ChevronRight,
  Star,
  PackageOpen,
} from "lucide-react";
import { useGetCategoryTreeQuery } from "@/store/api/categoriesApi";
import { useGetProductsQuery } from "@/store/api/productsApi";
import { useGetTrendingQuery } from "@/store/api/productsApi";

export function HomePage() {
  const { data: categories } = useGetCategoryTreeQuery();
  const { data: trendingData } = useGetTrendingQuery();
  const { data: newData } = useGetProductsQuery({
    limit: 8,
    sortBy: "createdAt",
    order: "DESC",
  });
  const { data: discountData } = useGetProductsQuery({
    limit: 8,
    hasDiscount: true,
  });

  const trending = trendingData ?? [];
  const newProducts = newData?.data ?? [];
  const discountProducts = discountData?.data ?? [];

  // Kategoriya ikonlari (slug → emoji placeholder — real loyihada rasm bo'ladi)
  const catColors = [
    "from-blue-500 to-indigo-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-emerald-500 to-teal-600",
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-blue-600",
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-white max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/10 text-amber-300">
              <Sparkles className="w-4 h-4" />
              Yangi kolleksiya yetib keldi
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
              Sifatli mahsulotlar,{" "}
              <span className="text-amber-400">eng yaxshi narxlarda</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              O'zbekistonning eng zamonaviy online do'konidan xarid qiling. Tez
              yetkazish, xavfsiz to'lov, sifat kafolati.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/catalog"
                className="px-8 py-3.5 bg-amber-400 text-slate-900 font-bold rounded-xl hover:bg-amber-300 transition-all flex items-center gap-2"
              >
                Xarid qilish <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/catalog?hasDiscount=true"
                className="px-8 py-3.5 bg-white/5 backdrop-blur-sm text-white font-medium rounded-xl border border-white/10 hover:bg-white/10 transition-all"
              >
                Chegirmalar
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 relative z-10 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { icon: Truck, title: "Tez yetkazish", desc: "1-3 kun ichida" },
            {
              icon: ShieldCheck,
              title: "Xavfsiz to'lov",
              desc: "Barcha usullar",
            },
            {
              icon: Headphones,
              title: "24/7 qo'llab-quvvatlash",
              desc: "Har doim aloqada",
            },
            {
              icon: Sparkles,
              title: "Sifat kafolati",
              desc: "30 kun qaytarish",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white rounded-xl p-4 md:p-5 shadow-lg shadow-stone-200/40 border border-stone-100 flex items-center gap-3 md:gap-4"
            >
              <div className="w-10 h-10 md:w-11 md:h-11 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-500 hidden sm:block">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Kategoriyalar */}
      {categories && categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-16">
          <SectionHeader
            title="Kategoriyalar"
            link="/catalog"
            linkText="Barchasi"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((cat: any, i: number) => (
              <Link
                key={cat.id}
                to={`/catalog/${cat.slug}`}
                className="group relative bg-white border border-stone-100 rounded-xl p-5 text-center hover:shadow-lg hover:border-stone-200 transition-all overflow-hidden"
              >
                <div
                  className={`w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br ${catColors[i % catColors.length]} flex items-center justify-center shadow-lg`}
                >
                  <span className="text-white text-xl font-bold">
                    {cat.name[0]}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">
                  {cat.name}
                </h3>
                {cat.children?.length > 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    {cat.children.length} subkategoriya
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Chegirmali mahsulotlar */}
      {discountProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-16">
          <SectionHeader
            title="Chegirmalar"
            link="/catalog?hasDiscount=true"
            linkText="Barchasini ko'rish"
            accent
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {discountProducts.slice(0, 4).map((product: any, i: number) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Trend mahsulotlar */}
      {trending.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-16">
          <SectionHeader
            title="Trend mahsulotlar"
            link="/catalog?sort=popular"
            linkText="Barchasini ko'rish"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {trending.slice(0, 8).map((product: any, i: number) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Yangi mahsulotlar */}
      {newProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-16">
          <SectionHeader
            title="Yangi kelganlar"
            link="/catalog?sort=newest"
            linkText="Barchasini ko'rish"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {newProducts.slice(0, 8).map((product: any, i: number) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="bg-slate-900 rounded-2xl p-10 md:p-16 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)",
              backgroundSize: "30px 30px",
            }}
          />
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Sotuvchi bo'ling!
            </h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              O'z mahsulotlaringizni minglab xaridorlarga taqdim eting
            </p>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-slate-900 font-bold rounded-xl hover:bg-amber-300 transition-all"
            >
              Boshlash <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ───────── Section Header ─────────

function SectionHeader({
  title,
  link,
  linkText,
  accent = false,
}: {
  title: string;
  link: string;
  linkText: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
        {accent && <Sparkles className="w-5 h-5 text-amber-500" />}
        {title}
      </h2>
      <Link
        to={link}
        className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
      >
        {linkText} <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ───────── Product Card ─────────

function ProductCard({ product, index }: { product: any; index: number }) {
  const primaryImage =
    product.images?.find((i: any) => i.isPrimary) ?? product.images?.[0];
  const basePrice = parseFloat(product.basePrice);
  const discountPrice = product.discountPrice
    ? parseFloat(product.discountPrice)
    : null;
  const isDiscountActive =
    discountPrice !== null &&
    (!product.discountEndsAt || new Date(product.discountEndsAt) > new Date());
  const displayPrice = isDiscountActive ? discountPrice! : basePrice;
  const discountPercent = isDiscountActive
    ? Math.round((1 - discountPrice! / basePrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link
        to={`/products/${product.slug}`}
        className="group block bg-white rounded-xl border border-stone-100 overflow-hidden hover:shadow-lg hover:shadow-stone-200/60 hover:border-stone-200 transition-all duration-300"
      >
        <div className="relative aspect-square bg-stone-100 overflow-hidden">
          {primaryImage ? (
            <img
              src={`/uploads${primaryImage.url}`}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PackageOpen className="w-12 h-12 text-stone-300" />
            </div>
          )}
          {isDiscountActive && discountPercent > 0 && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-lg">
              -{discountPercent}%
            </span>
          )}
        </div>
        <div className="p-3 md:p-3.5">
          <h3 className="text-xs md:text-sm font-medium text-slate-900 line-clamp-2 mb-1.5 md:mb-2 leading-snug">
            {product.name}
          </h3>
          {product.ratingCount > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-[10px] md:text-xs font-semibold text-slate-700">
                {parseFloat(product.ratingAvg).toFixed(1)}
              </span>
              <span className="text-[10px] md:text-xs text-slate-400">
                ({product.ratingCount})
              </span>
            </div>
          )}
          <div className="flex items-baseline gap-1.5 md:gap-2">
            <span className="text-sm md:text-base font-bold text-slate-900">
              {displayPrice.toLocaleString("uz-UZ")}
            </span>
            {isDiscountActive && (
              <span className="text-[10px] md:text-xs text-slate-400 line-through">
                {basePrice.toLocaleString("uz-UZ")}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
