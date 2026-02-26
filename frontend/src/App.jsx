import { Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";

import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import AdminProducts from "./pages/AdminProducts";
import OrderDetails from "./pages/OrderDetails";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FAQs from "./pages/FAQs";
import AdminFaqs from "./pages/AdminFaqs";
import Products from "./pages/Products";

import AdminRoute from "./components/AdminRoute";
import UserRoute from "./components/UserRoute";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={
            <UserRoute>
              <Home />
            </UserRoute>
          }
        />
        <Route
          path="/product/:id"
          element={
            <UserRoute>
              <ProductDetails />
            </UserRoute>
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

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
            <UserRoute>
              <FAQs />
            </UserRoute>
          }
        />
        <Route
          path="/products"
          element={
            <UserRoute>
              <Products />
            </UserRoute>
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
