 import fs from "fs";
 import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
 import { askAi } from "../services/openRouterService.js";
import User from "../models/user.js";
import Interview from "../models/interviewmodel.js";
 export const analyzeResume=async(req,res)=>{
   try{
     if(!req.file)
     {
        return res.status(400).json({message:"Resume required"});
     }
     const filePath=req.file.path;
     const fileBuffer=fs.promises.readFile(filePath);
     const uint8Array=new Uint8Array(await fileBuffer);
        
     const pdf=await pdfjsLib.getDocument({data:uint8Array}).promise;

     let resumeText=""
     //Extract text from all pages
     for(let pageNum=1;pageNum<=pdf.numPages;pageNum++)
     {
        const page=await pdf.getPage(pageNum);
        const content=await page.getTextContent();
        const text=content.items.map(item=>item.str).join(" ");
        resumeText+=text+"\n";
     }
     resumeText=resumeText.replace(/\s+/g," ").trim();
     const messages=[
        {
            role:"system",
            content:`Extract structured data from resume. 
            Return  Strictlyin JSON format:
            {
            "role":"string",
            "experience":"string",
            "projects":["project1","project2"],
            "skills":["skill1","skill2"]
            }`
        },
        {
            role:"user",
            content:resumeText
        }
     ];
     const aiResponse=await askAi(messages);
     console.log(aiResponse);
     const cleanResponse=aiResponse.replace(/```json\s*/g,"").replace(/```/g,"").trim();//important for current json message
     const parsed=JSON.parse(cleanResponse);
     fs.unlinkSync(filePath);
      res.json({
            role:parsed.role,
            experience:parsed.experience,
            projects:parsed.projects,
            skills:parsed.skills,
            resumeText
        });
   }catch(error){
      console.error("Error analyzing resume:",error);
      if(req.file && fs.existsSync(req.file.path))
        {
            fs.unlinkSync(req.file.path);
        }
      return  res.status(500).json({message:error.message});
   }   
 } 

 export const generateQuestions=async(req,res)=>{
   try
   {
      let {role,experience,mode,skills,projects,resumeText}=req.body;
      role=role?.trim();
      experience=experience?.trim();
      mode=mode?.trim();
      skills=skills.map((skill)=>skill.trim()).join(";");
      projects=projects.map((project)=>project.trim()).join(";");
      if(!role || !experience || !mode)
      {
        return res.status(400).json({message:"All fields are required"});  
      }
      const user=await User.findById(req.userId);
      if(!user)
      {
        return res.status(404).json({message:"User not found"});
      }
      if(user.credits<50)
      {
         return res.status(400).json({message:"Not enough credits. Minimum 50 credits required"});
      }
      const projectText=Array.isArray(projects) && projects.length ? projects.join(" ") : "No projects found";
      const skillsText=Array.isArray(skills) && skills.length ? skills.join(" ") : "No skills found";
      const safeResume=resumeText?.trim() || "No resume found";
      const userPrompt=`
      Role: ${role}
      Experience: ${experience}
      Mode: ${mode}
      Resume: ${safeResume}
      Projects: ${projectText}
      Skills: ${skillsText}`;
      if(!userPrompt.trim())
      {
         return res.status(400).json({message:"Prompt content is empty"});
      }

      const messages1=[
         {
            role:"system",
            content:`You are a real human interviewer conducting a professional interview.
            Speak in simple, natural English as if you are directly talking to the candidate.
            Generate exactly 5 Interview Questions.
            Strict Rules:
            -Each question must contain between 15 and 25 words only.
            -Each question must be a complete single sentence.
            -Do NOT number them.
            -Do NOT add explanations.
            -Do NOT add extra text before or after the question.
            -One Question per line only.
            -keep language simple and conversational.
            -Questions must feel practical and realistic.
            
            Difficulty progression:
            Question 1-> easy
            Question 2-> easy
            Question 3-> medium
            Question 4-> medium
            Question 5-> hard
            
            Make questions based on the candidate's role,experience,projects,skills,Interview mode and resume details.
            Do not add any additional text before or after the questions.`
         },{
            role:"user",
            content:userPrompt
         }
      ];

      const aiResponse=await askAi(messages1);
      if(!aiResponse || !aiResponse.trim())
      {
         console.log("AI returned empty response");
         return res.status(500).json({message:"AI returned empty response"});
      }
      const questionsArray=aiResponse.split("\n").map((question)=>question.trim()).filter((question)=>question).slice(0,5);
      if(questionsArray.length==0)
      {
         console.log("AI failed to generate questions");
         return res.status(500).json({message:"AI failed too generate questions"});
      }
      user.credits-=50;
      await user.save();
      
      const interview= await Interview.create({
         userId:user._id,
         role,
         experience,
         mode,
         resumeText:safeResume,
         questions:questionsArray.map((q,i)=>({
            question:q,
            difficulty: ["easy","easy","medium","medium","hard"][i],
            timeLimit:[60,60,90,90,120][i]
         }))
      });
   res.json({
   interviewId: interview._id,
   creditsLeft: user.credits,
   userName:user.name,
   questions:interview.questions
 });
   }catch(error)
   {
      console.log("Error generating questions:",error);
      return  res.status(500).json({message:`Failed to generate questions ${error}`});
   }
 }


 export const submitAnswer=async(req,res)=>{
   try
   {
        const{interviewId, questionIndex,answer, timeTaken}=req.body;

        const interview=await Interview.findById(interviewId);
        const question=interview.questions[questionIndex];

        //if no answer
        if(!answer){
         question.score=0;
         question.feedback="You did not submit an anaswer.";
         question.answer="";
         await interview.save();
         return res.json({
            feedback:question.feedback
         });
        }
        //If time exceeded
        if(timeTaken>question.timeLimit)
        {
         question.score=0;
         question.feedback="You exceeded the time limit. Answer not evaluated.";
         question.answer=answer;
         await interview.save();
         return res.json({
            feedback:question.feedback
         });
        }
      
        const messages2=[
         {
            role:"system",
            content:`
            You are a professional human interviewer evalauating a candidate's answer in a real interview.
            Evaluate naturally and fairly,like a real person would.
            Score the answer in these areas (0 to 10):
            
            1. Confidence- Does the answeer sound clear,confident and well-presented?
            2. Communication- Is the language simple,clear and easy to understand?
            3.Correctness- Is the answer accurate, relevant and complete?
            
            Rules:
            -Be realistic and unbiased.
            -Do not give random high scores.
            -If the answer is weak,score low.
            -If the answer is strong and dedicated, score high.
            -Consider clarity, structure and relevance.
            
            Calculate:
            finalscore=average of confidence,communication and correctness.(rounded to nearest whole number).
            
            Feedback Rules:
            -Write natural human feedback.
            -10 t0 15 words only.
            -Sound like real Interview feedback.
            -Can suggest improvement if needed.
            -Do NOT repeat the question.
            -DO NOT explain scoring.
            -Keep tone professional and honest.
            
            Return ONLY valid JSON in this format:
            {
            "confidence":number,
            "communication":number,
            "correctness":number,
            "finalscore":number,
            "feedback":string
            }`
         },
         {
            role:"user",
            content:`Question:${question.question}
            Answer:${answer}`
         }
        ];
        const aiResponse=await askAi(messages2);
        const parsed=JSON.parse(aiResponse);

        question.answer=answer;
        question.confidence=parsed.confidence;
        question.communication=parsed.communication;
        question.correctness=parsed.correctness;
        question.score=parsed.finalscore;
        question.feedback=parsed.feedback;

        await interview.save();
        return res.status(200).json({feedback:parsed.feedback});
   }catch(error)
   {
     return res.status(500).json({message:`failed to submit answer: ${error}`});
   }
 }


 export const finishInterview = async(req,res)=>{
     try
     {
       const {interviewId}=req.body;
       const interview=await Interview.findById(interviewId);
       if(!interview)
       {
          return res.status(404).json({message:"failed to find Interview"}); 
       }
       const totalQuestions=interview.questions.length;
       let totalScore=0;
       let totalConfidence=0;
       let totalCommunication=0;
       let totalCorrectness=0;
       interview.questions.forEach(question=>{
          totalScore+=question.score ||0;
          totalConfidence+=question.confidence ||0;
          totalCommunication+=question.communication ||0;
          totalCorrectness+=question.correctness ||0;
       });

       const finalScore=totalQuestions ? totalScore/totalQuestions : 0;
       const avgConfidence=totalQuestions ? totalConfidence/totalQuestions : 0;
       const avgCommunication=totalQuestions ? totalCommunication/totalQuestions : 0;
       const avgCorrectness=totalQuestions ? totalCorrectness/totalQuestions : 0;

       interview.finalScore=finalScore;
       interview.status="completed";
       await interview.save();
       return res.status(200).json(
         {
            finalScore:Number(finalScore.toFixed(1)),
            Confidence:Number(avgConfidence.toFixed(1)),
            Communication:Number(avgCommunication.toFixed(1)),
            Correctness:Number(avgCorrectness.toFixed(1)),
            questionWiseScore:interview.questions.map((question)=>({
               question:question.question,
               score:question.score ||0,
               feedback:question.feedback||"",
               confidence:question.confidence ||0,
               communication:question.communication ||0,
               correctness:question.correctness ||0
            }))
         }
       );
     }catch(error)
     {
       return res.status(500).json({message:`failed to submit answer: ${error}`});
     }
 }

export const getMyInterview = async(req,res)=>{
     try
     {
       const interview=await Interview.find({userId:req.userId}).sort({createdAt:-1}).select("role experience mode finalScore status createdAt");
       console.log(interview);
       return res.status(200).json(interview);
     }catch(error)
     {
       return res.status(500).json({message:`failed to find currentuser Interview: ${error}`});
     }
 }

export const getInterviewReport=async(req,res)=>{
    try
    {
      const interview=await Interview.findById(req.params.id);
      if(!interview)
      {
         return res.status(404).json({message:"failed to find Interview"}); 
      }
       const totalQuestions=interview.questions.length;
       let totalConfidence=0;
       let totalCommunication=0;
       let totalCorrectness=0;
       interview.questions.forEach(question=>{
          totalConfidence+=question.confidence ||0;
          totalCommunication+=question.communication ||0;
          totalCorrectness+=question.correctness ||0;
       });
       const avgConfidence=totalQuestions ? totalConfidence/totalQuestions : 0;
       const avgCommunication=totalQuestions ? totalCommunication/totalQuestions : 0;
       const avgCorrectness=totalQuestions ? totalCorrectness/totalQuestions : 0;
       return res.json({
         finalScore:interview.finalScore,
         Confidence:Number(avgConfidence.toFixed(1)),
         Communication:Number(avgCommunication.toFixed(1)),
         Correctness:Number(avgCorrectness.toFixed(1)),
         questionWiseScore:interview.questions
       })
    }catch(error)
    {
      return res.status(500).json({message:`failed to find Interview: ${error}`});
    } 
}