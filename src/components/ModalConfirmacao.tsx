

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
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancelar}
    >
      <div
        className="bg-[#161B22] border border-gray-800 rounded-2xl w-[95%] sm:w-full max-w-sm p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar X */}
        <button
          onClick={onCancelar}
          type="button"
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Título do Modal */}
        <h3 className="text-xl font-bold text-white mb-2 shrink-0">
          {titulo}
        </h3>

        {/* Mensagem do Modal */}
        <p className="text-sm text-gray-400 mb-6">
          {mensagem}
        </p>

        {/* Botões do Rodapé */}
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancelar}
            className="w-full sm:flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-all border border-gray-700 focus:outline-none"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className={`w-full sm:flex-1 py-3 px-4 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 focus:outline-none ${perigo
                ? 'bg-[#F44336] hover:bg-red-600 active:bg-red-700'
                : 'bg-[#03A9F4] hover:bg-[#0288D1] active:bg-[#007cb5]'
              }`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
