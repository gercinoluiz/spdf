import Lottie from 'lottie-react'
import spinImage from '../../assets/spin.json'

interface SpinProps {
  progress?: number
  progressMessage?: string
  showProgress?: boolean
}

export default function Spin({ progress = 0, progressMessage = '', showProgress = false }: SpinProps) {
  return (
    <div className='text-center flex items-center flex-col justify-center max-w-3/10'>
      <Lottie
        animationData={spinImage}
        loop={true}
        style={{
          width: '70%',
          height: '70%',
          marginTop: '-10%',
        }}
      />
      
      {/* Barra de progresso - só exibida se showProgress for true */}
      {showProgress && (
        <div className="w-full max-w-md -mt-4">
          <div className="bg-gray-200 rounded-full h-2.5 mb-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {progressMessage && (
            <p className="text-center text-sm text-gray-600 mt-2">{progressMessage}</p>
          )}
          <p className="text-right text-sm text-gray-600">{Math.round(progress)}%</p>
        </div>
      )}
    </div>
  )
}
