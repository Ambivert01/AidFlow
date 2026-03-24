import mongoose from "mongoose";

const schema = new mongoose.Schema({

 maxFraudRisk:Number,

 eligibilityThreshold:Number,

 maxDailyWalletSpend:Number

});

export const SystemPolicy =
mongoose.model("SystemPolicy",schema);