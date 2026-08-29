import {
  type ReactNode,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useId,
} from 'react'
import { createPortal } from 'react-dom'

export interface DicaProps {
  texto: string
  children: ReactNode
  className?: string
}

export function Dica({ texto, children, className = '' }: DicaProps) {
  const [visivel, setVisivel] = useState(false)
  const [posicao, setPosicao] = useState<{ top: number; left: number } | null>(null)
  const dicaId = useId()
  const gatilhoRef = useRef<HTMLSpanElement>(null)
  const dicaRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const textoValido = Boolean(texto && texto.trim())

  const limparTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    return () => limparTimer()
  }, [])

  useEffect(() => {
    if (!visivel) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        limparTimer()
        setVisivel(false)
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [visivel])

  useLayoutEffect(() => {
    if (!visivel) {
      setPosicao(null)
      return
    }

    const atualizarPosicao = () => {
      if (!gatilhoRef.current || !dicaRef.current) return
      const gatilhoRect = gatilhoRef.current.getBoundingClientRect()
      const dicaRect = dicaRef.current.getBoundingClientRect()
      const margem = 8

      let top = gatilhoRect.top - dicaRect.height - margem
      if (top < margem) {
        top = gatilhoRect.bottom + margem
      }

      let left = gatilhoRect.left + (gatilhoRect.width - dicaRect.width) / 2
      if (left < margem) {
        left = margem
      } else if (left + dicaRect.width > window.innerWidth - margem) {
        left = window.innerWidth - margem - dicaRect.width
      }

      setPosicao({ top, left })
    }

    atualizarPosicao()
    window.addEventListener('resize', atualizarPosicao)
    window.addEventListener('scroll', atualizarPosicao, true)
    return () => {
      window.removeEventListener('resize', atualizarPosicao)
      window.removeEventListener('scroll', atualizarPosicao, true)
    }
  }, [visivel])

  if (!textoValido) {
    return <>{children}</>
  }

  const aoEntrarMouse = () => {
    limparTimer()
    timerRef.current = setTimeout(() => {
      setVisivel(true)
    }, 400)
  }

  const aoSairMouse = () => {
    limparTimer()
    setVisivel(false)
  }

  const aoFocar = () => {
    limparTimer()
    setVisivel(true)
  }

  const aoDesfocar = () => {
    limparTimer()
    setVisivel(false)
  }

  return (
    <>
      <span
        ref={gatilhoRef}
        tabIndex={0}
        aria-describedby={visivel ? dicaId : undefined}
        onMouseEnter={aoEntrarMouse}
        onMouseLeave={aoSairMouse}
        onFocus={aoFocar}
        onBlur={aoDesfocar}
        className={`inline-flex min-w-0 max-w-full ${className}`}
      >
        {children}
      </span>

      {visivel &&
        createPortal(
          <div
            ref={dicaRef}
            id={dicaId}
            role="tooltip"
            style={{
              top: posicao ? `${posicao.top}px` : '-9999px',
              left: posicao ? `${posicao.left}px` : '-9999px',
            }}
            className={`fixed z-40 pointer-events-none max-w-[320px] break-words bg-surface-3 border border-hair-strong text-ink-900 shadow-e3 rounded-card px-3 py-2 text-sm font-ui leading-snug transition-opacity duration-d3 ease-ez ${
              posicao ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {texto}
          </div>,
          document.body
        )}
    </>
  )
}
