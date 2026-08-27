import { useFecharComEsc } from '../hooks/useFecharComEsc'
import { Button, Surface } from './ui'

interface ModalConfirmacaoProps {
  isOpen: boolean
  titulo: string
  mensagem: string
  textoConfirmar?: string   // default: 'Confirmar'
  textoCancelar?: string    // default: 'Cancelar'
  perigo?: boolean          // default: false -> botão confirmar vermelho quando true
  onConfirmar: () => void
  onCancelar: () => void
}

export default function ModalConfirmacao({
  isOpen,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  perigo = false,
  onConfirmar,
  onCancelar
}: ModalConfirmacaoProps) {
  useFecharComEsc(isOpen, onCancelar)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-[var(--scrim)] backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancelar}
    >
      <Surface
        elevacao={2}
        padding="lg"
        comBorda
        comSombra={false}
        className="w-[95%] sm:w-full max-w-sm relative shadow-e3 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar X */}
        <button
          onClick={onCancelar}
          type="button"
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-700 hover:text-ink-900 transition-colors focus:outline-none z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Título do Modal */}
        <h3 className="text-xl font-bold text-ink-900 mb-2 shrink-0">
          {titulo}
        </h3>

        {/* Mensagem do Modal */}
        <p className="text-sm text-ink-700 mb-6">
          {mensagem}
        </p>

        {/* Botões do Rodapé */}
        <div
          className="flex flex-col sm:flex-row gap-3 shrink-0"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
        >
          <Button
            type="button"
            variante="secundario"
            larguraTotal
            className="sm:flex-1 min-h-[44px]"
            onClick={onCancelar}
          >
            {textoCancelar}
          </Button>
          <Button
            type="button"
            variante={perigo ? 'destrutivo' : 'primario'}
            larguraTotal
            className="sm:flex-1 min-h-[44px]"
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </Button>
        </div>
      </Surface>
    </div>
  )
}
