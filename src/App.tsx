import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppDownloadDialog } from "@/components/AppDownloadDialog";
import { useAutoInstall } from "@/hooks/useAutoInstall";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Product from "./pages/Product";
import WhereToBuy from "./pages/WhereToBuy";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import MediaDashboard from "./pages/MediaDashboard";
import Users from "./pages/Users";
import Login from "./pages/Login";
import PasswordReset from "./pages/PasswordReset";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import InstalarApp from "./pages/InstalarApp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { shouldShowDialog, setShouldShowDialog } = useAutoInstall();

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout><Home /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/manuais" element={
          <ProtectedRoute>
            <Layout><Catalog /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/produto/:id" element={
          <ProtectedRoute>
            <Layout><Product /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/comprar/:id" element={
          <ProtectedRoute>
            <Layout><WhereToBuy /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/perfil" element={
          <ProtectedRoute>
            <Layout><Profile /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/tecnico" element={
          <ProtectedRoute>
            <Layout><TechnicianDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/midia" element={
          <ProtectedRoute requireAdmin>
            <Layout><MediaDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/usuarios" element={
          <ProtectedRoute requireAdmin>
            <Layout><Users /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/termos" element={
          <ProtectedRoute>
            <Layout><Terms /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/privacidade" element={
          <ProtectedRoute>
            <Layout><Privacy /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/instalar" element={<InstalarApp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AppDownloadDialog 
        open={shouldShowDialog} 
        onOpenChange={setShouldShowDialog} 
      />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
