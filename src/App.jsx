import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {ToastContainer} from 'react-toastify';
import HomePage from "./pages/homepage";
import AdminLogin from "./admin/loginpage";
import AdminPanel from "./admin/adminpanel";
import UserLogin from "./user/login";
import UserDashboard from "./user/dashboard";
export default function App() {
  return (
    <BrowserRouter>
    <ToastContainer position="top-center">
    </ToastContainer>
      <Routes>
        <Route path="/userdashboard" element={<UserDashboard/>} />
        <Route path="/userlogin" element={<UserLogin/>} />
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/adminpanel" element={<AdminPanel />} />
      </Routes>
       </BrowserRouter>
       )
}
