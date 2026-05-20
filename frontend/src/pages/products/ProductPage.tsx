import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGetProductBySlugQuery, useGetSimilarQuery } from '@/store/api/productsApi';
import { useAddToCartMutation } from '@/store/api/cartApi';
import { useAddToWishlistMutation, useCheckWishlistQuery, useRemoveFromWishlistMutation } from '@/store/api/wishlistApi';
import { useAppSelector } from '@/store/store';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  Star,
  Heart,
  ShoppingCart,
  ChevronRight,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Loader2,
  PackageOpen,
  ChevronLeft,
} from 'lucide-react';
import { ProductReviews } from './ProductReviews';

export function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isAuth = useAppSelector(selectIsAuthenticated);

  const { data: product, isLoading, error } = useGetProductBySlugQuery(slug ?? '');
  const { data: similar } = useGetSimilarQuery(product?.id ?? '', { skip: !product?.id });
  const { data: wishlistStatus } = useCheckWishlistQuery(product?.id ?? '', { skip: !product?.id || !isAuth });

  const [addToCart, { isLoading: addingToCart }] = useAddToCartMutation();
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <PackageOpen className="w-16 h-16 text-stone-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-700">Mahsulot topilmadi</h2>
        <Link to="/catalog" className="mt-4 text-sm text-slate-500 hover:text-slate-900">Katalogga qaytish</Link>
      </div>
    );
  }

  const images = product.images?.sort((a: any, b: any) => a.sortOrder - b.sortOrder) ?? [];
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;

  const selectedVariant = hasVariants ? variants.find((v: any) => v.id === selectedVariantId) ?? variants[0] : null;

  const basePrice = parseFloat(product.basePrice);
  const discountPrice = product.discountPrice ? parseFloat(product.discountPrice) : null;
  const isDiscountActive = discountPrice !== null && (!product.discountEndsAt || new Date(product.discountEndsAt) > new Date());
  const effectivePrice = isDiscountActive ? discountPrice! : basePrice;
  const variantMod = selectedVariant ? parseFloat(selectedVariant.priceModifier) : 0;
  const finalPrice = effectivePrice + variantMod;
  const discountPercent = isDiscountActive ? Math.round((1 - discountPrice! / basePrice) * 100) : 0;

  const isInWishlist = wishlistStatus?.inWishlist ?? false;

  const handleAddToCart = async () => {
    if (!isAuth) {
      navigate('/auth/login');
      return;
    }
    if (hasVariants && !selectedVariantId && !selectedVariant) {
      toast.error('Variantni tanlang');
      return;
    }
    try {
      await addToCart({
        productId: product.id,
        variantId: selectedVariant?.id,
        quantity,
      }).unwrap();
      toast.success('Savatga qo\'shildi!');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Xatolik');
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuth) { navigate('/auth/login'); return; }
    try {
      if (isInWishlist) {
        await removeFromWishlist(product.id).unwrap();
        toast.success('Sevimlilardan olib tashlandi');
      } else {
        await addToWishlist(product.id).unwrap();
        toast.success('Sevimlilarga qo\'shildi!');
      }
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Xatolik');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 overflow-x-auto">
        <Link to="/" className="hover:text-slate-900 shrink-0">Bosh sahifa</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link to="/catalog" className="hover:text-slate-900 shrink-0">Katalog</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link to={`/catalog/${product.category.slug}`} className="hover:text-slate-900 shrink-0">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-slate-900 font-medium truncate">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div>
          {/* Main image */}
          <div className="relative aspect-square bg-stone-100 rounded-2xl overflow-hidden mb-3">
            {images.length > 0 ? (
              <img
                src={`/uploads${images[activeImageIndex]?.url}`}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PackageOpen className="w-20 h-20 text-stone-300" />
              </div>
            )}

            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex(Math.max(0, activeImageIndex - 1))}
                  disabled={activeImageIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-700 hover:bg-white shadow-md disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveImageIndex(Math.min(images.length - 1, activeImageIndex + 1))}
                  disabled={activeImageIndex === images.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-700 hover:bg-white shadow-md disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Discount badge */}
            {isDiscountActive && discountPercent > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-lg">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img: any, i: number) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIndex(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    i === activeImageIndex ? 'border-slate-900' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={`/uploads${img.url}`} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3 leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          {product.ratingCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(parseFloat(product.ratingAvg)) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-700">{parseFloat(product.ratingAvg).toFixed(1)}</span>
              <span className="text-sm text-slate-400">({product.ratingCount} sharh)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-extrabold text-slate-900">
              {finalPrice.toLocaleString('uz-UZ')} so'm
            </span>
            {isDiscountActive && (
              <span className="text-lg text-slate-400 line-through">
                {(basePrice + variantMod).toLocaleString('uz-UZ')} so'm
              </span>
            )}
          </div>

          {/* Variants */}
          {hasVariants && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2.5">Variant tanlang</h3>
              <div className="flex flex-wrap gap-2">
                {variants.map((v: any) => {
                  const isSelected = (selectedVariant?.id ?? variants[0]?.id) === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      disabled={!v.isActive || v.stockQuantity === 0}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {v.name}
                      {v.stockQuantity === 0 && ' (tugagan)'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center bg-stone-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 text-slate-600 hover:text-slate-900 hover:bg-stone-200 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-sm font-semibold text-slate-900">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-3 text-slate-600 hover:text-slate-900 hover:bg-stone-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <motion.button
              onClick={handleAddToCart}
              disabled={addingToCart}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {addingToCart ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <><ShoppingCart className="w-5 h-5" /> Savatga qo'shish</>
              )}
            </motion.button>

            <button
              onClick={handleToggleWishlist}
              className={`p-3.5 rounded-xl border transition-all ${
                isInWishlist
                  ? 'bg-red-50 border-red-200 text-red-500'
                  : 'bg-white border-stone-200 text-slate-400 hover:text-red-500 hover:border-red-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Truck, label: 'Tez yetkazish' },
              { icon: ShieldCheck, label: 'Kafolat' },
              { icon: RotateCcw, label: '30 kun qaytarish' },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-1.5 py-3 bg-stone-50 rounded-xl">
                <f.icon className="w-4 h-4 text-slate-500" />
                <span className="text-[11px] text-slate-500 font-medium text-center">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          {product.shortDescription && (
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{product.shortDescription}</p>
          )}
          {product.description && (
            <div className="prose prose-sm prose-slate max-w-none">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Tavsif</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* Seller */}
          {product.seller && (
            <div className="mt-6 p-4 bg-stone-50 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                {product.seller.firstName?.[0]?.toUpperCase() ?? 'S'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {product.seller.firstName} {product.seller.lastName}
                </p>
                <p className="text-xs text-slate-500">Sotuvchi</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <ProductReviews slug={product.slug} productId={product.id} />

      {/* Similar products */}
      {similar && similar.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-slate-900 mb-6">O'xshash mahsulotlar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {similar.slice(0, 5).map((p: any, i: number) => {
              const img = p.images?.find((im: any) => im.isPrimary) ?? p.images?.[0];
              const price = parseFloat(p.basePrice);
              return (
                <Link
                  key={p.id}
                  to={`/products/${p.slug}`}
                  className="group bg-white rounded-xl border border-stone-100 overflow-hidden hover:shadow-lg hover:border-stone-200 transition-all"
                >
                  <div className="aspect-square bg-stone-100 overflow-hidden">
                    {img ? (
                      <img src={`/uploads${img.url}`} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><PackageOpen className="w-10 h-10 text-stone-300" /></div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs font-medium text-slate-900 line-clamp-2 mb-1.5">{p.name}</h3>
                    <span className="text-sm font-bold text-slate-900">{price.toLocaleString('uz-UZ')} so'm</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}