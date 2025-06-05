import { ReactNode } from 'react'

interface ActionButtonProps {
  icon: ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  href?: string
  download?: string
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'indigo'
  isLoading?: boolean
  type?: 'button' | 'submit' | 'reset'
  size?: 'small' | 'medium' | 'large'
}

const colorMap = {
  blue: 'text-blue-500 hover:text-blue-600',
  green: 'text-green-500 hover:text-green-600',
  yellow: 'text-yellow-500 hover:text-yellow-600',
  red: 'text-red-500 hover:text-red-600',
  purple: 'text-purple-500 hover:text-purple-600',
  orange: 'text-orange-500 hover:text-orange-600',
  indigo: 'text-indigo-500 hover:text-indigo-600',
}

export default function ActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  href,
  download,
  color,
  isLoading = false,

  type = 'button',
  size = 'medium'
}: ActionButtonProps) {
  const colorClass = disabled ? 'text-gray-300' : colorMap[color]
  const labelColorClass = disabled ? 'text-gray-400' : `text-${color}-600`
  
  const sizeClasses = {
    small: {
      container: 'space-y-1',
      icon: 'scale-75',
      text: 'text-xs'
    },
    medium: {
      container: 'space-y-1.5',
      icon: 'scale-90',
      text: 'text-sm'
    },
    large: {
      container: 'space-y-2',
      icon: 'scale-100',
      text: 'text-base'
    }
  }
  
  const { container, icon: iconSize, text } = sizeClasses[size]
  
  const content = (
    <>

      <div className={`${colorClass} transition ${iconSize}`}>
        {icon}
      </div>

      <span className={`${labelColorClass} font-medium ${text}`}>
        {label}
      </span>
    </>
  )
  
  if (href) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-400">
        <a
          href={href}
          download={download}

          className={`flex flex-col items-center ${container} cursor-pointer`}
        >
          {content}
        </a>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col items-center justify-center text-gray-400">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}

        className={`flex flex-col items-center ${container} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        type={type}
      >
        {content}
      </button>
    </div>
  )
}
