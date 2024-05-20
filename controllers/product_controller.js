const productModel = require('../models/product.js')
const cartProductModel = require('../models/cartProduct.js')

// exports.getProductsByAllCategories = async(req,res)=>{
//     const categories =['Footwear','Books & stationary','Clothing','Toys']
//     const productByCategory ={}
//     for (const category of categories) {
//         const products = await productModel.find({ category });
//         if(products.length > 0) {
//             productByCategory[category] =products
//         }
//     }

//     return productByCategory;
// }


exports.getProductsByAllCategories = async (req, res) => {
    const categories = ['Footwear', 'Books & stationary', 'Clothing', 'Toys'];
    const productByCategory = {};

    for (const category of categories) {
        const products = await productModel.find({ category });

        if (products.length > 0) {
            const productsWithCartStatus = await Promise.all(products.map(async (product) => {
                const isCartProduct = await cartProductModel.findOne({ user: product.user, product: product._id }) ? true : false;
                return { ...product.toObject(), isCartProduct };
            }));

            productByCategory[category] = productsWithCartStatus;
        }
    }
    console.log(productByCategory)

    return (productByCategory);
};


// const isCartProduct = await cartProductModel.findOne({user:product._id})?true:false
