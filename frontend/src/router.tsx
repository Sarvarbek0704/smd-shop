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
import { SellerOrders } from "@/pages/seller/SellerOrders";
import { SellerReviews } from "@/pages/seller/SellerReviews";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminUsers } from "@/pages/admin/AdminUsers";
import { AdminProducts } from "@/pages/admin/AdminProducts";
import { AdminOrders } from "@/pages/admin/AdminOrders";
import { AdminCoupons } from "@/pages/admin/AdminCoupons";
import { AdminDelivery } from "@/pages/admin/AdminDelivery";
import { AdminPromo } from "@/pages/admin/AdminPromo";

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
          { path: "notifications", element: <NotificationsPage /> },
          { path: "chat", element: <ChatPage /> },
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
              { path: "orders", element: <SellerOrders /> },
              { path: "reviews", element: <SellerReviews /> },
              { path: "chat", element: <ChatPage /> },
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
              { path: "users", element: <AdminUsers /> },
              { path: "products", element: <AdminProducts /> },
              { path: "orders", element: <AdminOrders /> },
              { path: "coupons", element: <AdminCoupons /> },
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
