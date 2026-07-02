import React from 'react'
import {useNavigate} from 'react-router-dom'
import {motion} from "motion/react"
import {FaArrowLeft} from 'react-icons/fa'
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import{AreaChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,Area} from 'recharts'
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
const Step3Report = ({report}) => {
  if(!report)
  {
    return(
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-gray-500 text-lg'>Loading Report.....</p>
      </div>
    )
  }
  const{
    finalScore=0,
    Confidence=0,
    Communication=0,
    Correctness=0,
    questionWiseScore=[]
  }=report;
  const questionScoreData=questionWiseScore.map((score,index)=>({
    name:`Q${index+1}`,
    score:score.score || 0
  }));
  const skills=[
    {label:"Confidence", value:Confidence},
    {label:"Communication", value:Communication},
    {label:"Correctness", value:Correctness}
  ]
  let performanceText="";
  let shortTagline="";
  if(finalScore>=8)
  {
      performanceText="Ready for job opportunity",
      shortTagline="Excellent clarity and structured responses";  
  }else if(finalScore>=5)
  {
      performanceText="Needs minor improvements before interviews",
      shortTagline="Good foundation, refine articulation"
  }else
  {
      performanceText="Significant improvement required.",
      shortTagline="Work on clarity and confidence"
  }
  const navigate=useNavigate();
  const score=finalScore;
  const percentage=(finalScore/10)*100;

  const downloadPDF=()=>{
    const doc=new jsPDF("p","mm","a4");
    const pageWidth=doc.internal.pageSize.getWidth();
    const margin=20;
    const contentWidth=pageWidth-margin*2;
    let currentY=25;
    //===========TITLE================
    doc.setFont("helvetica","bold");
    doc.setFontSize(20);
    doc.setTextColor(34,197,94);
    doc.text("AI Interview Performance Report",pageWidth/2,currentY,{align:"center"});
    currentY+=5;
    //underline
    doc.setDrawColor(34,197,94);
    doc.line(margin,currentY+2,pageWidth-margin,currentY+2);
    currentY+=15;
    //===========FINAL SCORE BOX================
    doc.setFillColor(240,253,244);
    doc.roundedRect(margin,currentY,contentWidth,30,4,4,"F");
    doc.setFontSize(14)
    doc.setTextColor(0,0,0)
    doc.text(`Final Score: ${finalScore}/10`,pageWidth/2,currentY+12,{align:"center"});
    currentY+=30;
    //===========SKILLS BOX================
    doc.setFillColor(249,250,251);
    doc.roundedRect(margin,currentY,contentWidth,30,4,4,"F");
    doc.setFontSize(12)
    doc.text(`confidence: ${Confidence}`,margin+10,currentY+12)
    doc.text(`Communication: ${Communication}`,margin+10,currentY+22)
    doc.text(`Correctness: ${Correctness}`,margin+10,currentY+32)
    currentY+=45
    //===========ADVICE=========
    let advice=""
    if(finalScore>=8)
    {
      advice="Excellent performance! Maintain confidence and structure.Continue refining clarity and supporting answers with strong real-world examples."
    }else if(finalScore>=5)
    {
      advice="Good foundation shown. Improve clarity and structure. Practice delivering concise,confident answers with stronger supporting examples."
    }else
    {
      advice="Significant improvement needed. Focus on clarity, confidence, and structured responses. Practice articulating answers with real-world examples and seek feedback for improvement."
    }
    doc.setFillColor(255,255,255);
    doc.text("Professional Advice:",margin+10,currentY+10)
    doc.setFont("helvetica","normal")
    doc.setFontSize(11)

    const splitAdvice=doc.splitTextToSize(advice,contentWidth-20);
    doc.text(splitAdvice,margin+10,currentY+20);
    currentY+=50
    //===========QUESTION TABLE================
    autoTable(doc,{
      startY:currentY,
      margin:{left:margin,right:margin},
      head:[["#","Question","Score","Feedback"]],
      body:questionWiseScore.map((q,index)=>[
        `${index+1}`,
        q.question,
        `${q.score}/10`,
        q.feedback
      ]),
      styles:{fontSize:10,cellPadding:2,valign:"top"},
      headStyles:{fillColor:[34,197,94],textColor:255,halign:"center"},
      columnStyles:{
        0:{cellWidth:10,halign:"center"},//index
        1:{cellWidth:55},//question
        2:{cellWidth:20,halign:"center"},//score
        3:{cellWidth:"auto"}//feedback
      },
      alternateRowStyles:{fillColor:[249,250,253]},
    });
    doc.save("AI_Interview_Performance_Report.pdf");
  }
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-green-50 px-4 sm:px-6 lg:px-10 py-8">
       <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className='md:mb-10 w-full felx items-start gap-4 '>
              <button onClick={()=>navigate("/history")} className='mt-1 p-3 rounded-full bg-white shadow hover:shadow-md transition'>
                        <FaArrowLeft className='text-gray-600'/>
              </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                      Interview Analytics Dashboard
                  </h1>
                  <p className="text-gray-500 mt-2">
                     AI-Powered performance Insights
                  </p>
           </div>
         </div>
         <button onClick={downloadPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6
          rounded-xl shadow-md transition-all duration-300 text-sm sm:text-base text-nowrap">
             Download PDF
          </button>
       </div>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
         <div className="space-y-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white p-6 rounded-2xl sm:rounded-3xl sm:p-8 text-center shadow-lg">
              <h3 className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-500">Overall Performance</h3>
               <div className='relative w-20 h-20 sm:w-25 sm:h-25 mx-auto '>
                  <CircularProgressbar value={percentage} text={`${score}/10`} 
                   style={buildStyles({ rotation:0.25,textSize:"18px",pathColor:`#10b981`,trailColor:`#e5e7eb`,textColor:`#ef4444`})}/>
               </div>
               <p className="text-xs sm:text-sm mt-3 text-gray-400">Out of 10</p>
                <div className="mt-4">
                 <p className='font-semibold text-gray-800 text-sm sm:text-base'>{performanceText}</p>
                 <p className='text-gray-600 text-xs sm:text-sm mt-1'>{shortTagline}</p> 
                </div>     
            </motion.div>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white p-6 rounded-2xl sm:rounded-3xl sm:p-8 shadow-lg">
               <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-6"> Skill Evaluation</h3>
               <div className="space-y-6">
                {
                   skills.map((skill,index)=>(
                    <div key={index}>
                     <div className="flex justify-between mb-2 text-sm sm:text-base">
                       <span className="text-gray-700">{skill.label}</span>
                       <span className="font-semibold text-green-600">{skill.value}</span>
                     </div>
                     <div className="bg-gray-200 rounded-full h-2 sm:h-3">
                       <div className="bg-green-600 h-full rounded-full" style={{ width: `${(skill.value*10)}%` }}></div>
                     </div>
                    </div>
                   ))
                }
               </div>
            </motion.div>
         </div>
           <div className=" lg:col-span-2 space-y-6">
            <motion.div
             initial={{opacity:0}} animate={{opacity:1}} className="bg-white p-5 rounded-2xl sm:rounded-3xl sm:p-8 shadow-lg">
               <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-4 sm:mb-6">Performance Trend</h3>
               <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={questionScoreData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="score" stroke="#10b981" fill="#10b981" strokeWidth={3} />
                      </AreaChart>
                </ResponsiveContainer>
               </div>
            </motion.div> 
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white p-5 rounded-2xl sm:rounded-3xl sm:p-8 shadow-lg">
              <h3>Question Breakdown</h3>
              <div className="space-y-6">
                {
                  questionWiseScore.map((question,index)=>(
                      <div key={index} className="bg-gray-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                          <div className="flex-1">
                            <p className="text-xs text-gray-400">Question {index + 1}</p>
                            <p className='font-semibold text-gray-800 text-sm sm:text-base leading-relaxed '>{question.question ||"Question not available"}</p>
                          </div>
                          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold text-xs sm:text-sm w-fit">
                            {question.score ?? 0}/10
                          </div>
                        </div>
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                          <p className='text-xs text-green-600 font-semibold mb-1'>
                            AI Feedback
                          </p>
                          <p className='text-sm text-gray-700 leading-relaxed'>
                            {
                            question.feedback  && question.feedback.trim()!=="" ? question.feedback :"No feedback available for this question."
                            }
                          </p>
                        </div>
                      </div>
                  ))
                }
              </div>
            </motion.div> 
           </div>
      </div>
    </div>
  )
}

export default Step3Report