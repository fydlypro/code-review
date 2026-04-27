interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  white?: boolean
}

export default function Spinner({ size = 'md', white = false }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' }
  const color = white ? 'border-white/30 border-t-white' : 'border-fydly-200 border-t-fydly-500'

  return (
    <div
      className={`${sizes[size]} ${color} rounded-full border-2 animate-spin`}
      role="status"
      aria-label="Chargement…"
    />
  )
}
