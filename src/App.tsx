import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'

const Registros = lazy(() => import('./pages/Registros'))
const Resumo    = lazy(() => import('./pages/Resumo'))
const Timesheet = lazy(() => import('./pages/Timesheet'))
const Billable  = lazy(() => import('./pages/Billable'))
const Projetos  = lazy(() => import('./pages/Projetos'))
const Ajustes   = lazy(() => import('./pages/Ajustes'))

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={
            <div className="fixed inset-0 bg-[#0B0E14] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#03A9F4] border-t-transparent rounded-full animate-spin" />
            </div>
          }>
          <Routes>
            {/* Redirecionamento da raiz para /registros */}
            <Route path="/" element={<Navigate to="/registros" replace />} />
            
            {/* Rotas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            
            <Route
              path="/registros"
              element={
                <ProtectedRoute>
                  <Registros />
                </ProtectedRoute>
              }
            />

            <Route
              path="/resumo"
              element={
                <ProtectedRoute>
                  <Resumo />
                </ProtectedRoute>
              }
            />

            <Route
              path="/timesheet"
              element={
                <ProtectedRoute>
                  <Timesheet />
                </ProtectedRoute>
              }
            />

            <Route
              path="/billable"
              element={
                <ProtectedRoute>
                  <Billable />
                </ProtectedRoute>
              }
            />

            <Route
              path="/projetos"
              element={
                <ProtectedRoute>
                  <Projetos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ajustes"
              element={
                <ProtectedRoute>
                  <Ajustes />
                </ProtectedRoute>
              }
            />

            {/* Fallback para rotas não encontradas */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
