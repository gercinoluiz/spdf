import Lottie from 'lottie-react'
import spinImage from '../../assets/spin.json'

export default function Spin() {
  return (
    <div className='text-center flex items-center flex-col justify-center'>
      <Lottie
        animationData={spinImage}
        loop={true}
        style={{
          width: '70%',
          height: '70%',
          marginTop: '-10%',
        }}
      />
      <h2>
        
        <span 
          style={{
            animation: 'dotAnimation 1s ease-in-out infinite',
          }}
        >Carregando ...</span>
      </h2>
      
      {/* Add the keyframes using a style tag */}
      <style jsx>{`
        @keyframes dotAnimation {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}
