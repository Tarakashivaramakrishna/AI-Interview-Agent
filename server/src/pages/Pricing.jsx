import React from 'react'
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import {motion} from "motion/react"
import { useState } from 'react'
import axios from 'axios'
import { serverUrl } from '../App'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
const Pricing = () => {
  const navigate = useNavigate();
  const[loadingPlan,setLoadingPlan]=useState(null);
  const [selectedPlan, setSelectedPlan] = useState("free");
  const dispatch=useDispatch();
  const plans=[
    {
      id:"free",
      name:"Free Plan",
      price:"₹0",
      credits:100,
      description:"Perfect for beginners starting interview preparation.",
      features:[
        "100 AI Interview Credits",
        "Basic Performance Report",
        "Voice Interview Access",
        "Limited History Tracking",
      ],
      default:true
    },
    {
      id:"basic",
      name:"Starter Pack",
      price:"₹100",
      credits:150,
      description:"Great for focused and skill improvement with AI feedback.",
      features:[
        "150 AI Interview Credits",
        "Advanced Performance Report",
        "Detailed Feedback",
        "Full History Tracking",
      ],
    },
    {
       id:"pro",
       name:"Pro Pack",
       price:"₹500",
       credits:650,
       description:"Ideal for serious candidates aiming for top-tier performance.",
       features:[
        "650 AI Interview Credits",
        "Advanced AI Feedback",
        "Skill Trend Analysis",
        "Priority AI Processing"
       ],
       badge:"Best Value",
    }
  ]

  const handlePayment=async(plan)=>{
   try
   {
     setLoadingPlan(plan.id);
     const amount=plan.id==="basic"?100:plan.id==="pro"?500:0;
     const response=await axios.post(`${serverUrl}/api/payment/create-order`,{
      planId:plan.id,
      amount,
      credits:plan.credits
     },{withCredentials:true});
     console.log("Success:",response.data);

     const options={
      key:import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount:response.data.amount,
      currency:"INR",
      name:"InterviewIQ.AI",
      description:`${plan.name} - ${plan.credits} Credits`,
      order_id:response.data.id,

      handler:async function(response){
        console.log("Razorpay Response:",response);
        try
        {
          console.log("step-1");
          const verifypay=await axios.post(`${serverUrl}/api/payment/verify-payment`,response,{withCredentials:true})
          console.log("step-2:",verifypay.data);
          dispatch(setUserData(verifypay.data.user));
          alert("Payment Successfull ! Credits Added to your account.");
          navigate("/");
        }catch(error)
        {
          console.log("Error:", error)
          console.log("error response:",error?.response?.data);
        }
      },
      theme:{
        color:"#10b981",
      }
     }
     const rzp=new window.Razorpay(options);
     rzp.open();
     setLoadingPlan(null);
   }catch(error)
   {
     console.log(error);
     setLoadingPlan(null);
   } 
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 py-16 px-6">
      <div className="max-w-6xl mx-auto mb-14 flex items-start gap-4">
         <button className="mt-2 p-3 rounded-full bg-white shadow hover:shadow-md transition" onClick={() => navigate("/")}>
          <FaArrowLeft className="text-gray-600"/>
         </button>
       <div className="text-center w-full">
         <h1 className="text-4xl font-bold text-gray-800"> Choose Your Plan</h1>
         <p className="text-gray-500 mt-3 text-lg">Flexible pricing to match your interview preparation goals.</p>
      </div>
      </div>
       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {
          plans.map((plan)=>{
            const isSelected=selectedPlan===plan.id;
            return(
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               whileHover={!plan.default && { scale: 1.05 }} onClick={()=>!plan.default && setSelectedPlan(plan.id)} className={`relative rounded-3xl p-8
              transition-all duration-300 border ${isSelected ? "border-emerald-600 shadow-2xl bg-white" :" border-gray-200 bg-white shadow-md"} 
              ${plan.default ?"cursor-default":"cursor-pointer"}`}>
                {/* Badge*/}
                {plan.badge && (
                  <div className="absolute top-6 right-6 bg-emerald-500 text-white text-xs px-4 py-1 rounded-full shadow-lg">
                    {plan.badge}
                  </div>
                )}
                {/*Default tag*/}
                {plan.default && (
                  <div className="absolute top-6 right-6 bg-gray-200  text-gray-700 text-xs px-3 py-1 rounded-full">
                    Default
                  </div>
                )}
                {/*Plan Name*/}
                <h3 className="text-xl font-semibold text-gray-700">{plan.name}</h3>
                {/*Plan Price*/}
                <div className="mt-4">
                  <span className="text-3xl font-bold text-emerald-600">
                      {plan.price}
                  </span>
                  <p className="text-gray-500 mt-1">{plan.credits} Credits</p>
                </div>
                {/*Plan Description*/}
                <p className="text-gray-500 mt-4 text-sm leading-relaxed">{plan.description}</p>
                {/*Plan Features*/}
                <div className='mt-6 space-y-3 text-left'>
                 { 
                    plan.features.map((feature,i)=>(
                      <div key={i} className="flex items-center gap-2">
                        <FaCheckCircle className="text-emerald-500 text-sm"/>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))
                 }
                </div>
                {
                  !plan.default &&(
                    <button
                    disabled={loadingPlan===plan.id}
                    onClick={(e)=>{
                      e.stopPropagation();
                      if(!isSelected)
                      {
                        setSelectedPlan(plan.id);
                      }else{
                         handlePayment(plan)
                      }
                    }} className={`w-full mt-8 py-3 rounded-xl font-semibold transition ${
                      isSelected ? "bg-emerald-600 text-white hover:opacity-90" : "bg-gray-100 text-gray-700 hover:bg-emerald-50"
                    }`}>
                      {loadingPlan===plan.id ? "Processing...":isSelected ? "Proceed to Pay":"Select Plan"}
                    </button>
                  )
                }
              </motion.div>
            )
          })
        }
       </div>
    </div>
  )
}

export default Pricing