import type { MouseEvent } from 'react'

// Em telas de toque, abre o seletor nativo ao tocar no campo (não só no ícone).
// No PC (ponteiro fino) não faz nada: clicar e digitar continua igual.
export function abrirSeletorEmToque(e: MouseEvent<HTMLInputElement>): void {
  if (!window.matchMedia('(pointer: coarse)').matches) return
  const input = e.currentTarget
  if (!('showPicker' in input)) return
  try {
    input.showPicker()
  } catch {
    // showPicker pode lançar (picker já aberto, contexto sem permissão); o toque nativo segue valendo
  }
}

// Ícone nativo do relógio branco no tema escuro; no claro permanece o nativo.
// Mesmo filter usado para o calendário em index.css.
export const classeIconeRelogio =
  '[[data-theme=dark]_&::-webkit-calendar-picker-indicator]:[filter:brightness(0)_invert(1)]'
