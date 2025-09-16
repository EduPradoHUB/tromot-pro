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
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(PWAStatusIndicator),
    React.createElement(InstallPrompt),
    React.createElement(
      Routes,
      null,
      React.createElement(Route, { path: "/login", element: React.createElement(Login) }),
      React.createElement(Route, { path: "/reset-password", element: React.createElement(PasswordReset) }),
      React.createElement(Route, { 
        path: "/", 
        element: React.createElement(
          ProtectedRoute,
          { children: React.createElement(Layout, null, React.createElement(Home)) }
        )
      }),
      React.createElement(Route, { 
        path: "/manuais", 
        element: React.createElement(
          ProtectedRoute,
          { children: React.createElement(Layout, null, React.createElement(Catalog)) }
        )
      }),
      React.createElement(Route, { 
        path: "/produto/:id", 
        element: React.createElement(
          ProtectedRoute,
          { children: React.createElement(Layout, null, React.createElement(Product)) }
        )
      }),
      React.createElement(Route, { 
        path: "/comprar/:id", 
        element: React.createElement(
          ProtectedRoute,
          { children: React.createElement(Layout, null, React.createElement(WhereToBuy)) }
        )
      }),
      React.createElement(Route, { 
        path: "/perfil", 
        element: React.createElement(
          ProtectedRoute,
          { children: React.createElement(Layout, null, React.createElement(Profile)) }
        )
      }),
      React.createElement(Route, { 
        path: "/dashboard", 
        element: React.createElement(
          ProtectedRoute,
          { children: React.createElement(Layout, null, React.createElement(Dashboard)) }
        )
      }),
      React.createElement(Route, { 
        path: "/admin", 
        element: React.createElement(
          ProtectedRoute,
          { requireAdmin: true, children: React.createElement(Layout, null, React.createElement(AdminDashboard)) }
        )
      }),
      React.createElement(Route, { 
        path: "/tecnico", 
        element: React.createElement(
          ProtectedRoute,
          { children: React.createElement(Layout, null, React.createElement(TechnicianDashboard)) }
        )
      }),
      React.createElement(Route, { 
        path: "/midia", 
        element: React.createElement(
          ProtectedRoute,
          { requireAdmin: true, children: React.createElement(Layout, null, React.createElement(MediaDashboard)) }
        )
      }),
      React.createElement(Route, { 
        path: "/usuarios", 
        element: React.createElement(
          ProtectedRoute,
          { requireAdmin: true, children: React.createElement(Layout, null, React.createElement(Users)) }
        )
      }),
      React.createElement(Route, { 
        path: "/termos", 
        element: React.createElement(
          ProtectedRoute,
          { children: React.createElement(Layout, null, React.createElement(Terms)) }
        )
      }),
      React.createElement(Route, { 
        path: "/privacidade", 
        element: React.createElement(
          ProtectedRoute,
          { children: React.createElement(Layout, null, React.createElement(Privacy)) }
        )
      }),
      React.createElement(Route, { path: "/instalar", element: React.createElement(InstallApp) }),
      React.createElement(Route, { path: "*", element: React.createElement(NotFound) })
    )
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
      React.createElement(Toaster),
      React.createElement(Sonner),
      React.createElement(
        BrowserRouter,
        null,
        React.createElement(AppContent)
      )
    )
  );
}

export default App;