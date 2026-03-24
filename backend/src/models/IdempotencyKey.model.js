import mongoose from "mongoose";

const schema = new mongoose.Schema({

 key:{
  type:String,
  unique:true
 },

 response:Object

});

export const IdempotencyKey =
mongoose.model("IdempotencyKey",schema);