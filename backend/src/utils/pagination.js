export const paginate = async(model,query,page=1,limit=10)=>{

 const skip=(page-1)*limit;

 const data=await model.find(query)

  .skip(skip)

  .limit(limit);

 const total=await model.countDocuments(query);

 return {

  data,
  total,
  page,
  pages:Math.ceil(total/limit)

 };

};