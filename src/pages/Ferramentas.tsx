import { useEffect, useRef, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { Surface } from '../components/ui'

type TabId = 'calculadora' | 'fechamento' | 'calendario-semana' | 'calendario-mes' | 'quanto-falta'

const ABAS: { id: TabId; rotulo: string }[] = [
  { id: 'calculadora', rotulo: 'Calculadora' },
  { id: 'fechamento', rotulo: 'Fechamento' },
  { id: 'calendario-semana', rotulo: 'Calendário da Semana' },
  { id: 'calendario-mes', rotulo: 'Calendário do Mês' },
  { id: 'quanto-falta', rotulo: 'Quanto Falta' },
]

export default function Ferramentas() {
  const [activeTab, setActiveTab] = useState<TabId>('calculadora')
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const abaRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({})

  useEffect(() => {
    const recalcularPilula = () => {
      const container = tabsContainerRef.current
      const botaoAtivo = abaRefs.current[activeTab]
      if (!container || !botaoAtivo) return
      const containerRect = container.getBoundingClientRect()
      const botaoRect = botaoAtivo.getBoundingClientRect()
      setPillStyle({ left: botaoRect.left - containerRect.left, width: botaoRect.width })
    }

    recalcularPilula()
    window.addEventListener('resize', recalcularPilula)
    return () => window.removeEventListener('resize', recalcularPilula)
  }, [activeTab])

  const abaAtiva = ABAS.find(a => a.id === activeTab)

  return (
    <div className="relative min-h-screen bg-surface-0 text-ink-900 flex flex-col lg:flex-row">
      <div
        className="absolute inset-x-0 top-0 h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%)'
        }}
      />

      <Sidebar />

      <main className="relative z-10 flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl lg:ml-[240px] space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-ink-900">Ferramentas</h1>
          <p className="text-sm text-ink-500">Calculadoras e utilitários de apoio ao dia a dia.</p>
        </div>

        <div
          ref={tabsContainerRef}
          className="relative inline-flex items-center gap-xs max-w-full overflow-x-auto bg-surface-1 border border-hair rounded-ctl p-1"
        >
          <div
            className="absolute top-1 bottom-1 rounded-ctl bg-surface-3 transition-[left,width] duration-d3 ease-ez"
            style={{ left: pillStyle.left, width: pillStyle.width }}
          />
          {ABAS.map((aba) => (
            <button
              key={aba.id}
              type="button"
              ref={(el) => { abaRefs.current[aba.id] = el }}
              onClick={() => setActiveTab(aba.id)}
              className={`relative z-10 min-h-[44px] px-4 rounded-ctl text-sm font-semibold whitespace-nowrap transition-colors duration-d1 ease-ez ${
                activeTab === aba.id ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              {aba.rotulo}
            </button>
          ))}
        </div>

        <Surface elevacao={1}>
          <p className="text-sm text-ink-500">
            {abaAtiva?.rotulo} — em construção (leva 8.X).
          </p>
        </Surface>
      </main>
    </div>
  )
}
