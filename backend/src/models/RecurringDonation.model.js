import mongoose from "mongoose";

const schema = new mongoose.Schema({

 donor:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"User"
 },

 campaign:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Campaign"
 },

 amount:Number,

 interval:{
  type:String,
  enum:["WEEKLY","MONTHLY"]
 },

 status:{
  type:String,
  enum:["ACTIVE","PAUSED","CANCELLED"],
  default:"ACTIVE"
 },

 nextRun:Date

},{timestamps:true});

export const RecurringDonation =
mongoose.model("RecurringDonation",schema);