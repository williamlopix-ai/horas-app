import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import { listarRegistros } from '../services/registros'
import { buscarConfiguracoes } from '../services/configuracoes'
import type { Registro } from '../types'

export default function Resumo() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const [registros, setRegistros] = useState<Registro[]>([])
  const [metaSemanal, setMetaSemanal] = useState<number>(42.5)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar dados (configurações do usuário e registros de horas)
  const carregarDados = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)

      // 1. Carregar Configurações para obter a Meta Semanal
      const config = await buscarConfiguracoes(user.id)
      setMetaSemanal(config.meta_semanal)

      // 2. Carregar Registros de Horas
      const regs = await listarRegistros(user.id)
      setRegistros(regs)
    } catch (err: any) {
      console.error('Erro ao carregar dados do resumo:', err)
      setError('Não foi possível carregar as informações do resumo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [user])

  // Formatar Título da Semana (ex: "18 mai a 24 mai (2026)")
  const formatarTituloSemana = (semanaInicio: string) => {
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    const [y, m, d] = semanaInicio.split('-').map(Number)
    const segunda = new Date(y, m - 1, d)
    
    const domingo = new Date(segunda)
    domingo.setDate(segunda.getDate() + 6)

    const d1 = segunda.getDate()
    const m1 = meses[segunda.getMonth()]
    const d2 = domingo.getDate()
    const m2 = meses[domingo.getMonth()]
    const ano = domingo.getFullYear()

    if (segunda.getMonth() === domingo.getMonth()) {
      return `${String(d1).padStart(2, '0')} a ${String(d2).padStart(2, '0')} ${m1} (${ano})`
    } else {
      return `${String(d1).padStart(2, '0')} ${m1} a ${String(d2).padStart(2, '0')} ${m2} (${ano})`
    }
  }

  // Agrupar e somar as horas por semana
  const resumoSemanas = useMemo(() => {
    const grupos: { [key: string]: number } = {}

    registros.forEach((reg) => {
      // Filtrar apenas registros que possuem semana_inicio definida
      if (!reg.semana_inicio) return
      grupos[reg.semana_inicio] = (grupos[reg.semana_inicio] || 0) + reg.duracao
    })

    // Ordenar chaves das semanas de forma decrescente (mais recente primeiro)
    return Object.keys(grupos)
      .sort((a, b) => b.localeCompare(a))
      .map((semana) => {
        const totalHoras = grupos[semana]
        const atingiuMeta = totalHoras >= metaSemanal
        const percentual = Math.min(100, Math.round((totalHoras / metaSemanal) * 100))
        const diferenca = totalHoras - metaSemanal

        return {
          semana_inicio: semana,
          titulo: formatarTituloSemana(semana),
          totalHoras,
          atingiuMeta,
          percentual,
          diferenca
        }
      })
  }, [registros, metaSemanal])

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
      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Resumo Semanal</h1>
          <p className="text-sm text-gray-400">Acompanhe seu desempenho semanal frente à meta estabelecida.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-8 w-8 text-[#03A9F4]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-400">Calculando resumos...</span>
          </div>
        ) : resumoSemanas.length === 0 ? (
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="inline-flex p-4 rounded-full bg-gray-800/50 text-[#03A9F4] mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Nenhum histórico encontrado</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Você ainda não registrou nenhuma hora. Seus dados semanais consolidados aparecerão aqui assim que fizer seus primeiros lançamentos.
            </p>
            <Link
              to="/registros"
              className="inline-block py-2.5 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs font-semibold rounded-xl transition-all"
            >
              Ir para Lançamentos
            </Link>
          </div>
        ) : (
          /* Grid de Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resumoSemanas.map((semana) => {
              const valorDiferenca = semana.diferenca
              const isPositivoOuZero = valorDiferenca >= 0
              const diferencaTexto = `${isPositivoOuZero ? '+' : ''}${valorDiferenca.toFixed(2).replace('.', ',')}h`

              return (
                <div 
                  key={semana.semana_inicio} 
                  className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 space-y-5 shadow-sm hover:border-gray-700/80 transition-all flex flex-col justify-between"
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                        Período
                      </span>
                      <h3 className="text-base font-bold text-white leading-snug">
                        {semana.titulo}
                      </h3>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {semana.atingiuMeta ? (
                        <span className="inline-flex items-center justify-center p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Meta atingida">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center p-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20" title="Meta não atingida">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informações Numéricas */}
                  <div className="grid grid-cols-3 gap-4 py-2 border-y border-gray-800/60">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                        Trabalhado
                      </span>
                      <span className="text-lg font-mono font-bold text-white">
                        {semana.totalHoras.toFixed(2).replace('.', ',')}h
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                        Meta
                      </span>
                      <span className="text-lg font-mono font-bold text-gray-400">
                        {metaSemanal.toFixed(2).replace('.', ',')}h
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                        Restante
                      </span>
                      <span 
                        className="text-lg font-mono font-bold"
                        style={{ color: isPositivoOuZero ? '#4CAF50' : '#F44336' }}
                      >
                        {diferencaTexto}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso e Percentual */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-gray-400">Progresso</span>
                      <span 
                        style={{ color: semana.atingiuMeta ? '#4CAF50' : '#F44336' }}
                      >
                        {semana.percentual}% Concluído
                      </span>
                    </div>

                    <div className="w-full bg-[#0B0E14] h-3 rounded-full overflow-hidden border border-gray-800/50">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${semana.percentual}%`,
                          backgroundColor: semana.atingiuMeta ? '#4CAF50' : '#F44336'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
