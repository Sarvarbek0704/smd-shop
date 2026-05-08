import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetWishlistQuery, useRemoveFromWishlistMutation } from '@/store/api/wishlistApi';
import { useAddToCartMutation } from '@/store/api/cartApi';
import toast from 'react-hot-toast';
import {
  Heart,
  ShoppingCart,
  ChevronRight,
  Loader2,
  Trash2,
  Star,
  PackageOpen,
} from 'lucide-react';

export function WishlistPage() {
  const { data, isLoading } = useGetWishlistQuery();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [addToCart] = useAddToCartMutation();

  const items = data?.data ?? [];

  const handleRemove = async (productId: string, name: string) => {
    try {
      await removeFromWishlist(productId).unwrap();
      toast.success(`"${name}" sevimlilardan olib tashlandi`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Xatolik');
    }
  };

  const handleAddToCart = async (productId: string, name: string) => {
    try {
      await addToCart({ productId }).unwrap();
      toast.success(`"${name}" savatga qo'shildi`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Xatolik');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-900">Bosh sahifa</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">Sevimlilar</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Sevimlilar {items.length > 0 && <span className="text-slate-400 font-normal text-lg">({items.length})</span>}
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mb-5">
            <Heart className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sevimlilar bo'sh</h2>
          <p className="text-slate-500 text-sm mb-6">Yoqtirgan mahsulotlaringizni sevimlilarga qo'shing</p>
          <Link to="/catalog" className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800">
            Katalogga o'tish
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {items.map((item: any) => {
              const product = item.product;
              const basePrice = parseFloat(product.basePrice);
              const discountPrice = product.discountPrice ? parseFloat(product.discountPrice) : null;
              const isDiscountActive = discountPrice !== null && (!product.discountEndsAt || new Date(product.discountEndsAt) > new Date());
              const displayPrice = isDiscountActive ? discountPrice! : basePrice;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white border border-stone-100 rounded-xl overflow-hidden group"
                >
                  <Link to={`/products/${product.slug}`} className="block">
                    <div className="relative aspect-square bg-stone-100 overflow-hidden">
                      {product.image ? (
                        <img src={`/uploads${product.image}`} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><PackageOpen className="w-12 h-12 text-stone-300" /></div>
                      )}
                      {isDiscountActive && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-lg">
                          -{Math.round((1 - discountPrice! / basePrice) * 100)}%
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-3.5">
                    <Link to={`/products/${product.slug}`}>
                      <h3 className="text-sm font-medium text-slate-900 line-clamp-2 mb-2 leading-snug">{product.name}</h3>
                    </Link>

                    {product.ratingCount > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-slate-700">{parseFloat(product.ratingAvg).toFixed(1)}</span>
                      </div>
                    )}

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-sm font-bold text-slate-900">{displayPrice.toLocaleString('uz-UZ')} so'm</span>
                      {isDiscountActive && <span className="text-xs text-slate-400 line-through">{basePrice.toLocaleString('uz-UZ')}</span>}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product.id, product.name)}
                        className="flex-1 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Savatga
                      </button>
                      <button
                        onClick={() => handleRemove(product.id, product.name)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}