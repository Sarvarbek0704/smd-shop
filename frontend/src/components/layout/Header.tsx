import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Package,
  MessageCircle,
  Settings,
  ChevronDown,
  Store,
  Truck,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/store/store';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectHasRole,
  logOut,
} from '@/store/slices/authSlice';
import { useGetCartQuery } from '@/store/api/cartApi';
import { useGetUnreadCountQuery } from '@/store/api/notificationsApi';
import { useGetAutocompleteQuery, useGetPopularSearchesQuery } from '@/store/api/searchApi';

export function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuth = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const isSeller = useAppSelector(selectHasRole('seller'));
  const isAdmin = useAppSelector(selectHasRole('admin'));
  const isDelivery = useAppSelector(selectHasRole('delivery'));

  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuth });
  const { data: unread } = useGetUnreadCountQuery(undefined, {
    skip: !isAuth,
    pollingInterval: 30000,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [] } = useGetAutocompleteQuery(searchQuery, {
    skip: searchQuery.length < 2,
  });
  const { data: popular = [] } = useGetPopularSearchesQuery();

  const cartCount = cart?.summary?.totalItems ?? 0;
  const unreadCount = unread?.unreadCount ?? 0;

  // Tashqariga bosganda profile menu va qidiruv dropdowni yopiladi
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e?: React.FormEvent, term?: string) => {
    e?.preventDefault();
    const finalQuery = term || searchQuery;
    if (finalQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(finalQuery.trim())}`);
      setSearchQuery('');
      setIsSearchFocused(false);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    dispatch(logOut());
    setProfileOpen(false);
    navigate('/');
  };

  const navTo = (path: string) => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Mobile menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-amber-400 font-extrabold text-base">O</span>
            </div>
            <span className="text-lg font-bold text-slate-900 hidden sm:block tracking-tight">
              OnlineShop
            </span>
          </Link>

          {/* Desktop search */}
          <div className="flex-1 max-w-xl hidden md:block relative" ref={searchRef}>
            <form onSubmit={handleSearch}>
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Mahsulotlarni qidirish..."
                  className="w-full pl-11 pr-4 py-2.5 bg-stone-100 border border-transparent rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-stone-300 focus:ring-1 focus:ring-stone-300 transition-all"
                />
              </div>
            </form>

            <AnimatePresence>
              {isSearchFocused && (searchQuery.length > 0 || popular.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden z-[60]"
                >
                  {searchQuery.length < 2 && popular.length > 0 && (
                    <div className="p-2">
                      <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Ommabop qidiruvlar
                      </p>
                      {popular.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSearch(undefined, term)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-stone-50 rounded-lg transition-colors text-left"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-300" />
                          {term}
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 && suggestions.length > 0 && (
                    <div className="p-2">
                      <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Takliflar
                      </p>
                      {suggestions.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSearch(undefined, term)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-stone-50 rounded-lg transition-colors text-left"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-300" />
                          {term}
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 && suggestions.length === 0 && (
                    <div className="p-4 text-center">
                      <p className="text-sm text-slate-400">Takliflar topilmadi</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <nav className="flex items-center gap-0.5">
            {isAuth && (
              <button
                onClick={() => navTo('/notifications')}
                className="relative p-2.5 text-slate-500 hover:text-slate-900 hover:bg-stone-100 rounded-xl transition-all"
                title="Bildirishnomalar"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {isAuth && (
              <button
                onClick={() => navTo('/chat')}
                className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-stone-100 rounded-xl transition-all hidden sm:block"
                title="Xabarlar"
              >
                <MessageCircle className="w-[18px] h-[18px]" />
              </button>
            )}

            <button
              onClick={() => navTo('/wishlist')}
              className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-stone-100 rounded-xl transition-all hidden sm:block"
              title="Sevimlilar"
            >
              <Heart className="w-[18px] h-[18px]" />
            </button>

            <button
              onClick={() => navTo('/cart')}
              className="relative p-2.5 text-slate-500 hover:text-slate-900 hover:bg-stone-100 rounded-xl transition-all"
              title="Savat"
            >
              <ShoppingCart className="w-[18px] h-[18px]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-stone-200 mx-1.5 hidden sm:block" />

            {isAuth ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 py-1.5 pl-1.5 pr-2 hover:bg-stone-100 rounded-xl transition-all"
                >
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-amber-400 text-sm font-bold shrink-0">
                    {user?.firstName?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
                    {user?.firstName ?? 'Profil'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden lg:block transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl shadow-stone-200/80 border border-stone-200 py-1.5 z-50"
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-stone-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {user?.email ?? user?.phone}
                        </p>
                      </div>

                      {/* Links */}
                      <div className="py-1">
                        <MenuItem icon={User} label="Profil" onClick={() => navTo('/profile')} />
                        <MenuItem icon={Package} label="Buyurtmalarim" onClick={() => navTo('/orders')} />
                        <MenuItem icon={Heart} label="Sevimlilar" onClick={() => navTo('/wishlist')} />
                        <MenuItem icon={MessageCircle} label="Xabarlar" onClick={() => navTo('/chat')} />
                      </div>

                      {/* Seller / Admin / Delivery */}
                      <div className="border-t border-stone-100 py-1">
                          {!isSeller && !isDelivery && (
                            <MenuItem
                              icon={Store}
                              label="Sotuvchi bo'lish"
                              onClick={() => navTo('/profile/become-seller')}
                              accent
                            />
                          )}
                          {isSeller && (
                            <MenuItem
                              icon={Settings}
                              label="Seller panel"
                              onClick={() => navTo('/seller')}
                              accent
                            />
                          )}
                          {isDelivery && (
                            <MenuItem
                              icon={Truck}
                              label="Kuryer panel"
                              onClick={() => navTo('/delivery')}
                              accent
                            />
                          )}
                          {isAdmin && (
                            <MenuItem
                              icon={Settings}
                              label="Admin panel"
                              onClick={() => navTo('/admin')}
                              accent
                            />
                          )}
                        </div>

                      {/* Logout */}
                      <div className="border-t border-stone-100 py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Chiqish
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link
                  to="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-stone-100 rounded-xl transition-all hidden sm:block"
                >
                  Kirish
                </Link>
                <Link
                  to="/auth/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all"
                >
                  Ro'yxatdan o'tish
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qidirish..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-stone-300 transition-all"
            />
          </div>
        </form>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-stone-100 overflow-hidden bg-white"
          >
            <nav className="px-4 py-3 space-y-1">
              <MobileLink icon={Heart} label="Sevimlilar" onClick={() => navTo('/wishlist')} />
              <MobileLink icon={MessageCircle} label="Xabarlar" onClick={() => navTo('/chat')} />
              {isSeller && <MobileLink icon={Settings} label="Seller panel" onClick={() => navTo('/seller')} />}
              {isDelivery && <MobileLink icon={Truck} label="Kuryer panel" onClick={() => navTo('/delivery')} />}
              {isAdmin && <MobileLink icon={Settings} label="Admin panel" onClick={() => navTo('/admin')} />}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ───────── Sub-components ─────────

function MenuItem({
  icon: Icon,
  label,
  onClick,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
        accent
          ? 'text-amber-700 hover:bg-amber-50 font-medium'
          : 'text-slate-700 hover:bg-stone-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function MobileLink({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-700 hover:bg-stone-50 rounded-xl transition-colors"
    >
      <Icon className="w-4 h-4 text-slate-500" />
      {label}
    </button>
  );
}