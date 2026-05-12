import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";
import { PublicLayout } from "@/components/PublicLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NotificationManager } from "@/components/NotificationManager";
import { Toaster } from "@/components/ui/toaster";

import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Product from "./pages/Product";
import PublicCatalog from "./pages/PublicCatalog";
import PublicProduct from "./pages/PublicProduct";
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
import InstallApp from "./pages/InstallApp";
import Saved from "./pages/Saved";
import NotFound from "./pages/NotFound";
import BlingConfig from "./pages/BlingConfig";
import Blog from "./pages/Blog";

const queryClient = new QueryClient();

function AppContent() {
  return (
    <>
      {/* Toaster renderizado aqui dentro do BrowserRouter para evitar conflitos de hooks */}
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<PasswordReset />} />

        {/* Rotas Públicas - Acesso sem cadastro */}
        <Route path="/manuais-publico" element={<PublicLayout><PublicCatalog /></PublicLayout>} />
        <Route path="/manual/:id" element={<PublicLayout><PublicProduct /></PublicLayout>} />

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
        <Route path="/salvos" element={
          <ProtectedRoute>
            <Layout><Saved /></Layout>
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
          <ProtectedRoute requireRoles={['ADM', 'Técnico Tromot', 'Suporte Tromot']}>
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
        <Route path="/instalar" element={<InstallApp />} />

        <Route path="/blog" element={
          <ProtectedRoute>
            <Layout><Blog /></Layout>
          </ProtectedRoute>
        } />

            <Route path="/admin/bling" element={
              <ProtectedRoute>
                <Layout><BlingConfig /></Layout>
              </ProtectedRoute>
            } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <NotificationManager />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
