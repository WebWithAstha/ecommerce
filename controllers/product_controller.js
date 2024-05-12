const productModel = require('../models/product.js')

exports.getProductsByAllCategories = async(req,res)=>{
    const categories =['Footwear','Books & stationary','Clothing','Toys']
    const productByCategory ={}
    for (const category of categories) {
        const products = await productModel.find({ category });
        if(products.length > 0) {
            productByCategory[category] =products
        }
    }

    return productByCategory;
}