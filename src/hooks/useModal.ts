import { useEffect, useRef, type RefObject } from 'react'

// Gerencia o foco do teclado (foco inicial, focus trap e restauração ao fechar) e fechamento por Escape.
// Suporta modais empilhados garantindo que apenas o modal no topo da pilha responda ao teclado (Tab e Escape).

const SELETOR_FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function obterElementosFocaveis(container: HTMLElement): HTMLElement[] {
  const elementos = Array.from(
    container.querySelectorAll<HTMLElement>(SELETOR_FOCAVEIS)
  )
  return elementos.filter((el) => el.getClientRects().length > 0)
}

function focarContainer(container: HTMLElement): void {
  if (!container.hasAttribute('tabindex')) {
    container.setAttribute('tabindex', '-1')
  }
  container.focus()
}

// Pilha em nível de módulo para gerenciar modais sobrepostos
const pilhaModais: symbol[] = []

export function useModal(
  aberto: boolean,
  containerRef: RefObject<HTMLElement | null>,
  aoFechar: () => void
): void {
  const elementoAnteriorRef = useRef<HTMLElement | null>(null)
  const idInstanciaRef = useRef<symbol>(Symbol())
  const aoFecharRef = useRef(aoFechar)

  useEffect(() => {
    aoFecharRef.current = aoFechar
  })

  useEffect(() => {
    if (!aberto) return

    const idInstancia = idInstanciaRef.current
    pilhaModais.push(idInstancia)

    // a) Guardar elemento com foco antes de abrir (exceto body)
    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
    ) {
      elementoAnteriorRef.current = document.activeElement
    }

    const container = containerRef.current
    if (container) {
      // 1. [data-foco-inicial] ou 2. primeiro focável ou 3. o próprio container
      const alvoInicial =
        container.querySelector<HTMLElement>('[data-foco-inicial]') ||
        obterElementosFocaveis(container)[0]

      if (alvoInicial) {
        alvoInicial.focus()
      } else {
        focarContainer(container)
      }
    }

    // b) Tratar Tab e Escape enquanto aberto (apenas se estiver no topo da pilha)
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' && e.key !== 'Escape') return
      if (pilhaModais[pilhaModais.length - 1] !== idInstancia) return

      if (e.key === 'Escape') {
        aoFecharRef.current()
        return
      }

      // Tab trap
      const containerAtual = containerRef.current
      if (!containerAtual) return

      const focaveis = obterElementosFocaveis(containerAtual)
      if (focaveis.length === 0) {
        e.preventDefault()
        focarContainer(containerAtual)
        return
      }

      const primeiroFocavel = focaveis[0]
      const ultimoFocavel = focaveis[focaveis.length - 1]
      const elementoAtivo = document.activeElement

      // Se o foco estiver fora do container, redireciona para dentro
      if (!containerAtual.contains(elementoAtivo)) {
        e.preventDefault()
        if (e.shiftKey) {
          ultimoFocavel.focus()
        } else {
          primeiroFocavel.focus()
        }
        return
      }

      if (e.shiftKey) {
        if (elementoAtivo === primeiroFocavel) {
          e.preventDefault()
          ultimoFocavel.focus()
        }
      } else {
        if (elementoAtivo === ultimoFocavel) {
          e.preventDefault()
          primeiroFocavel.focus()
        }
      }
    }

    window.addEventListener('keydown', aoTeclar)

    // c) Ao fechar ou desmontar
    return () => {
      window.removeEventListener('keydown', aoTeclar)

      const index = pilhaModais.indexOf(idInstancia)
      if (index !== -1) {
        pilhaModais.splice(index, 1)
      }

      const elementoAnterior = elementoAnteriorRef.current
      if (elementoAnterior && document.body.contains(elementoAnterior)) {
        elementoAnterior.focus()
      }
      elementoAnteriorRef.current = null
    }
  }, [aberto, containerRef])
}
