import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StudentAuthProvider, useStudentAuth } from "@/context/StudentAuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import NotFound from "./pages/NotFound";
import AdminDataEntry from "./pages/AdminDataEntry"
const queryClient = new QueryClient();

const RequireAdmin = ({ children }: { children: JSX.Element }) => {
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("adminAuth") === "true";
  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RequireStudent = ({ children }: { children: JSX.Element }) => {
  const { studentData } = useStudentAuth();
  if (!studentData) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <StudentAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <RequireStudent>
                  <StudentDashboard />
                </RequireStudent>
              }
            />
            <Route
              path="/admin/data"
              element={
                <RequireAdmin>
                  <AdminDataEntry />
                </RequireAdmin>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </StudentAuthProvider>
  </QueryClientProvider>
);

export default App;
