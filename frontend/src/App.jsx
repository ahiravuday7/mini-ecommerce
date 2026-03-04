import { Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";

import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/user/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/user/Checkout";
import MyOrders from "./pages/user/MyOrders";
import Account from "./pages/user/Account";
import AdminProducts from "./pages/admin/AdminProducts";
import OrderDetails from "./pages/user/OrderDetails";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FAQs from "./pages/FAQs";
import AdminFaqs from "./pages/admin/AdminFaqs";
import Products from "./pages/Products";
import AdminDashboard from "./pages/admin/AdminDashboard";

import AdminRoute from "./components/admin/AdminRoute";
import UserRoute from "./components/user/UserRoute";
import ShopperRoute from "./components/user/ShopperRoute";
import AdminHome from "./pages/admin/AdminHome";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={
            <ShopperRoute>
              <Home />
            </ShopperRoute>
          }
        />
        <Route
          path="/product/:id"
          element={
            <ShopperRoute>
              <ProductDetails />
            </ShopperRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <UserRoute>
              <Cart />
            </UserRoute>
          }
        />

        <Route
          path="/login"
          element={
            <ShopperRoute guestOnly>
              <Login />
            </ShopperRoute>
          }
        />
        <Route
          path="/register"
          element={
            <ShopperRoute guestOnly>
              <Register />
            </ShopperRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <UserRoute>
              <Checkout />
            </UserRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <UserRoute>
              <MyOrders />
            </UserRoute>
          }
        />
        <Route
          path="/account"
          element={
            <UserRoute>
              <Account />
            </UserRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <UserRoute>
              <OrderDetails />
            </UserRoute>
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route
          path="/faqs"
          element={
            <ShopperRoute>
              <FAQs />
            </ShopperRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ShopperRoute>
              <Products />
            </ShopperRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminHome />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/faqs"
          element={
            <AdminRoute>
              <AdminFaqs />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}
