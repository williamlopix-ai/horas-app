import React, { useState, useRef, useEffect } from 'react'

export type ItemMenu = {
  label: string
  onClick: () => void
  perigo?: boolean
  separadorAntes?: boolean
  desabilitado?: boolean
}

export type Props = {
  itens: ItemMenu[]
  rotulo: string          // vai no aria-label do gatilho
  desabilitado?: boolean
}

export default function MenuAcoes({
  itens,
  rotulo,
  desabilitado = false
}: Props) {
  const [aberto, setAberto] = useState(false)
  const [posicao, setPosicao] = useState<{ top?: number; bottom?: number; right: number }>({ right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (desabilitado) return

    if (!aberto && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const espacoAbaixo = window.innerHeight - rect.bottom
      const espacoAcima = rect.top
      const alturaEstimada = 250

      const abrirParaCima = espacoAbaixo < alturaEstimada && espacoAcima > espacoAbaixo

      setPosicao({
        right: Math.max(8, window.innerWidth - rect.right),
        top: abrirParaCima ? undefined : rect.bottom + 4,
        bottom: abrirParaCima ? window.innerHeight - rect.top + 4 : undefined
      })
      setAberto(true)
    } else {
      setAberto(false)
    }
  }

  useEffect(() => {
    if (!aberto) return

    const handleDocumentClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setAberto(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false)
      }
    }

    const handleScrollOuResize = () => {
      setAberto(false)
    }

    document.addEventListener('mousedown', handleDocumentClick)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScrollOuResize, true)
    window.addEventListener('resize', handleScrollOuResize)

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScrollOuResize, true)
      window.removeEventListener('resize', handleScrollOuResize)
    }
  }, [aberto])

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        onClick={toggleMenu}
        disabled={desabilitado}
        aria-label={rotulo}
        aria-haspopup="menu"
        aria-expanded={aberto}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8B949E] hover:text-white hover:bg-gray-800/50 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {aberto && (
        <div
          ref={menuRef}
          style={{
            top: posicao.top,
            bottom: posicao.bottom,
            right: posicao.right
          }}
          className="fixed bg-[#161B22] border border-gray-800 rounded-xl shadow-2xl z-40 min-w-[180px] p-1.5 animate-in fade-in zoom-in-95 duration-150 flex flex-col"
          role="menu"
          aria-orientation="vertical"
          onClick={(e) => e.stopPropagation()}
        >
          {itens.map((item, index) => {
            const isRotuloSecao = item.desabilitado

            return (
              <div key={index} className="flex flex-col">
                {item.separadorAntes && (
                  <div className="border-t border-gray-800 my-1" />
                )}

                {isRotuloSecao ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B949E] px-3 py-1.5 cursor-default select-none">
                    {item.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      item.onClick()
                      setAberto(false)
                    }}
                    className={`w-full text-left py-2.5 px-3 text-sm rounded-lg transition-colors flex items-center justify-between font-medium ${
                      item.perigo
                        ? 'text-[#F44336] hover:bg-[#F44336]/10 hover:text-[#F44336]'
                        : 'text-gray-200 hover:text-white hover:bg-gray-800/60'
                    }`}
                  >
                    {item.label}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
