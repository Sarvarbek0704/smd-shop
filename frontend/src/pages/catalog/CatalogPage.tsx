import { useState, useEffect } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetProductsQuery, useSearchProductsQuery } from '@/store/api/productsApi';
import { useGetCategoryTreeQuery } from '@/store/api/categoriesApi';
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronRight,
  Grid3X3,
  LayoutGrid,
  Star,
  Heart,
  ShoppingCart,
  Search,
  Loader2,
  PackageOpen,
} from 'lucide-react';
import { useAddToCartMutation } from '@/store/api/cartApi';
import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from '@/store/api/wishlistApi';
import { useAppSelector } from '@/store/store';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Eng yangi' },
  { value: 'price_asc', label: 'Narx: arzon → qimmat' },
  { value: 'price_desc', label: 'Narx: qimmat → arzon' },
  { value: 'rating', label: 'Reyting bo\'yicha' },
  { value: 'popular', label: 'Mashhurlik' },
];

export function CatalogPage() {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuth = useAppSelector(selectIsAuthenticated);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [gridCols, setGridCols] = useState(4);

  // Query params dan filter olish
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const sort = searchParams.get('sort') ?? 'newest';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const rating = searchParams.get('rating') ?? '';
  const hasDiscount = searchParams.get('hasDiscount') === 'true';

  // API params
  const apiParams: Record<string, unknown> = {
    page,
    limit: 24,
    ...(categorySlug && { categoryId: categorySlug }),
    ...(minPrice && { priceMin: Number(minPrice) }),
    ...(maxPrice && { priceMax: Number(maxPrice) }),
    ...(hasDiscount && { hasDiscount: true }),
  };

  // Sort mapping
  const sortMap: Record<string, { sortBy: string; order: string }> = {
    newest: { sortBy: 'createdAt', order: 'DESC' },
    price_asc: { sortBy: 'basePrice', order: 'ASC' },
    price_desc: { sortBy: 'basePrice', order: 'DESC' },
    rating: { sortBy: 'ratingAvg', order: 'DESC' },
    popular: { sortBy: 'viewCount', order: 'DESC' },
  };

  if (sortMap[sort]) {
    apiParams.sortBy = sortMap[sort].sortBy;
    apiParams.order = sortMap[sort].order;
  }

  // Search yoki oddiy listing
  const isSearchMode = !!search;
  const searchApiParams = { ...apiParams, q: search };

  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery(
    apiParams,
    { skip: isSearchMode },
  );
  const { data: searchData, isLoading: searchLoading } = useSearchProductsQuery(
    searchApiParams,
    { skip: !isSearchMode },
  );

  const data = isSearchMode ? searchData : productsData;
  const isLoading = isSearchMode ? searchLoading : productsLoading;

  const products = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  const { data: categories } = useGetCategoryTreeQuery();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams(search ? { search } : {});
  };

  const activeFilterCount = [minPrice, maxPrice, rating, hasDiscount ? 'true' : ''].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-900 transition-colors">Bosh sahifa</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">
          {search ? `Qidiruv: "${search}"` : categorySlug ?? 'Barcha mahsulotlar'}
        </span>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filter — desktop */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <FilterSidebar
            categories={categories ?? []}
            categorySlug={categorySlug}
            minPrice={minPrice}
            maxPrice={maxPrice}
            rating={rating}
            hasDiscount={hasDiscount}
            updateFilter={updateFilter}
          />
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-stone-50 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtr
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-900">{meta.total}</span> ta mahsulot
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-stone-300 cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Grid toggle — desktop */}
              <div className="hidden md:flex items-center bg-white border border-stone-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setGridCols(3)}
                  className={`p-2 transition-colors ${gridCols === 3 ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setGridCols(4)}
                  className={`p-2 transition-colors ${gridCols === 4 ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {minPrice && <FilterBadge label={`Min: ${Number(minPrice).toLocaleString()} so'm`} onRemove={() => updateFilter('minPrice', null)} />}
              {maxPrice && <FilterBadge label={`Max: ${Number(maxPrice).toLocaleString()} so'm`} onRemove={() => updateFilter('maxPrice', null)} />}
              {rating && <FilterBadge label={`${rating}+ yulduz`} onRemove={() => updateFilter('rating', null)} />}
              {hasDiscount && <FilterBadge label="Chegirmali" onRemove={() => updateFilter('hasDiscount', null)} />}
              <button onClick={clearFilters} className="text-xs text-red-600 hover:underline ml-1">Hammasini tozalash</button>
            </div>
          )}

          {/* Products grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <PackageOpen className="w-16 h-16 text-stone-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-1">Mahsulot topilmadi</h3>
              <p className="text-sm text-slate-500">Filtrlarni o'zgartirib ko'ring</p>
            </div>
          ) : (
            <div className={`grid gap-4 grid-cols-2 ${gridCols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'}`}>
              {products.map((product: any, i: number) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 2)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;
                  return (
                    <span key={p} className="flex items-center gap-2">
                      {showEllipsis && <span className="text-slate-400 px-1">...</span>}
                      <button
                        onClick={() => updateFilter('page', String(p))}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                          p === meta.page
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-stone-200 text-slate-600 hover:bg-stone-50'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden"
              onClick={() => setMobileFilterOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-stone-100">
                <h3 className="font-semibold text-slate-900">Filtrlar</h3>
                <button onClick={() => setMobileFilterOpen(false)} className="p-1.5 hover:bg-stone-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-4">
                <FilterSidebar
                  categories={categories ?? []}
                  categorySlug={categorySlug}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  rating={rating}
                  hasDiscount={hasDiscount}
                  updateFilter={(k, v) => { updateFilter(k, v); setMobileFilterOpen(false); }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───────── Product Card ─────────

function ProductCard({ product, index }: { product: any; index: number }) {
  const primaryImage = product.images?.find((i: any) => i.isPrimary) ?? product.images?.[0];
  const basePrice = parseFloat(product.basePrice);
  const discountPrice = product.discountPrice ? parseFloat(product.discountPrice) : null;
  const isDiscountActive = discountPrice !== null && (!product.discountEndsAt || new Date(product.discountEndsAt) > new Date());
  const displayPrice = isDiscountActive ? discountPrice! : basePrice;
  const discountPercent = isDiscountActive ? Math.round((1 - discountPrice! / basePrice) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        to={`/products/${product.slug}`}
        className="group block bg-white rounded-xl border border-stone-100 overflow-hidden hover:shadow-lg hover:shadow-stone-200/60 hover:border-stone-200 transition-all duration-300"
      >
        {/* Image */}
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

          {/* Discount badge */}
          {isDiscountActive && discountPercent > 0 && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-lg">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3.5">
          <h3 className="text-sm font-medium text-slate-900 line-clamp-2 mb-2 leading-snug group-hover:text-slate-700">
            {product.name}
          </h3>

          {/* Rating */}
          {product.ratingCount > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-slate-700">{parseFloat(product.ratingAvg).toFixed(1)}</span>
              <span className="text-xs text-slate-400">({product.ratingCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-slate-900">
              {displayPrice.toLocaleString('uz-UZ')} so'm
            </span>
            {isDiscountActive && (
              <span className="text-xs text-slate-400 line-through">
                {basePrice.toLocaleString('uz-UZ')}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ───────── Filter Sidebar ─────────

function FilterSidebar({
  categories,
  categorySlug,
  minPrice,
  maxPrice,
  rating,
  hasDiscount,
  updateFilter,
}: {
  categories: any[];
  categorySlug?: string;
  minPrice: string;
  maxPrice: string;
  rating: string;
  hasDiscount: boolean;
  updateFilter: (key: string, value: string | null) => void;
}) {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  useEffect(() => { setLocalMin(minPrice); }, [minPrice]);
  useEffect(() => { setLocalMax(maxPrice); }, [maxPrice]);

  const applyPrice = () => {
    updateFilter('minPrice', localMin || null);
    updateFilter('maxPrice', localMax || null);
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Kategoriyalar</h4>
        <div className="space-y-0.5">
          <Link
            to="/catalog"
            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!categorySlug ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-stone-100'}`}
          >
            Barchasi
          </Link>
          {categories.map((cat: any) => (
            <div key={cat.id}>
              <Link
                to={`/catalog/${cat.slug}`}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${categorySlug === cat.slug ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-stone-100'}`}
              >
                {cat.name}
              </Link>
              {cat.children?.length > 0 && (
                <div className="ml-3 mt-0.5 space-y-0.5">
                  {cat.children.map((child: any) => (
                    <Link
                      key={child.id}
                      to={`/catalog/${child.slug}`}
                      className={`block px-3 py-1.5 rounded-lg text-xs transition-colors ${categorySlug === child.slug ? 'bg-slate-800 text-white font-medium' : 'text-slate-500 hover:bg-stone-100'}`}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Narx</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            placeholder="Min"
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone-300"
          />
          <span className="text-slate-400 text-sm">—</span>
          <input
            type="number"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            placeholder="Max"
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone-300"
          />
        </div>
        <button
          onClick={applyPrice}
          className="mt-2 w-full py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          Qo'llash
        </button>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Reyting</h4>
        <div className="space-y-1.5">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => updateFilter('rating', rating === String(r) ? null : String(r))}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${rating === String(r) ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-stone-100'}`}
            >
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < r ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                ))}
              </div>
              <span>va yuqori</span>
            </button>
          ))}
        </div>
      </div>

      {/* Discount */}
      <div>
        <button
          onClick={() => updateFilter('hasDiscount', hasDiscount ? null : 'true')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${hasDiscount ? 'bg-slate-900 text-white' : 'bg-stone-100 text-slate-700 hover:bg-stone-200'}`}
        >
          Faqat chegirmali
          {hasDiscount && <X className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ───────── Filter Badge ─────────

function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-slate-700 text-xs font-medium rounded-lg">
      {label}
      <button onClick={onRemove} className="text-slate-400 hover:text-slate-600">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}