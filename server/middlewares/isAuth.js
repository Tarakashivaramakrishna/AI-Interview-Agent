import jwt from "jsonwebtoken";
const isAuth = async(req, res, next) => {
    try
    {
      const {token}=req.cookies;
      if(!token)
      {
        return res.status(400).json({message:"user doesnot have token"});
      }
      const verifyToken=jwt.verify(token,process.env.JWT_SECRET);
      if(!verifyToken)
      {
        return res.status(400).json({message:"invalid token"});
      }
      req.userId=verifyToken.id;
      next();
    }catch(error)
    {
         return res.status(500).json({message:`isAuth error ${error}`})
    }
}
export default isAuth