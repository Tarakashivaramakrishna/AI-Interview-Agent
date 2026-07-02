import Payment from "../models/paymentmodel.js";
import razorpay from "../services/razorpayService.js";
import crypto from "crypto";
import User from "../models/user.js";
export const createOrder=async(req,res)=>{
 try
 {
    const{planId,amount,credits}=req.body;
    if(!amount || !credits)
        return res.status(400).json({message:"Invalid plan data"});
    const options={
        amount:amount*100,
        currency:"INR",
        receipt:`receipt_${Date.now()}`
    };
    const order=await razorpay.orders.create(options);
    await Payment.create({
        userId:req.userId,
        planId,
        amount,
        credits,
        razorpayorderId:order.id,
        status:"created"
    })
    return res.json(order);
 }catch(error)
 {
    return res.status(500).json({message:`failed to create razorpay order ${error}`});
 }
}
export const verifyPayment=async(req,res)=>{
    
    try
    {
       const {razorpay_payment_id,razorpay_order_id,razorpay_signature}=req.body;
       const body=razorpay_order_id+"|"+razorpay_payment_id;
       const expectedSignature=crypto.createHmac('sha256',process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
       if(expectedSignature!==razorpay_signature)
       {
        return res.status(400).json({message:"Invalid payment signature"});
       }
       const payment=await Payment.findOne({razorpayorderId:razorpay_order_id});
       if(!payment)
       {
        return res.status(400).json({message:"Invalid payment details"});
       }
       if(payment.status==="paid")
       {
        return res.json({message:"Payment already completed"});
       }
       //Update payment record
       payment.status="paid";
       payment.razorpayPaymentId=razorpay_payment_id;
       await payment.save();
       //Add credits to user
       const updateUser=await User.findByIdAndUpdate(payment.userId,{$inc:{credits:payment.credits}},{new:true});
       return res.json({
        success:true,
        message:"Payment verified and credits added",
        user:updateUser
       });
    }catch(error)
    {
       res.status(500).json({message:`failed to verify payment ${error}`});
    }
}