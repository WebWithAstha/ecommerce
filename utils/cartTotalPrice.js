const cartModel = require('../models/cart.js')

exports.updatedCart = async (userId) => {
    try {
        let cart = await cartModel.findOne({ user: userId });
        if (cart) {
            cart = await cartModel.findOne({ user: userId }).populate({
                path: 'products',
                populate: 'product'
            })
            let totalPrice = 0;
            for (const cartProduct of cart.products) {
                const productPrice = cartProduct.quantity * cartProduct.product.discountprice;
                totalPrice += productPrice;
            }
            cart.price=totalPrice;
            await cart.save();
            return cart;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error updating cart price:', error);
        return null;
    }
}
