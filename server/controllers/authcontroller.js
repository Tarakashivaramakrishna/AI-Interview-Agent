import User from '../models/user.js';
import genToken from '../config/token.js';

//retrieve some frontend data
export const googleAuth=async(req,res)=>{
  try
  {
     const{name,email}=req.body;
     let user=await User.findOne({email});
     if(!user)
     {
        user=await User.create({name,email});
        console.log("created User:",user);
     }
     let token=genToken(user._id);
     res.cookie("token",token,
        {
            httpOnly:true,
            secure:true,
            sameSite:"none",
            maxAge:7*24*60*60*1000
        })
        return res.status(200).json({success:true,user})
  }catch(error)
  {
      return res.status(500).json({message:`Google auth error ${error}`})
  }
}

export const logout=async(req,res)=>
{
    try
    {
        res.clearCookie("token");
        return res.status(200).json({success:true,message:"Logout successful"});
    }catch(error)
    {
        return res.status(500).json({message:`Logout error ${error}`})
    }
}
 