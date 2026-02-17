import { Routes, Route } from "react-router-dom";
import Home from "./pages/home.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import VerifyEmail from "./pages/verifyEmail.jsx";
import ForgotPassword from "./pages/forgot.jsx";
import OTP from "./pages/otp.jsx";
import ChangePassword from "./pages/changePassword.jsx";
import OwnerDashboard from "./pages/ownerDashboard.jsx";
import StaffDashboard from "./pages/staffDashboard.jsx";
import StaffAttendance from "./pages/staffAttendance.jsx";
import StaffInventory from "./pages/staffInventory.jsx";
import StaffProfile from "./pages/staffProfile.jsx";
import CustomerDashboard from "./pages/customerDashboard.jsx";
import UserAuthentication from "./pages/UserAuthentication.jsx";
import ProductManagement from "./pages/ProductManagement.jsx";
import Sidebar from "./components/Sidebar";
import Addstaff from "./pages/addStaff.jsx";
import ProductDetails from "./pages/ProductDetails";
import Checkout from "./pages/Checkout.jsx";
import OrderHistory from "./pages/OrderHistory.jsx";


export default function App() {
  return (
   
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp/:email" element={<OTP />} />
        <Route path="/change-password/:email" element={<ChangePassword />} />
        <Route path="/verify/:token" element={<VerifyEmail />} />
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/staff-attendance" element={<StaffAttendance />} />
        <Route path="/staff-inventory" element={<StaffInventory />} />
        <Route path="/staff-profile" element={<StaffProfile />} />
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        <Route path="/user-authentication" element={<UserAuthentication />} />
        <Route path="/product-management" element={<ProductManagement />} />
        <Route path="/add-staff" element={<Addstaff />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<OrderHistory />} />



      </Routes>
   
  );
}
