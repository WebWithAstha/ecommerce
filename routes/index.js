const express = require('express');
const router = express.Router();
const passport = require('passport');
const userModel = require('../models/users.js')
const productModel = require('../models/product.js')
const cartModel = require('../models/cart.js')
const orderModel = require('../models/order.js')
const otpModel = require('../models/otp.js')
const upload = require('./multer.js')
const fs = require('fs')
const productController = require('../controllers/product_controller.js')
const sendmailController = require('../controllers/sendmail_controller.js')
const {isLoggedIn}= require('../middlewares/loggedIn_middleware.js')

const Razorpay = require('razorpay')
const instance = new Razorpay({
  key_id: 'rzp_test_t6kU4d1qeTuail',
  key_secret: '6jVxQIpidlsiVxxQ8ghm9bi2',
});



// middlewares




router.use('/register', require('./localAuth.js'))
router.use('/login', require('./googleAuth.js'));
router.use('/account', require('./account.js'))
router.use('/cart', require('./cart.js'));

router.post('/sendmail', sendmailController.sendmail);




// ------------------------------ razorpay

router.post('/create/orderId', isLoggedIn, async function (req, res, next) {
  var options = {
    amount: req.body.amount,  // amount in the smallest currency unit
    currency: "INR",
    receipt: "order_rcptid_11"
  };
  instance.orders.create(options, function (err, order) {
    console.log(order);
    res.send(order)
  });

})
router.post('/api/payment/verify', isLoggedIn, async function (req, res, next) {
  var { validatePaymentVerification, validateWebhookSignature } = require('../node_modules/razorpay/dist/utils/razorpay-utils.js');
  const isVerified= validatePaymentVerification({ "order_id": req.body.handlerresponse.razorpay_order_id, "payment_id": req.body.handlerresponse.razorpay_payment_id }, req.body.handlerresponse.razorpay_signature, '6jVxQIpidlsiVxxQ8ghm9bi2');
  res.status(200).json(isVerified)

})

router.get('/', function (req, res, next) {
  res.render('index');
});

router.post('/resend/otp', isLoggedIn, async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  const otp = Math.floor(1000 + Math.random() * 9000);
  const mailOptions = {
    from: process.env.EMAIL,
    to: loggedUser.email,
    subject: "Account Verification",
    html: `Hello ${loggedUser.username}, </br> <b>${otp}</b> is the OTP for your account verification and will expire in next 1 minute.`
  }
  await sendmailController.sendmail(req, res, mailOptions)
  await otpModel.deleteMany({ user: loggedUser._id })
  await otpModel.create({
    user: loggedUser._id,
    otp,
    expiryAt: Date.now() + 60000
  })
  res.status(200).json("otp resent")
});

router.get('/home', isLoggedIn, async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  let isAddress = false
  if (loggedUser.address.street) {
    isAddress = true
  }
  res.render('home', { loggedUser, isAddress, productByCategory: await productController.getProductsByAllCategories() });
});

router.get('/sales', isLoggedIn, async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  const products = await productModel.find({ user: loggedUser._id })
  res.render('sales', { loggedUser, products });
});

router.get('/checkout', isLoggedIn, async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  const cartItems = await cartModel.find({ user: loggedUser._id }).populate('product')
  let totalPrice = 0, oldprice = 0
  cartItems.forEach(prod => {
    totalPrice += prod.product.discountprice * prod.quantity
    oldprice += prod.product.price * prod.quantity
  })
  res.render('ordersummary', { loggedUser, cartItems, totalPrice, oldprice });
});

router.get('/product/:productId', isLoggedIn, async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  const product = await productModel.findOne({ _id: req.params.productId })
  res.render('product', { loggedUser, product });
});

router.post('/upload/product', isLoggedIn, upload.array('images', 4), async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  const product = await productModel.create({
    user: loggedUser._id,
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    brand: req.body.brand,
    price: req.body.price,
    images: req.files.map((file) => file.filename),
    discountprice: req.body.discountprice,
    quantity: req.body.quantity,
  })
  res.redirect('back')

});

router.get('/delete/:productId', isLoggedIn, async function (req, res) {
  const deleteProduct = await productModel.findOneAndDelete({ _id: req.params.productId })
  deleteProduct.images.forEach(image => {
    fs.unlink(`./public/images/uploads/${image}`, (err) => { })
  })
  res.status(200).json("deleted")
});

router.post('/update/address', isLoggedIn, async function (req, res) {
  const loggedUser = await userModel.findOneAndUpdate(
    { username: req.session.passport.user.username },
    {
      $set: {
        'address.street': req.body.street,
        'address.city': req.body.city,
        'address.state': req.body.state,
        'address.pincode': req.body.pincode,
        'address.country': req.body.country
      }
    },
    { new: true }

  )
  res.redirect('/account/addresses')

});

router.post('/addToWishlist/:productId', isLoggedIn, async function (req, res) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  const product = await productModel.findOne({ _id: req.params.productId })
  console.log(product)
  if (loggedUser.wishlist.indexOf(product._id) === -1) {
    loggedUser.wishlist.push(product._id)
  } else {
    loggedUser.wishlist.splice(loggedUser.wishlist.indexOf(product._id), 1)
  }
  loggedUser.save()
  res.status(200).json("added to wishlist.");
});

router.post('/confirm/order', isLoggedIn, async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  const cartItems = await cartModel.find({ user: loggedUser._id })
  const order = await orderModel.create({
    amount: req.body.totalAmount,
    quantity: cartItems.length,
    buyer: loggedUser._id,
    items: cartItems.map(cartItem => cartItem),
  })
  const mailOptions = {
    from: process.env.EMAIL,
    to: loggedUser.email,
    subject: "Ecomm orders!!",
    html: `Hurray ${loggedUser.username}! Your order od${order._id} for Rs. ${order.amount} has been confirmed.<br> Thanks for Shopping.`
  }
  await sendmailController.sendmail(req, res, mailOptions)
});



// auth related routes

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successRedirect: '/home',
  failureRedirect: '/login'
}));



module.exports = router;
