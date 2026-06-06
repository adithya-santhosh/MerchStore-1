import prisma from "../lib/prisma";

//
/// Function to Get All the Products from the Database
//
export const getAllProducts = async ( category ?: string) => {
  
  if (category){
    return await prisma.product.findMany({where:{category,},}); // If category exist, this loop. Otherwise the below one
  }
  return await prisma.product.findMany();

};
//
/// Funciton to Find the Product by Id number
//
export const getProductById = async (id: number) => {
  return await prisma.product.findUnique( {where : {id,},}  );
}

//
//// Function to add The product to the Database
//
export const createProduct = async (
                                    data: {
                                      name : string,
                                      description : string,
                                      price : number, 
                                      category : string,
                                      ImageURL : string }) => 
  {
    return await prisma.product.create({data,});
  };
//
/// Deltet the Product from the Database
//

export const deleteProduct = async (id: number) =>{
  return await prisma.product.delete({where :{id,},});
}

/// Update the Product in the database

export const updateProduct = async (id: number, data: any) =>{
  return await prisma.product.update({where :{id,},data,});
}
