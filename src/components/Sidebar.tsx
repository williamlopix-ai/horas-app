import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Clock,
  ChartNoAxesColumn,
  Table2,
  CircleDollarSign,
  FolderKanban,
  Settings,
  Bell
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { listarLembretes } from '../services/lembretes'
import MenuAcoes from './MenuAcoes'

const ITENS_NAV = [
  { rota: '/registros', rotulo: 'Registros',  Icone: Clock },
  { rota: '/resumo',    rotulo: 'Resumo',     Icone: ChartNoAxesColumn },
  { rota: '/timesheet', rotulo: 'Timesheet',  Icone: Table2 },
  { rota: '/billable',  rotulo: 'Billable',   Icone: CircleDollarSign },
  { rota: '/projetos',  rotulo: 'Projetos',   Icone: FolderKanban,
    prefixos: ['/projeto'] },
  { rota: '/ajustes',   rotulo: 'Ajustes',    Icone: Settings },
  { rota: '/lembretes', rotulo: 'Lembretes',  Icone: Bell,
    badge: true },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [pendentesCount, setPendentesCount] = useState(0)

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 rounded-ctl text-ink-500 hover:text-ink-900 hover:bg-surface-2 transition-colors duration-d1 ease-ez focus:outline-none"
            aria-label="Abrir menu"
          >
            <span className="text-2xl">☰</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-ctl bg-accent-bg text-accent-fg">
              <Clock className="w-5 h-5" />
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
      <aside className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-surface-1 border-r border-hair flex flex-col shrink-0 min-h-screen transition-transform duration-300 transform lg:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:fixed lg:left-0 lg:top-0 lg:bottom-0`}>
        <div className="p-6 border-b border-hair flex items-center gap-3">
          <div className="p-2 rounded-ctl bg-accent-bg text-accent-fg">
            <Clock className="w-6 h-6" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight text-ink-900">HORAS</span>
        </div>

        <nav aria-label="Navegação principal" className="flex-1 p-4 space-y-1.5">
          {ITENS_NAV.map(item => {
            const ativo = isItemAtivo(item)
            const { rota, rotulo, Icone } = item

            return (
              <Link
                key={rota}
                to={rota}
                aria-current={ativo ? 'page' : undefined}
                className={`flex items-center gap-3 py-3 px-3 rounded-ctl text-sm font-medium transition-colors duration-d1 ease-ez ${
                  ativo
                    ? 'bg-accent-bg text-accent-fg'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-surface-2'
                }`}
              >
                <Icone className="w-5 h-5 shrink-0" />
                <span className="flex-1 truncate">{rotulo}</span>
                {item.badge && pendentesCount > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-white text-[11px] font-mono font-bold">
                    {pendentesCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-hair flex items-center justify-between gap-2">
          <span className="text-xs text-ink-500 font-mono truncate min-w-0">{user?.email}</span>
          <MenuAcoes
            itens={[{ label: 'Sair', onClick: () => signOut(), perigo: true }]}
            rotulo="Ações da conta"
          />
        </div>
      </aside>
    </>
  )
}
