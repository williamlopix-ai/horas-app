import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getErrorMessage } from '../utils/errors'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        setError(getErrorMessage(signInError))
      } else {
        navigate('/registros')
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
          <p className="text-sm text-ink-500">Gerencie seu tempo com precisão centesimal</p>
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
              disabled={loading}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-surface-0 border border-hair-strong rounded-ctl text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-d1 ease-ez disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider" htmlFor="password">
                Senha
              </label>
            </div>
            <input
              id="password"
              type="password"
              required
              disabled={loading}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-surface-0 border border-hair-strong rounded-ctl text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-d1 ease-ez disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-pri text-pri-fg font-semibold shadow-e1 hover:bg-pri-hover rounded-ctl transition-[background-color,transform] duration-d1 ease-ez transform hover:scale-[1.01] active:translate-y-[0.5px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg focus-visible:border-accent flex items-center justify-center gap-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <Loader2 className="animate-spin w-icon-md h-icon-md" />
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Link para Cadastro */}
        <div className="text-center text-sm text-ink-500 pt-2 border-t border-hair">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="text-accent hover:opacity-80 font-medium transition-colors duration-d1 ease-ez">
            Cadastre-se gratuitamente
          </Link>
        </div>

      </div>
    </main>
  )
}
