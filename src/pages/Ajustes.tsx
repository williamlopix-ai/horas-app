import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import { buscarConfiguracoes, salvarConfiguracoes } from '../services/configuracoes'

export default function Ajustes() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  // Estados dos Campos de Configuração
  const [metaSemanal, setMetaSemanal] = useState<number>(42.5)
  const [inicioSemana, setInicioSemana] = useState<'segunda' | 'domingo'>('segunda')
  const [formatoHoras, setFormatoHoras] = useState<'decimal' | 'hhmm'>('decimal')
  const [inicioDia, setInicioDia] = useState<string>('08:00')
  const [fimDia, setFimDia] = useState<string>('18:00')

  // Estados de UI/Feedback
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar configurações do usuário ao montar
  const carregarConfiguracoes = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      const config = await buscarConfiguracoes(user.id)
      setMetaSemanal(config.meta_semanal)
      setInicioSemana(config.inicio_semana)
      setFormatoHoras(config.formato_horas)
      setInicioDia(config.inicio_dia || '08:00')
      setFimDia(config.fim_dia || '18:00')
    } catch (err: any) {
      console.error('Erro ao buscar configurações:', err)
      setError('Não foi possível carregar suas configurações.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarConfiguracoes()
  }, [user])

  // Lidar com Salvamento
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      await salvarConfiguracoes(user.id, {
        meta_semanal: metaSemanal,
        inicio_semana: inicioSemana,
        formato_horas: formatoHoras,
        inicio_dia: inicioDia,
        fim_dia: fimDia
      })

      setSuccess(true)
      // Ocultar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err)
      setError('Ocorreu um erro ao salvar as configurações.')
    } finally {
      setSaving(false)
    }
  }

  // Incremento e Decremento da Meta Semanal
  const incrementarMeta = () => {
    setMetaSemanal((prev) => +(prev + 0.5).toFixed(1))
  }

  const decrementarMeta = () => {
    setMetaSemanal((prev) => (prev > 0.5 ? +(prev - 0.5).toFixed(1) : 0.5))
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex">
      {/* Sidebar de Navegação */}
      <aside className="w-[240px] bg-[#161B22] border-r border-gray-800 flex flex-col shrink-0 min-h-screen">
        <div className="p-6 border-b border-gray-800/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#03A9F4]/10 text-[#03A9F4]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">HORAS</span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <Link
            to="/registros"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive('/registros')
                ? 'bg-[#03A9F4]/10 text-[#03A9F4] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Registros
          </Link>
          
          <Link
            to="/resumo"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive('/resumo')
                ? 'bg-[#03A9F4]/10 text-[#03A9F4] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Resumo
          </Link>

          <Link
            to="/projetos"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive('/projetos')
                ? 'bg-[#03A9F4]/10 text-[#03A9F4] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Projetos
          </Link>

          <Link
            to="/ajustes"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              isActive('/ajustes')
                ? 'bg-[#03A9F4]/10 text-[#03A9F4] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ajustes
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800/80 flex flex-col gap-2">
          <div className="px-2 py-1">
            <span className="block text-xs text-gray-500 font-semibold truncate">{user?.email}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-xl border border-red-500/20 transition-all focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-8 overflow-y-auto max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Configurações</h1>
          <p className="text-sm text-gray-400">Personalize o comportamento e as metas do seu aplicativo.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}

        {loading ? (
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-8 w-8 text-[#03A9F4]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-400">Carregando configurações...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
            
            {/* 1. Meta Semanal */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Meta Semanal</h3>
                <p className="text-xs text-gray-400">Defina o total de horas de trabalho estipulado por semana.</p>
              </div>
              <div className="flex items-center gap-2 max-w-[200px]">
                <button
                  type="button"
                  onClick={decrementarMeta}
                  className="w-10 h-10 bg-[#0B0E14] hover:bg-gray-800 border border-gray-800 text-white font-bold text-lg rounded-xl flex items-center justify-center focus:outline-none select-none transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={metaSemanal}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    setMetaSemanal(isNaN(val) ? 0 : val)
                  }}
                  className="flex-1 bg-[#0B0E14] border border-gray-800 rounded-xl py-2 h-10 text-center font-mono font-bold text-white text-base focus:outline-none focus:border-[#03A9F4]"
                />
                <button
                  type="button"
                  onClick={incrementarMeta}
                  className="w-10 h-10 bg-[#0B0E14] hover:bg-gray-800 border border-gray-800 text-white font-bold text-lg rounded-xl flex items-center justify-center focus:outline-none select-none transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* 2. Início da Semana */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Início da Semana</h3>
                <p className="text-xs text-gray-400">Escolha o dia em que o ciclo da semana se inicia para os resumos.</p>
              </div>
              <div className="inline-flex bg-[#0B0E14] p-1 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => setInicioSemana('segunda')}
                  className={`py-2 px-5 text-xs font-semibold rounded-lg transition-all focus:outline-none ${
                    inicioSemana === 'segunda'
                      ? 'bg-[#03A9F4] text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Segunda-feira
                </button>
                <button
                  type="button"
                  onClick={() => setInicioSemana('domingo')}
                  className={`py-2 px-5 text-xs font-semibold rounded-lg transition-all focus:outline-none ${
                    inicioSemana === 'domingo'
                      ? 'bg-[#03A9F4] text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Domingo
                </button>
              </div>
            </div>

            {/* 3. Formato de Exibição das Horas */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Formato de Horas</h3>
                <p className="text-xs text-gray-400">Selecione como deseja visualizar as horas no aplicativo.</p>
              </div>
              <div className="inline-flex bg-[#0B0E14] p-1 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => setFormatoHoras('decimal')}
                  className={`py-2 px-5 text-xs font-semibold rounded-lg transition-all focus:outline-none ${
                    formatoHoras === 'decimal'
                      ? 'bg-[#03A9F4] text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Decimal (ex: 1,50h)
                </button>
                <button
                  type="button"
                  onClick={() => setFormatoHoras('hhmm')}
                  className={`py-2 px-5 text-xs font-semibold rounded-lg transition-all focus:outline-none ${
                    formatoHoras === 'hhmm'
                      ? 'bg-[#03A9F4] text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  HH:MM (ex: 01:30)
                </button>
              </div>
            </div>

            {/* 4. Horário Padrão do Dia */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Horário Padrão do Dia</h3>
                <p className="text-xs text-gray-400">Defina os horários de início e fim da sua jornada de trabalho.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label htmlFor="inicioDia" className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Início
                  </label>
                  <input
                    id="inicioDia"
                    type="time"
                    value={inicioDia}
                    onChange={(e) => setInicioDia(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-gray-800 rounded-xl py-2 px-3 h-10 text-white font-mono text-sm focus:outline-none focus:border-[#03A9F4] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label htmlFor="fimDia" className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Fim
                  </label>
                  <input
                    id="fimDia"
                    type="time"
                    value={fimDia}
                    onChange={(e) => setFimDia(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-gray-800 rounded-xl py-2 px-3 h-10 text-white font-mono text-sm focus:outline-none focus:border-[#03A9F4] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Ação de Salvar */}
            <div className="pt-4 border-t border-gray-800/80">
              <button
                type="submit"
                disabled={saving || metaSemanal <= 0}
                className="py-3 px-6 bg-[#03A9F4] hover:bg-[#0091d2] active:bg-[#007cb5] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none shadow-lg shadow-[#03A9F4]/20"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando preferências...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </button>
            </div>

          </form>
        )}
      </main>
    </div>
  )
}
