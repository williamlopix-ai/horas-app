export interface SecaoProps {
    titulo: string
    className?: string
}

export function Secao({ titulo, className = '' }: SecaoProps) {
    return (
        <h2 className={`text-xl font-display font-bold text-ink-900 mb-4 ${className}`}>{titulo}</h2>
    )
}