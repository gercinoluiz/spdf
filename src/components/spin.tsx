import Lottie from 'lottie-react'
import spinImage from '../../assets/spin.json'

export default function Spin() {
  return (
    <Lottie
      animationData={spinImage}
      loop={true}
      style={{
        width: '70%',
        height: '70%',
        marginTop: '-10%',
      }}
    />
  )
}
