import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";

// Component imports
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { PWAStatusIndicator } from "@/components/PWAStatusIndicator";

// Page imports
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
import InstallApp from "./pages/InstallApp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  return (
    <React.Fragment>
      <PWAStatusIndicator />
      <InstallPrompt />
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
        <Route path="/instalar" element={<InstallApp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </React.Fragment>
  );
}

function App() {
  console.log('🚀 App iniciando - React disponível:', !!React);
  console.log('🚀 React.useState disponível:', !!React.useState);
  console.log('🚀 React.useRef disponível:', !!React.useRef);
  
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(
      AppProvider,
      null,
      React.createElement(
        TooltipProvider,
        null,
        React.createElement(Toaster),
        React.createElement(Sonner),
        React.createElement(
          BrowserRouter,
          null,
          React.createElement(AppContent)
        )
      )
    )
  );
}

export default App;