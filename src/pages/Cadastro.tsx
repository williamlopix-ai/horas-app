import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Cadastro() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validação se as senhas coincidem
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)

    try {
      const { error: signUpError } = await signUp(email, password)
      if (signUpError) {
        setError(signUpError.message || 'Erro ao realizar o cadastro.')
      } else {
        setSuccess('Cadastro realizado com sucesso! Verifique seu e-mail para confirmação se necessário.')
        // Limpar os campos
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        // Redirecionar para o login após 3 segundos
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (err: any) {
      setError('Ocorreu um erro inesperado. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4 selection:bg-[#03A9F4] selection:text-white">
      <div className="w-full max-w-md bg-[#161B22] rounded-2xl border border-gray-800 shadow-2xl p-8 space-y-6 transition-all duration-300">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-[#03A9F4]/10 text-[#03A9F4] mb-2">
            {/* Ícone de Relógio com mais velocidade na animação */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">HORAS</h1>
          <p className="text-sm text-gray-400">Crie sua conta para gerenciar suas horas centesimais</p>
        </div>

        {/* Alerta de Erro */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl flex items-center gap-3 animate-fadeIn">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Alerta de Sucesso */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm p-4 rounded-xl flex items-center gap-3 animate-fadeIn">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={loading || !!success}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#0B0E14] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#03A9F4] focus:ring-1 focus:ring-[#03A9F4] transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              disabled={loading || !!success}
              placeholder="Min. 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#0B0E14] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#03A9F4] focus:ring-1 focus:ring-[#03A9F4] transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="confirmPassword">
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              disabled={loading || !!success}
              placeholder="Repita sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#0B0E14] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#03A9F4] focus:ring-1 focus:ring-[#03A9F4] transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full py-3 px-4 bg-[#03A9F4] hover:bg-[#0288D1] active:bg-[#0277BD] text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#03A9F4] focus:ring-offset-2 focus:ring-offset-[#161B22] flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Cadastrar'
            )}
          </button>
        </form>

        {/* Link para Voltar ao Login */}
        <div className="text-center text-sm text-gray-400 pt-2 border-t border-gray-800/60">
          Já possui uma conta?{' '}
          <Link to="/login" className="text-[#03A9F4] hover:text-[#0288D1] font-medium transition-colors">
            Voltar para o Login
          </Link>
        </div>

      </div>
    </div>
  )
}
