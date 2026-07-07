import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Analytics from './pages/Analytics.jsx';
import Categories from './pages/Categories.jsx';
import CategoryForm from './pages/CategoryForm.jsx';
import Products from './pages/Products.jsx';
import ProductForm from './pages/ProductForm.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetails from './pages/OrderDetails.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetails from './pages/CustomerDetails.jsx';
import Reviews from './pages/Reviews.jsx';
import ReviewDetails from './pages/ReviewDetails.jsx';
import PromoCodes from './pages/PromoCodes.jsx';
import PromoCodeForm from './pages/PromoCodeForm.jsx';
import Messages from './pages/Messages.jsx';
import Newsletter from './pages/Newsletter.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/categories/new" element={<CategoryForm />} />
              <Route path="/categories/:id/edit" element={<CategoryForm />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/new" element={<ProductForm />} />
              <Route path="/products/:id/edit" element={<ProductForm />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetails />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/reviews/:id" element={<ReviewDetails />} />
              <Route path="/promo-codes" element={<PromoCodes />} />
              <Route path="/promo-codes/new" element={<PromoCodeForm />} />
              <Route path="/promo-codes/:id/edit" element={<PromoCodeForm />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/newsletter" element={<Newsletter />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
