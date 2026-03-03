
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Categories from '@/pages/Categories';
import Reports from '@/pages/Reports';
import Entities from '@/pages/Entities';
import Layout from '@/components/Layout';

function ProtectedRoute({ children }) {
  const { session } = useAuth();
  return session ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <Helmet>
            <title>FluxoCash - Controle Financeiro Pessoal</title>
            <meta name="description" content="Sistema completo de controle financeiro pessoal com dashboard interativo, gestão de receitas e despesas, relatórios e muito mais." />
          </Helmet>
          <div className="min-h-screen">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/transactions" element={
                <ProtectedRoute>
                  <Layout>
                    <Transactions />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/categories" element={
                <ProtectedRoute>
                  <Layout>
                    <Categories />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/entities" element={
                <ProtectedRoute>
                  <Layout>
                    <Entities />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
            <Toaster />
          </div>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
  