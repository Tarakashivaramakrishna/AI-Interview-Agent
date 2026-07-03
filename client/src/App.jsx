import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import { useEffect } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { setUserData } from './redux/userSlice'
import { useSelector } from 'react-redux'
import InterviewPage from './pages/InterviewPage'
import InterviewHistory from './pages/InterviewHistory'
import InterviewReport from './pages/InterviewReport'
import Pricing from './pages/Pricing'

export const serverUrl="https://ai-interview-agent-1ur8.onrender.com";

const App = () => {
  const dispatch=useDispatch();
  const userData=useSelector((state)=>state.user.userData);
  useEffect(()=>
  {
    const getUser=async()=>{
      try
      {
        const response=await axios.get(`${serverUrl}/api/user/current-user`,{withCredentials:true});
        dispatch(setUserData(response.data))
    }catch(error)
    {
       console.log("Error getting user:", error); 
       dispatch(setUserData(null));  
    }
  }
  getUser();
  },[dispatch])
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/interview" element={<InterviewPage/>}/>
      <Route path="/history" element={<InterviewHistory/>}/>
      <Route path="/report/:id" element={<InterviewReport/>}/>
      <Route path="/pricing" element={<Pricing/>}/>
    </Routes>
  )
}

export default App
