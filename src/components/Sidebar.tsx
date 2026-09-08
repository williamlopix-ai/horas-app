import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Clock, Plus, Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { listarLembretes } from '../services/lembretes'
import { Button } from './ui'
import MenuAcoes from './MenuAcoes'
import PaletaComandos from './PaletaComandos'
import { ITENS_NAV } from './itensNav'

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const { recolhida, alternarRecolhida } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [pendentesCount, setPendentesCount] = useState(0)
  const [paletaAberta, setPaletaAberta] = useState(false)

  // Lógica de badge de lembretes (preservada)
  useEffect(() => {
    if (!user) return
    let ativo = true
    listarLembretes(user.id)
      .then(lista => {
        if (ativo) {
          setPendentesCount(lista.filter(l => l.status === 'pendente').length)
        }
      })
      .catch(() => { /* silencioso: badge é secundário, não quebra a navegação */ })
    return () => { ativo = false }
  }, [user])

  // Atalho de teclado (Ctrl+K/Cmd+K para abrir/fechar a paleta de comandos)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setPaletaAberta(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Fecha drawer ao navegar
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  // Fecha drawer no ESC
  useEffect(() => {
    if (!isSidebarOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSidebarOpen])

  // Trava o scroll do body enquanto o drawer estiver aberto no mobile
  useEffect(() => {
    if (!isSidebarOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isSidebarOpen])

  const isItemAtivo = (item: typeof ITENS_NAV[number]) => {
    if (location.pathname === item.rota) return true
    if (item.prefixos?.some(p => location.pathname.startsWith(p))) return true
    return false
  }

  return (
    <>
      {/* Header Mobile */}
      <header className="lg:hidden bg-surface-1 border-b border-hair px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-md">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-ctl text-ink-500 hover:text-ink-900 hover:bg-surface-2 transition-colors duration-d1 ease-ez focus:outline-none"
            aria-label="Abrir menu"
          >
            <span className="text-2xl">☰</span>
          </button>
          <div className="flex items-center gap-sm">
            <div className="p-1.5 rounded-ctl bg-accent-bg text-accent-fg">
              <Clock className="w-icon-md h-icon-md" />
            </div>
            <span className="text-lg font-display font-bold tracking-tight text-ink-900">HORAS</span>
          </div>
        </div>
      </header>

      {/* Overlay escuro no mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[240px] ${
        recolhida ? 'lg:w-16' : 'lg:w-[240px]'
      } bg-surface-1 border-r border-hair flex flex-col shrink-0 min-h-screen transition-transform lg:transition-[width] duration-d3 ease-ez transform lg:transform-none ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:fixed lg:left-0 lg:top-0 lg:bottom-0`}>
        <div className={`border-b border-hair flex items-center justify-between ${
          recolhida ? 'p-4 lg:p-3 lg:flex-col lg:justify-center gap-2' : 'p-4 lg:p-6 gap-md'
        }`}>
          <div className="flex items-center gap-md min-w-0">
            <div className="p-2 rounded-ctl bg-accent-bg text-accent-fg shrink-0" title="HORAS">
              <Clock className="w-icon-lg h-icon-lg" />
            </div>
            <span className={`text-xl font-display font-bold tracking-tight text-ink-900 truncate ${recolhida ? 'lg:hidden' : ''}`}>
              HORAS
            </span>
          </div>

          {/* Botão de recolher/expandir (apenas desktop >=1024px) */}
          <button
            type="button"
            onClick={alternarRecolhida}
            className="hidden lg:flex min-h-[36px] min-w-[36px] items-center justify-center rounded-ctl text-ink-500 hover:text-ink-900 hover:bg-surface-2 transition-colors duration-d1 ease-ez focus:outline-none shrink-0"
            title={recolhida ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            aria-label={recolhida ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {recolhida ? (
              <PanelLeftOpen className="w-icon-md h-icon-md" />
            ) : (
              <PanelLeftClose className="w-icon-md h-icon-md" />
            )}
          </button>
        </div>

        {/* Botão de busca / trigger da paleta de comandos */}
        <div className={`pt-4 pb-2 ${recolhida ? 'px-4 lg:px-2 lg:flex lg:justify-center' : 'px-4'}`}>
          <button
            type="button"
            onClick={() => setPaletaAberta(true)}
            aria-label="Abrir paleta de comandos"
            title={recolhida ? 'Buscar... (Ctrl+K)' : undefined}
            className={`group relative flex items-center bg-surface-2 border border-hair rounded-ctl text-sm text-ink-500 hover:text-ink-900 transition-colors duration-d1 ease-ez focus:outline-none ${
              recolhida
                ? 'w-full lg:w-10 min-h-[44px] lg:min-h-0 lg:h-10 px-3 lg:px-0 justify-between lg:justify-center'
                : 'w-full min-h-[44px] px-3 justify-between'
            }`}
          >
            <div className={`flex items-center ${recolhida ? 'gap-sm truncate lg:gap-0' : 'gap-sm truncate'}`}>
              <Search className="w-icon-sm h-icon-sm shrink-0 text-ink-500 group-hover:text-ink-900 transition-colors duration-d1 ease-ez" />
              <span className={`truncate ${recolhida ? 'lg:hidden' : ''}`}>Buscar...</span>
            </div>
            <kbd className={`px-1.5 py-0.5 text-[11px] font-mono text-ink-500 bg-surface-3 rounded border border-hair shrink-0 ${recolhida ? 'lg:hidden' : ''}`}>
              Ctrl K
            </kbd>
            {recolhida && (
              <span className="hidden lg:group-hover:block absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-ctl bg-surface-3 text-ink-900 border border-hair-strong text-xs font-medium whitespace-nowrap shadow-e2 z-50 pointer-events-none transition-opacity duration-d1">
                Buscar... (Ctrl K)
              </span>
            )}
          </button>
        </div>

        {/* Botão de ação rápida: Lançar horas */}
        <div className={`pb-2 relative group ${recolhida ? 'px-4 lg:px-2 lg:flex lg:justify-center' : 'px-4'}`}>
          <Button
            variante="primario"
            larguraTotal={!recolhida}
            className={recolhida ? 'w-full lg:w-10 min-h-[44px] lg:min-h-0 lg:h-10 p-0 flex items-center justify-center' : 'min-h-[44px]'}
            iconeEsquerda={<Plus className="w-icon-sm h-icon-sm shrink-0" />}
            onClick={() => {
              setIsSidebarOpen(false)
              navigate('/registros?novo=1')
            }}
          >
            <span className={recolhida ? 'lg:hidden' : ''}>Lançar horas</span>
          </Button>
          {recolhida && (
            <span className="hidden lg:group-hover:block absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-ctl bg-surface-3 text-ink-900 border border-hair-strong text-xs font-medium whitespace-nowrap shadow-e2 z-50 pointer-events-none transition-opacity duration-d1">
              Lançar horas
            </span>
          )}
        </div>

        <nav aria-label="Navegação principal" className={`flex-1 space-y-1.5 ${
          recolhida
            ? 'p-4 lg:px-2 lg:py-2 overflow-visible'
            : 'p-4 pt-2 overflow-y-auto'
        }`}>
          {ITENS_NAV.map(item => {
            const ativo = isItemAtivo(item)
            const { rota, rotulo, Icone } = item

            return (
              <Link
                key={rota}
                to={rota}
                aria-current={ativo ? 'page' : undefined}
                className={`group relative flex items-center rounded-ctl text-sm font-medium transition-colors duration-d1 ease-ez ${
                  recolhida
                    ? 'py-3 px-3 lg:w-10 lg:h-10 lg:mx-auto lg:p-0 lg:justify-center gap-md lg:gap-0'
                    : 'gap-md py-3 px-3'
                } ${
                  ativo
                    ? 'bg-accent-bg text-accent-fg'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-surface-2'
                }`}
              >
                <div className="relative flex items-center justify-center shrink-0">
                  <Icone className="w-icon-md h-icon-md shrink-0" />
                  {recolhida && item.badge && pendentesCount > 0 && (
                    <span className="hidden lg:inline-flex absolute -top-1.5 -right-2 items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[10px] font-mono font-bold">
                      {pendentesCount}
                    </span>
                  )}
                </div>

                <span className={`flex-1 truncate ${recolhida ? 'lg:hidden' : ''}`}>{rotulo}</span>

                {item.badge && pendentesCount > 0 && (
                  <span className={`ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-white text-[11px] font-mono font-bold ${
                    recolhida ? 'lg:hidden' : ''
                  }`}>
                    {pendentesCount}
                  </span>
                )}

                {/* Hover etiqueta (desktop, modo recolhido) */}
                {recolhida && (
                  <span
                    role="tooltip"
                    className="hidden lg:block absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-ctl bg-surface-3 text-ink-900 border border-hair-strong text-xs font-medium whitespace-nowrap shadow-e2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-d1 ease-ez"
                  >
                    {rotulo}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className={`border-t border-hair flex items-center ${
          recolhida
            ? 'p-4 lg:p-3 justify-between lg:justify-center gap-sm'
            : 'p-4 justify-between gap-sm'
        }`}>
          <span className={`text-xs text-ink-500 font-mono truncate min-w-0 ${recolhida ? 'lg:hidden' : ''}`}>
            {user?.email}
          </span>
          <MenuAcoes
            itens={[{ label: 'Sair', onClick: () => signOut(), perigo: true }]}
            rotulo="Ações da conta"
          />
        </div>
      </aside>

      <PaletaComandos
        aberta={paletaAberta}
        aoFechar={() => setPaletaAberta(false)}
      />
    </>
  )
}
