import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
export const askAi=async(messages)=>
{
    try
    {
        if(!messages || !Array.isArray(messages)||messages.length===0)
        {
            throw new Error("Messages array is empty");
        }
        const response=await axios.post("https://openrouter.ai/api/v1/chat/completions",{
            model:"openai/gpt-4o-mini",
            messages:messages
        },{
            headers: {
           Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
           'Content-Type': 'application/json',
           },
        }) 
        const content=response?.data?.choices?.[0].message?.content;
        if(!content || !content.trim())
        {
            throw new Error("AI returned empty response")
        }
        return content
    }catch(error)
    {
            console.error("Open Router Error:",error?.response?.data || error.message);
            throw new Error("Open Router API Error");
    }
}