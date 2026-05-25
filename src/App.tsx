import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Projetos from './pages/Projetos'
import Registros from './pages/Registros'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirecionamento da raiz para o Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
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
            path="/projetos"
            element={
              <ProtectedRoute>
                <Projetos />
              </ProtectedRoute>
            }
          />

          {/* Fallback para rotas não encontradas */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
