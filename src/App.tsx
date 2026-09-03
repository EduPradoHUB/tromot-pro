import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";
import { PublicLayout } from "@/components/PublicLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NotificationManager } from "@/components/NotificationManager";
import { SupportChatWidget } from "@/components/SupportChatWidget";
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
import KnowledgeBase from "./pages/KnowledgeBase";
import WhatsappConversations from "./pages/WhatsappConversations";
import ProductNotifications from "./pages/ProductNotifications";
import Unsubscribe from "./pages/Unsubscribe";

const queryClient = new QueryClient();

function AppContent() {
  return (
    <>
      {/* Toaster renderizado aqui dentro do BrowserRouter para evitar conflitos de hooks */}
      <Toaster />
      <SupportChatWidget />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<PasswordReset />} />

        {/* Rotas Públicas - Acesso sem cadastro */}
        <Route path="/manuais-publico" element={<PublicLayout><PublicCatalog /></PublicLayout>} />
        <Route path="/manual/:id" element={<PublicLayout><PublicProduct /></PublicLayout>} />

        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/manuais" element={<Layout><Catalog /></Layout>} />
        <Route path="/produto/:id" element={<Layout><Product /></Layout>} />
        <Route path="/comprar/:id" element={<Layout><WhereToBuy /></Layout>} />
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
        <Route path="/termos" element={<Layout><Terms /></Layout>} />
        <Route path="/privacidade" element={<Layout><Privacy /></Layout>} />
        <Route path="/instalar" element={<InstallApp />} />

        <Route path="/blog" element={<Layout><Blog /></Layout>} />

            <Route path="/admin/bling" element={
              <ProtectedRoute>
                <Layout><BlingConfig /></Layout>
              </ProtectedRoute>
            } />
        <Route path="/admin/base-conhecimento" element={
          <ProtectedRoute requireRoles={['ADM', 'Técnico Tromot']}>
            <Layout><KnowledgeBase /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/conversas" element={
          <ProtectedRoute requireAdmin>
            <Layout><WhatsappConversations /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/notificacoes-produto" element={
          <ProtectedRoute requireRoles={['ADM', 'Técnico Tromot']}>
            <Layout><ProductNotifications /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/descadastro" element={<Unsubscribe />} />
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
