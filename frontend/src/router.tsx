import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { GuestGuard } from "@/components/guards/GuestGuard";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { HomePage } from "@/pages/HomePage";
import { CatalogPage } from "@/pages/catalog/CatalogPage";
import { ProductPage } from "@/pages/products/ProductPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { CartPage } from "@/pages/cart/CartPage";
import { CheckoutPage } from "@/pages/checkout/CheckoutPage";
import { OrdersPage } from "@/pages/orders/OrdersPage";
import { OrderDetailPage } from "@/pages/orders/OrderDetailPage";
import { WishlistPage } from "@/pages/wishlist/WishlistPage";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { NotificationsPage } from "@/pages/notifications/NotificationsPage";
import { ChatPage } from "@/pages/chat/ChatPage";
import { SellerLayout } from "@/pages/seller/SellerLayout";
import { SellerDashboard } from "@/pages/seller/SellerDashboard";
import { SellerProducts } from "@/pages/seller/SellerProducts";
import { SellerProductForm } from "@/pages/seller/SellerProductForm";
import { SellerOrders } from "@/pages/seller/SellerOrders";
import { SellerReviews } from "@/pages/seller/SellerReviews";
import { SellerAnalytics } from "@/pages/seller/SellerAnalytics";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminUsers } from "@/pages/admin/AdminUsers";
import { AdminProducts } from "@/pages/admin/AdminProducts";
import { AdminOrders } from "@/pages/admin/AdminOrders";
import { AdminCoupons } from "@/pages/admin/AdminCoupons";
import { AdminDelivery } from "@/pages/admin/AdminDelivery";
import { AdminPromo } from "@/pages/admin/AdminPromo";
import { AdminAnalytics } from "@/pages/admin/AdminAnalytics";
import { AdminPayments } from "@/pages/admin/AdminPayments";
import { AdminSellers } from "@/pages/admin/AdminSellers";
import { AdminCategories } from "@/pages/admin/AdminCategories";
import { AdminBanners } from "@/pages/admin/AdminBanners";
import { AdminReviews } from "@/pages/admin/AdminReviews";
import { DeliveryLayout } from "@/pages/delivery/DeliveryLayout";
import { DeliveryOrders } from "@/pages/delivery/DeliveryOrders";
import { DeliveryOrderDetail } from "@/pages/delivery/DeliveryOrderDetail";
import { DeliveryHistory } from "@/pages/delivery/DeliveryHistory";
import { BecomeSeller } from "@/pages/profile/BecomeSeller";
import { PaymentPage } from "@/pages/payment/PaymentPage";
import { PaymentSimulator } from "@/pages/payment/PaymentSimulator";
import { AboutPage, ContactPage, PrivacyPage, TermsPage } from "@/pages/static/StaticPages";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },

      // Public
      { path: "catalog", element: <CatalogPage /> },
      { path: "catalog/:categorySlug", element: <CatalogPage /> },
      { path: "products/:slug", element: <ProductPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "privacy", element: <PrivacyPage /> },
      { path: "terms", element: <TermsPage /> },

      // Payment simulator — public (token-based auth, no user session needed)
      { path: "payment/simulate/:token", element: <PaymentSimulator /> },

      // Guest only
      {
        element: <GuestGuard />,
        children: [
          { path: "auth/login", element: <LoginPage /> },
          { path: "auth/register", element: <RegisterPage /> },
          { path: "auth/verify-email", element: <VerifyEmailPage /> },
        ],
      },

      // Auth required
      {
        element: <AuthGuard />,
        children: [
          { path: "cart", element: <CartPage /> },
          { path: "checkout", element: <CheckoutPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "orders/:id", element: <OrderDetailPage /> },
          { path: "wishlist", element: <WishlistPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "profile/become-seller", element: <BecomeSeller /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "chat", element: <ChatPage /> },
          { path: "payment/:orderId", element: <PaymentPage /> },
        ],
      },

      // Seller
      {
        path: "seller",
        element: <RoleGuard roles={["seller", "admin"]} />,
        children: [
          {
            element: <SellerLayout />,
            children: [
              { index: true, element: <SellerDashboard /> },
              { path: "products", element: <SellerProducts /> },
              { path: "products/new", element: <SellerProductForm /> },
              { path: "products/:id/edit", element: <SellerProductForm /> },
              { path: "orders", element: <SellerOrders /> },
              { path: "reviews", element: <SellerReviews /> },
              { path: "analytics", element: <SellerAnalytics /> },
              { path: "chat", element: <ChatPage /> },
            ],
          },
        ],
      },

      // Delivery (Courier)
      {
        path: "delivery",
        element: <RoleGuard roles={["delivery", "admin"]} />,
        children: [
          {
            element: <DeliveryLayout />,
            children: [
              { index: true, element: <DeliveryOrders /> },
              { path: ":id", element: <DeliveryOrderDetail /> },
              { path: "history", element: <DeliveryHistory /> },
            ],
          },
        ],
      },

      // Admin
      {
        path: "admin",
        element: <RoleGuard roles={["admin"]} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: "analytics", element: <AdminAnalytics /> },
              { path: "users", element: <AdminUsers /> },
              { path: "sellers", element: <AdminSellers /> },
              { path: "products", element: <AdminProducts /> },
              { path: "orders", element: <AdminOrders /> },
              { path: "payments", element: <AdminPayments /> },
              { path: "categories", element: <AdminCategories /> },
              { path: "banners", element: <AdminBanners /> },
              { path: "coupons", element: <AdminCoupons /> },
              { path: "reviews", element: <AdminReviews /> },
              { path: "delivery", element: <AdminDelivery /> },
              { path: "promo", element: <AdminPromo /> },
            ],
          },
        ],
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
