const express = require('express');
const router = express.Router();
const userModel = require('../models/users')
const otpModel = require('../models/otp')

const {isLoggedIn}= require('../middlewares/loggedIn_middleware.js')

router.get('/', isLoggedIn, async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  res.render('accountdets', { loggedUser });
});
router.get('/orders', isLoggedIn, async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  res.render('sellerorders', { loggedUser });
});
router.get('/wishlist', isLoggedIn, async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username }).populate('wishlist')
  res.render('wishlist', { loggedUser });
});
router.get('/addresses', isLoggedIn, async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  res.render('address', { loggedUser });
});
router.get('/verify',isLoggedIn, function (req, res, next) {
  res.render('verification');
});
router.post('/verify',isLoggedIn, async function (req, res, next) {
  const loggedUser = await userModel.findOne({username: req.session.passport.user.username})
  const otp = await otpModel.findOne({user:loggedUser._id})
  if(otp.expiryAt<Date.now()){
    res.status(400).json({message:"OTP Expired", status:loggedUser.isVerified})
  }
  let enteredOtp = `${req.body.o1}${req.body.o2}${req.body.o3}${req.body.o4}`
  if(otp.otp.toString() === enteredOtp.toString()){
    loggedUser.isVerified = true
    loggedUser.save()
  }
  res.status(200).json({message:"OTP Checked", status:loggedUser.isVerified})
  
});


module.exports = router;
