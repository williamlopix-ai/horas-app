import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getErrorMessage } from '../utils/errors'

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
        setError(getErrorMessage(signUpError))
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
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface-0 flex items-center justify-center p-4 selection:bg-accent selection:text-white">
      <div className="w-full max-w-md bg-surface-1 rounded-sheet border border-hair-strong shadow-2xl p-8 space-y-6 transition-opacity duration-d3 ease-ez">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-card bg-accent-bg text-accent mb-2">
            <Clock className="w-icon-xl h-icon-xl animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">HORAS</h1>
          <p className="text-sm text-ink-500">Crie sua conta para gerenciar suas horas centesimais</p>
        </div>

        {/* Alerta de Erro */}
        {error && (
          <div
            style={{ borderColor: 'color-mix(in srgb, var(--bad) 30%, transparent)' }}
            className="bg-bad-bg border text-bad text-sm p-4 rounded-card flex items-center gap-md"
          >
            <AlertTriangle className="w-icon-md h-icon-md shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Alerta de Sucesso */}
        {success && (
          <div
            style={{ borderColor: 'color-mix(in srgb, var(--ok) 30%, transparent)' }}
            className="bg-ok-bg border text-ok text-sm p-4 rounded-card flex items-center gap-md"
          >
            <CheckCircle2 className="w-icon-md h-icon-md shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider" htmlFor="email">
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
              className="w-full px-4 py-3 bg-surface-0 border border-hair-strong rounded-ctl text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-d1 ease-ez disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider" htmlFor="password">
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
              className="w-full px-4 py-3 bg-surface-0 border border-hair-strong rounded-ctl text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-d1 ease-ez disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider" htmlFor="confirmPassword">
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
              className="w-full px-4 py-3 bg-surface-0 border border-hair-strong rounded-ctl text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-d1 ease-ez disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full py-3 px-4 bg-pri text-pri-fg font-semibold shadow-e1 hover:bg-pri-hover rounded-ctl transition-[background-color,transform] duration-d1 ease-ez transform hover:scale-[1.01] active:translate-y-[0.5px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg focus-visible:border-accent flex items-center justify-center gap-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <Loader2 className="animate-spin w-icon-md h-icon-md" />
            ) : (
              'Cadastrar'
            )}
          </button>
        </form>

        {/* Link para Voltar ao Login */}
        <div className="text-center text-sm text-ink-500 pt-2 border-t border-hair">
          Já possui uma conta?{' '}
          <Link to="/login" className="text-accent hover:opacity-80 font-medium transition-colors duration-d1 ease-ez">
            Voltar para o Login
          </Link>
        </div>

      </div>
    </main>
  )
}
