import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Registros from './pages/Registros'
import Resumo from './pages/Resumo'
import Timesheet from './pages/Timesheet'
import Billable from './pages/Billable'
import Projetos from './pages/Projetos'
import Ajustes from './pages/Ajustes'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Redirecionamento da raiz para /registros */}
            <Route path="/" element={<Navigate to="/registros" replace />} />
            
            {/* Rotas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            
            {/* Rota Protegida - Redireciona para /registros como padrão */}
            <Route
              path="/dashboard"
              element={
                <Navigate to="/registros" replace />
              }
            />

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
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
