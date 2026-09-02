import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from './Button'

export interface VoltarParaProps {
  rotulo: string
  url: string
  className?: string
}

export function VoltarPara({ rotulo, url, className = '' }: VoltarParaProps) {
  const navigate = useNavigate()

  return (
    <Button
      type="button"
      variante="fantasma"
      tamanho="md"
      onClick={() => navigate(url)}
      className={`min-h-[44px] ${className}`}
      iconeEsquerda={<ArrowLeft className="w-icon-sm h-icon-sm shrink-0" />}
    >
      Voltar para {rotulo}
    </Button>
  )
}
