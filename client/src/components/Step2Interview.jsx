import React from 'react'
import maleVideo from "../assets/videos/male-ai.mp4";
import femaleVideo from "../assets/videos/female-ai.mp4";
import Timer from './Timer';
import {motion} from "motion/react"
import {FaMicrophone, FaMicrophoneSlash} from 'react-icons/fa'
import { useState,useEffect,useRef } from 'react'
import axios from 'axios'
import { serverUrl } from '../App'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { BsArrowRight } from 'react-icons/bs';

const Step2Interview = ({interviewData,onFinish}) => {
  const {interviewId,questions,userName}=interviewData || {};
  const[isIntroPhase,setIsIntroPhase]=useState(true);
  const[isMicOn,setIsMicOn]=useState(true);
  const recognitionRef=useRef(null);
  const[isAIPlaying,setIsAIPlaying]=useState(false);
  const[currentIndex,setCurrentIndex]=useState(0);
  const[answer,setAnswer]=useState("");
  const[feedback,setFeedback]=useState(" ");
  const[timeLeft,setTimeLeft]=useState(questions?.[0]?.timeLimit || 60);

  const[selectedVoice,setSelectedVoice]=useState(null);
  const[isSubmitting,setIsSubmitting]=useState(false);
  const[voiceGender,setVoiceGender]=useState("female");
  const[subtitle,setSubtitle]=useState("");

  const videoRef=useRef(null);
  const currentQuestion= currentIndex < (questions?.length||0)  ? questions?.[currentIndex] : null;


  useEffect(()=>
  {
    const loadVoices=()=>{
      const voices=window.speechSynthesis.getVoices();
      if(!voices.length) return;
      //Try known female voices first
      const femaleVoice=voices.find((voice)=>
        voice.name.toLowerCase().includes("female")|| 
      voice.name.toLowerCase().includes("zira")||
      voice.name.toLowerCase().includes("samantha"));
      if(femaleVoice) 
        {
          setSelectedVoice(femaleVoice);
          setVoiceGender("female");
          return;
        }
        //Try known  male voices
        const maleVoice=voices.find((voice)=>
        voice.name.toLowerCase().includes("male")||
        voice.name.toLowerCase().includes("david")||
        voice.name.toLowerCase().includes("mark"));
        if(maleVoice)
        {
          setSelectedVoice(maleVoice);
          setVoiceGender("male");
          return;
        }
        //first voice(assume female)
        setSelectedVoice(voices[0]);
        setVoiceGender("female");
    }    
    loadVoices();
    window.speechSynthesis.onvoiceschanged=loadVoices;
  },[])

  const videoSource=voiceGender==="female"?femaleVideo:maleVideo;
  /* SPEAK FUNCTIONALITY*/
  const speakText=(text)=>
  {
    return new Promise((resolve)=>
    {
      if(!window.speechSynthesis|| !selectedVoice)
      {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      //Add natural pauses after commas and periods
      const humanText=text.replace(/,/g,",...").replace(/\./g,". ...")
      const utterance=new SpeechSynthesisUtterance(humanText);
      utterance.voice=selectedVoice;
      //Human-like pacing
      utterance.rate=0.9; //slightly slower than normal
      utterance.pitch=1.05;//small warmth
      utterance.volume=1;

      utterance.onstart=()=>{
      setIsAIPlaying(true)
      stopMic();
        videoRef.current?.play().then(()=>{
        }).catch((error)=>
        {
          console.error("Error playing video:",error);
        });
      };
      utterance.onend=()=>{
        videoRef.current?.pause();
        videoRef.current.currentTime=0;
        setIsAIPlaying(false);
       if(isMicOn)
        startMic();
      setTimeout(()=>
      {
        setSubtitle("");
        resolve();
      },300)
    };
    setSubtitle(text);
    window.speechSynthesis.speak(utterance);
   });
}

useEffect(()=>
{
  if(!selectedVoice) return;
  const runIntro=async()=>{
   if(isIntroPhase)
    {
      await speakText(`Hi ${userName},it's great to meet you today. I hope you are feeling confident and ready.`);
      await speakText(`I'll ask you a few questions.Just answer naturally, take your time.let's begin.`);
      setIsIntroPhase(false);  
    }else if(currentQuestion){
      await new Promise(r=> setTimeout(r,800));
      //If last questioon(hard level)
      if(currentIndex===questions.length-1)
      {
        await speakText("Alright, this one might be a bit more challenging.");
      }
      await speakText(currentQuestion.question);
    }
  }
  runIntro();
},[selectedVoice,isIntroPhase,currentIndex])

useEffect(()=>
{
  if(isIntroPhase) return;
  if(!currentQuestion) return;
  const timer=setInterval(()=>
  {
    setTimeLeft((prev)=>
    {
       if(prev<=1)
        {
          clearInterval(timer);
          return 0;
        }
        return prev-1;
    })
  },1000)

  return ()=>clearInterval(timer);
 },[isIntroPhase,currentIndex])

useEffect(()=>{
  if(!isIntroPhase && currentQuestion)
  {
    setTimeLeft(currentQuestion.timeLimit || 60);
  }
},[currentIndex])
 useEffect(()=>
{
 if(!("webkitSpeechRecognition" in window)) return;
 const recognition=new window.webkitSpeechRecognition();
 recognition.lang="en-US";
 recognition.continuous=true;
 recognition.interimResults=false;

 recognition.onresult=(event)=>
 {
  const transcript=event.results[event.results.length-1][0].transcript;
  setAnswer((prev)=> prev +" "+transcript);
 };
 recognitionRef.current=recognition;
},[]);

const startMic=()=>{
  if(recognitionRef.current && !isAIPlaying)
  {
    try
    {
      recognitionRef.current.start();
    }catch(error)
    {
      console.log("Error starting recognition:",error);
    }
  }
}
const stopMic=()=>{
  if(recognitionRef.current)
  {
    recognitionRef.current.stop();
  }
}
const toggleMic=()=>
{
  if(isMicOn)
  {
    stopMic();
  }else{
    startMic();
  }
  setIsMicOn(!isMicOn);
}

const submitAnswer=async()=>{
  if(isSubmitting) return;
  if(!currentQuestion)
  {
    return;
  }
  stopMic();
  setIsSubmitting(true);
  try
  {
    const questionTimeLimit=currentQuestion?.timeLimit || 60;
    const result=await axios.post(`${serverUrl}/api/interview/submit-answer`,{
      interviewId,
      questionIndex:currentIndex,
      answer,
      timeTaken:questionTimeLimit-timeLeft
    },{withCredentials:true});
    setFeedback(result.data.feedback);
    await speakText(result.data.feedback);
    setIsSubmitting(false);
  }catch(error)
  {
     console.log("Error submitting answer:",error);
      console.log(error);
      setIsSubmitting(false);
  }
}

const handleNext=async()=>{
   setAnswer("");
   setFeedback("");
   if(currentIndex+1>=questions.length)
   {
    finishInterview();
    return;
   }
   await speakText("Alright, lets move to the next question");
   setCurrentIndex(currentIndex+1);
}
const finishInterview =async(params)=>{
  stopMic();
  if(recognitionRef.current)
  {
    recognitionRef.current.onresult=null;

    recognitionRef.current.abort();
  }
  setIsMicOn(false);
  try
  {
      const result=await axios.post(`${serverUrl}/api/interview/finish`,{interviewId},{withCredentials:true})
      console.log("Success:",result.data);
      onFinish(result.data);
  }catch(error)
  {
      console.log(error);
  }
}

useEffect(()=>{
  if(isIntroPhase) return;
  if(!currentQuestion) return;
  if(timeLeft===0 && !isSubmitting && !feedback)
  {
    handleNext();
  }
},[timeLeft]);

useEffect(()=>{
  return()=>{
    if(recognitionRef.current)
    {  
      recognitionRef.current.stop();
      recognitionRef.current.abort();
    }
    window.speechSynthesis.cancel();
  }
},[])
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 
    flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-350 min-h-[80vh] bg-white rounded-3xl 
      shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden">
        {/* Video Section*/}
        <div className='w-full lg:w-[35%] bg-white flex flex-col items-center p-6 space-y-6 border-r border-gray-200'>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
              <video src={videoSource}
              key={videoSource}
              ref={videoRef}
              muted
              playsInline
              preload="auto"
               className="w-full h-auto object-cover"/>
          </div>
          {/* Subtitle pending*/}
          {subtitle &&(
            <div className='w-full max-w-md bg-gray-50 border border-gray-20 rounded-xl p-4 shadow-sm'>
              <p className="text-gray-700 text-sm sm:text-base font-medium text-center leading-relaxed">{subtitle}</p>
            </div>
          )}

          {/* timer Area*/}
          <div className='w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-5'>
              <div className='flex justify-between items-center'>
                <span className="text-sm text-gray-500">
                   Interview Status
                </span>
                {
                isAIPlaying && <span className="text-sm font-semibold text-emerald-600">
                  {isAIPlaying ? "AI Speaking" : ""}
                </span>
                }
              </div>
              <div className="h-px bg-gray-200"></div>
              <div className="flex justify-center">
                    <Timer timeLeft={timeLeft} totalTime={currentQuestion?.timeLimit}/>
              </div>
              <div className="h-px bg-gray-200"></div>
              <div className='grid grid-cols-2 gap-6 text-center'>
                  <div>
                    <span className='text-2xl font-bold text-emerald-600'>{currentIndex+1}</span>
                    <span className='text-xs text-gray-500'>Current Question</span>
                  </div>
                  <div>
                    <span className='text-2xl font-bold text-emerald-600'>{questions?.length}</span>
                    <span className='text-xs text-gray-500'>Total Questions</span>
                  </div>
              </div>
          </div>
        </div>
        {/* Text Section*/}
        <div className='flex-1 flex flex-col p-4 sm:p-6 md:p-8 relative'> 
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-600 mb-6">
            AI Smart Interview
          </h2>

          {!isIntroPhase &&(<div className="relative mb-6 bg-gray-50 p-4 rounded-2xl sm:p-6 border border-gray-200 shadow-sm">
             <p className='text-xs sm:text-sm text-gray-400 mb-2'>
              Question {currentIndex+1} of {questions?.length}
             </p>
             <div className='text-base sm:text-lg font-semibold text-gray-800 leading-relaxed'>
              {currentQuestion?.question}
             </div>
          </div>)}
          <textarea placeholder="Type your answer here..." onChange={(e)=>setAnswer(e.target.value)} value={answer} className="flex-1 bg-gray-100 p-4 sm:p-6 rounded-2xl resize-none
          outline-none border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition text-gray-800"/>


          {!feedback ? (<div className="flex items-centergap-4 mt-6">
             <motion.button 
             whileTap={{scale:0.9}}
             className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center 
             rounded-full bg-black text-white shadow-lg">
               { isMicOn ? <FaMicrophone size={20}/> :<FaMicrophoneSlash size={20}/>}
             </motion.button>
             <motion.button
             whileTap={{scale:0.95}}
             onClick={submitAnswer}
             disabled={isSubmitting}
             className="ml-5 flex-1 bg-gradient-to-r from-emerald-600 
             to-teal-500 text-white rounded-2xl py-3 sm:py-4 shadow-lg hover:opacity-90 transition font-semibold disabled:bg-gray-500">
                {isSubmitting ? "Submitting..." : "Submit Answer"}
             </motion.button>
          </div>): (
            <motion.div className='mt-6 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm'>
                 <p className="text-emerald-700 font-medium mb-4">{feedback}</p>
                 <button onClick={handleNext} className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white 
                 rounded-xl py-3 shadow-md hover:opacity-90 transition flex items-center justify-center gap-1">
                    Next Question <BsArrowRight size={18}/>
                 </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Step2Interview
