import { Routes, Route } from "react-router-dom";
import Home from "./pages/home.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import VerifyEmail from "./pages/verifyEmail";
import ForgotPassword from "./pages/forgot.jsx";
import OTP from "./pages/otp.jsx";
import ChangePassword from "./pages/changePassword.jsx";


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


    </Routes>
  );
}
