const express = require('express');
const router = express.Router();
const userModel = require('../models/users.js')
const cartModel = require('../models/cart.js')
const productModel = require('../models/product.js')
const {isLoggedIn}= require('../middlewares/loggedIn_middleware.js')



router.get('/', isLoggedIn, async function (req, res, next) {
    const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
    const cartItems = await cartModel.find({ user: loggedUser._id }).populate('product')
    let actualprice = 0, oldprice = 0
    cartItems.forEach(prod => {
        actualprice += prod.product.discountprice * prod.quantity
        oldprice += prod.product.price * prod.quantity

    })
    res.render('cart', { loggedUser, cartItems, actualprice, oldprice });
});
router.get('/add/:productId',isLoggedIn, async function (req, res, next) {
    const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
    const product = await productModel.findOne({ _id: req.params.productId })
    const cartItem = await cartModel.create({
        user: loggedUser._id,
        product: product._id,
    })
    res.status(200).json("added to cart.");
});
router.get('/remove/:cartItemId',isLoggedIn, async function (req, res, next) {
    const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
    const removedCartItem = await cartModel.findOneAndDelete({ _id: req.params.cartItemId })
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
