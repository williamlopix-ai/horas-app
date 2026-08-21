import { type ReactNode } from 'react'

export interface FieldProps {
  rotulo?: string
  descricao?: string
  erro?: string
  obrigatorio?: boolean
  htmlFor?: string
  children: ReactNode
  className?: string
}

export function classeCampo(temErro = false): string {
  return `w-full font-ui text-[13.5px] px-3 py-2 rounded-ctl bg-surface-2 text-ink-900 border outline-none transition-colors duration-d1 ease-ez placeholder:text-ink-300 ${
    temErro
      ? 'border-bad focus:border-bad focus:ring-[3px] focus:ring-bad-bg'
      : 'border-hair-strong focus:border-accent focus:ring-[3px] focus:ring-accent-bg'
  }`
}

export function Field({
  rotulo,
  descricao,
  erro,
  obrigatorio = false,
  htmlFor,
  children,
  className = '',
}: FieldProps) {
  return (
    <div className={`w-full ${className}`}>
      {rotulo && (
        <label htmlFor={htmlFor} className="text-[11.5px] text-ink-500 mb-1.5 block">
          {rotulo}
          {obrigatorio && <span className="text-bad ml-0.5">*</span>}
        </label>
      )}
      {children}
      {(erro || descricao) && (
        <p className={`text-[11.5px] mt-1.5 ${erro ? 'text-bad' : 'text-ink-500'}`}>
          {erro || descricao}
        </p>
      )}
    </div>
  )
}
