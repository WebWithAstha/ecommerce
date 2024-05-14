const express = require('express');
const router = express.Router();
const userModel = require('../models/users.js')
const cartModel = require('../models/cart.js')
const cartProductModel = require('../models/cartProduct.js')
const productModel = require('../models/product.js')
const {isLoggedIn}= require('../middlewares/loggedIn_middleware.js')



router.get('/', isLoggedIn, async function (req, res, next) {
    const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
    const cart = await cartModel.findOne({user:loggedUser._id})
    .populate('products')
    .populate({path:'products',populate:"product"})
    console.log(cart)
    // const cartItems = await cartModel.find({ user: loggedUser._id }).populate('product')
    // let actualprice = 0, oldprice = 0
    // cartItems.forEach(prod => {
    //     actualprice += prod.product.discountprice * prod.quantity
    //     oldprice += prod.product.price * prod.quantity
    // })
    res.render('cart', { loggedUser, cart});
});
router.get('/add/:productId',isLoggedIn, async function (req, res, next) {
    const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
    const product = await productModel.findOne({ _id: req.params.productId })
    const cartProduct = await cartProductModel.create({
        user: loggedUser._id,
        product: product._id,
    })
    const cart = await cartModel.findOneAndUpdate({user: loggedUser._id},{$push:{products: cartProduct._id},$inc:{price:product.price}},{new:true})
    
    res.status(200).json("added to cart.");
});
router.get('/remove/:cartItemId',isLoggedIn, async function (req, res, next) {
    const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
    const cartProduct = await cartProductModel.findOne({ _id: req.params.cartItemId }).populate('product')
    await cartProductModel.findOneAndDelete({ _id: cartProduct._id })
    const cart  = await cartModel.findOneAndUpdate({user:loggedUser._id},{$pull:{products: cartProduct._id},$inc:{price:-(cartProduct.price*cartProduct.quantity)}},{new:true})
    res.status(200).json("removed from cart.");
});
router.post('/:alter/:cartItemId',isLoggedIn, async function (req, res, next) {
    const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
    if (req.params.alter === "increase") {
        
        const updatedCartItem = await cartModel.findOneAndUpdate(
            { _id: req.params.cartItemId },
            { $inc: { quantity: 1 } },
            { new: true }
        )
    } else {
        const updatedCartItem = await cartModel.findOneAndUpdate(
            { _id: req.params.cartItemId },
            { $inc: { quantity: -1 } },
            { new: true }
        )
    }
    res.status(200).json("item qty altered.");
});





module.exports = router;
