import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Phone from "@/pages/auth/Phone";
import Code from "@/pages/auth/Code";
import Dashboard from "@/pages/dashboard/Dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth/phone" element={<Phone />} />
        <Route path="/auth/code" element={<Code />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Backward compatibility */}
        <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<div>404</div>} />
      </Routes>
    </BrowserRouter>
  );
}