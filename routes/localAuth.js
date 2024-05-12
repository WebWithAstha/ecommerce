const express = require('express');
const router = express.Router();
const passport = require('passport');
const userModel = require('../models/users.js')
const otpModel = require('../models/otp.js')
const localStrategy = require('passport-local')
passport.use(new localStrategy(userModel.authenticate()))

const sendmailController = require('../controllers/sendmail_controller.js')



router.post('/', async function (req, res, next) {
    const otp = Math.floor(1000 + Math.random() * 9000);
    const userdata = new userModel({
        username: req.body.username,
        email: req.body.email,
        acctype: req.body.acctype,
    })
    userModel.register(userdata, req.body.password)
        .then(async registeredUser => {
            const mailOptions = {
                from: process.env.EMAIL,
                to: registeredUser.email,
                subject: "Account Verification",
                html: `Hello ${registeredUser.username}, </br> <b>${otp}</b> is the OTP for your account verification and will expire in next 1 minute.`
            }
            await sendmailController.sendmail(req, res, mailOptions)
            await otpModel.deleteMany({ user: registeredUser._id })
            await otpModel.create({
                user: registeredUser._id,
                otp,
                expiryAt: Date.now() + 60000
            })

            passport.authenticate("local")(req, res, function () {
                res.redirect('/account/verify')
            })
        })
})





module.exports = router;
