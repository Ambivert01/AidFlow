import mongoose from "mongoose";

const schema = new mongoose.Schema({

 entityType:String,

 entityId:String,

 riskScore:Number,

 reason:String,

 status:{
  type:String,
  enum:["OPEN","UNDER_REVIEW","RESOLVED"],
  default:"OPEN"
 },

 resolvedBy:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"User"
 }

},{timestamps:true});

export const FraudCase =
mongoose.model("FraudCase",schema);