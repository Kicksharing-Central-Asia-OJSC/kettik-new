import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Phone from "@/pages/auth/Phone";
import Code from "@/pages/auth/Code";
import ProfileView from "@/pages/profile/ProfileView";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route path="/auth/phone" element={<Phone />} />
        <Route path="/auth/code" element={<Code />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileView />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div>404</div>} />
      </Routes>
    </BrowserRouter>
  );
}
