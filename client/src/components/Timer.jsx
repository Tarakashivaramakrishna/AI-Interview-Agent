import React from 'react'
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
const Timer = ({timeLeft, totalTime}) => {
    const percentage=(timeLeft/totalTime)*100
  return (
    <div className='w-20 h-20'>
      <CircularProgressbar value={percentage} text={`${timeLeft}s`} 
      style={buildStyles({ rotation:0.25,textSize:"28px",pathColor:`#10b981`,trailColor:`#e5e7eb`,textColor:`#ef4444`})}/>
    </div>
  )
}

export default Timer
