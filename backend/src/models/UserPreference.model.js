import mongoose from "mongoose";

const schema = new mongoose.Schema({

 user:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"User"
 },

 notifications:{
  email:Boolean,
  sms:Boolean,
  inApp:Boolean
 }

});

export const UserPreference =
mongoose.model("UserPreference",schema);