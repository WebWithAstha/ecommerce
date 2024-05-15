const express = require('express');
const router = express.Router();
const userModel = require('../models/users.js')
const cartModel = require('../models/cart.js')
const cartProductModel = require('../models/cartProduct.js')
const productModel = require('../models/product.js')
const { isLoggedIn } = require('../middlewares/loggedIn_middleware.js');

const {updatedCart} = require('../utils/cartTotalPrice.js');



router.get('/', isLoggedIn, async function (req, res, next) {
    const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
    const cart = await updatedCart(loggedUser._id)

    res.render('cart', { loggedUser, cart });
});
router.get('/add/:productId', isLoggedIn, async function (req, res, next) {
    const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
    const product = await productModel.findOne({ _id: req.params.productId })
    const cartProduct = await cartProductModel.create({
        user: loggedUser._id,
        product: product._id,
    })
    const cart = await cartModel.findOne({ user: loggedUser._id })
    if (cart) {
        cart.products.push(cartProduct._id)
        cart.price+=product.discountprice
        await cart.save()
    } else {
        await cartModel.create({
            user: loggedUser._id,
            products: [cartProduct._id],
            price: product.discountprice
        })
    }

    res.status(200).json("added to cart.");
});
router.post('/remove/:cartItemId', isLoggedIn, async function (req, res, next) {
    const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
    const cartProduct = await cartProductModel.findOne({ _id: req.params.cartItemId }).populate('product')
    await cartProductModel.findOneAndDelete({ _id: cartProduct._id })
    const cart = await cartModel.findOneAndUpdate({ user: loggedUser._id }, { $pull: { products: cartProduct._id }, $inc: { price: -(cartProduct.product.discountprice * cartProduct.quantity) } }, { new: true })
    // cart.price-=cartProduct.product.discountprice * cartProduct.quantity
    // await cart.save()
    res.status(200).json(cart.price);
});
router.post('/:alter/:cartItemId', isLoggedIn, async function (req, res, next) {
    const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
    const cart = await cartModel.findOne({ user: loggedUser._id })
    if (req.params.alter === "increase") {
        const cartProduct = await cartProductModel.findOneAndUpdate({ _id: req.params.cartItemId }, { $inc: { quantity: 1 } }, { new: true }).populate('product')
        cart.price += cartProduct.product.discountprice
    } else {
        const cartProduct = await cartProductModel.findOneAndUpdate({ _id: req.params.cartItemId }, { $inc: { quantity: -1 } }, { new: true }).populate('product')
        cart.price -= cartProduct.product.discountprice
    }
        await cart.save()
    res.status(200).json(cart.price);
});





module.exports = router;
