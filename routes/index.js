const express = require('express');
const router = express.Router();
const passport = require('passport');
const userModel = require('../models/users.js')
const productModel = require('../models/product.js')
const cartModel = require('../models/cart.js')
const cartProductModel = require('../models/cartProduct.js')
const orderModel = require('../models/order.js')
const otpModel = require('../models/otp.js')
const upload = require('./multer.js')
const fs = require('fs')
const productController = require('../controllers/product_controller.js')
const sendmailController = require('../controllers/sendmail_controller.js')
const { isLoggedIn } = require('../middlewares/loggedIn_middleware.js')


const Razorpay = require('razorpay');
const cartProduct = require('../models/cartProduct.js');
const { log } = require('console');
const instance = new Razorpay({
  key_id: process.env.RAZOR_ID,
  key_secret: process.env.RAZOR_SECRET,
});



// middlewares




router.use('/register', require('./localAuth.js'))
router.use('/login', require('./googleAuth.js'));
router.use('/account', require('./account.js'))
router.use('/cart', require('./cart.js'));

router.post('/sendmail', sendmailController.sendmail);




// ------------------------------ razorpay

router.post('/create/orderId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  const cart = await cartModel.findOne({ user: loggedUser._id })

  var options = {
    amount: cart.price * 100,  // amount in the smallest currency unit
    currency: "INR",
    receipt: 'order_rcptid_' + cart._id.toString().slice(0, 5)
  };
  instance.orders.create(options, function (err, order) {
    res.json(order);
  });
})

router.post('/api/payment/verify', isLoggedIn, async function (req, res, next) {
  var { validatePaymentVerification, validateWebhookSignature } = require('../node_modules/razorpay/dist/utils/razorpay-utils.js');

  const isVerified = validatePaymentVerification({ "order_id": req.body.handlerresponse.razorpay_order_id, "payment_id": req.body.handlerresponse.razorpay_payment_id }, req.body.handlerresponse.razorpay_signature, process.env.RAZOR_SECRET);
  if (isVerified) {
    const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
    const cart = await cartModel.findOne({ user: loggedUser._id }).populate({ path: 'products', populate: 'product' })
    let quantity = 0;
    for (let i = 0; i < cart.products.length; i++) {
      quantity += cart.products[i].quantity;
    }
    const order = await orderModel.create({
      amount: cart.price,
      quantity,
      buyer: loggedUser._id,
      items: cart.products.map(cartProduct => ({ product: cartProduct.product._id, quantity: cartProduct.quantity })),
    })
    const mailOptions = {
      from: process.env.EMAIL,
      to: loggedUser.email,
      subject: "Order placed successfully",
      html: `Hello ${loggedUser.username}, </br>Thanks for shopping with Ecomm, your orderId is ${'order_' + order._id.toString().slice(0, 4)}.`
    }
    await sendmailController.sendmail(mailOptions)
    await cartModel.findOneAndDelete({ user: loggedUser._id })
  }

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
  await sendmailController.sendmail(mailOptions)
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
  if (!loggedUser.isVerified) {
    const otp = Math.floor(1000 + Math.random() * 9000);
    const mailOptions = {
      from: process.env.EMAIL,
      to: loggedUser.email,
      subject: "Account Verification",
      html: `Hello ${loggedUser.username}, </br> <b>${otp}</b> is the OTP for your account verification and will expire in next 1 minute.`
    }
    await sendmailController.sendmail(mailOptions)
    await otpModel.deleteMany({ user: loggedUser._id })
    await otpModel.create({
      user: loggedUser._id,
      otp,
      expiryAt: Date.now() + 60000
    })
    res.redirect('/account/verify')
  }else{
    if (loggedUser.address.street) {
      isAddress = true
    }
  }
  res.render('home', { loggedUser, isAddress, productByCategory: await productController.getProductsByAllCategories(loggedUser._id) });
});

router.get('/sales', isLoggedIn, async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  const products = await productModel.find({ user: loggedUser._id })
  res.render('sales', { loggedUser, products });
});

router.get('/checkout', isLoggedIn, async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  const cart = await cartModel.findOne({ user: loggedUser._id }).populate('products')
  res.render('ordersummary', { loggedUser, cart });
});

router.get('/product/:productId', isLoggedIn, async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  const product = await productModel.findOne({ _id: req.params.productId })
  const inCart = await cartProductModel.findOne({ product: product._id }) ? true : false;
  res.render('product', { loggedUser, product, inCart });
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
  const cart = await cartModel.findOne({ user: loggedUser._id }).populate({ path: 'products', populate: 'product' })
  let quantity = 0;
  for (let i = 0; i < cart.products.length; i++) {
    quantity += cart.products[i].quantity;
  }
  const order = await orderModel.create({
    amount: cart.price,
    quantity,
    buyer: loggedUser._id,
    items: cart.products.map(cartProduct => ({ product: cartProduct.product._id, quantity: cartProduct.quantity })),
  })
  const mailOptions = {
    from: process.env.EMAIL,
    to: loggedUser.email,
    subject: "Order placed successfully",
    html: `Hello ${loggedUser.username}, </br>Thanks for shopping with Ecomm, your orderId is ${'order_' + order._id.toString().slice(0, 4)}.`
  }
  await sendmailController.sendmail(mailOptions)
  await cartModel.findOneAndDelete({ user: loggedUser._id })
  res.status(200).json("order placed successfully")
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
