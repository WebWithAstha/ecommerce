require('dotenv').config()
const express = require('express');
const router = express.Router();
const passport = require('passport');
const userModel = require('../models/users')
const GoogleStrategy = require('passport-google-oidc');

passport.use(new GoogleStrategy({
    clientID: process.env['CLIENT_ID'],
    clientSecret: process.env['CLIENT_SECRET'],
    callbackURL: '/oauth2/redirect/google',
    scope: ['profile', 'email']
}, async function verify(issuer, profile, cb) {
    const user = await userModel.findOne({email:profile.emails[0].value})
    if (user) {
        cb(null, user)
        return;
    }
    const newUser = await userModel.create({
        username: profile.displayName,
        email: profile.emails[0].value,
        isVerified:true
    })
    cb(null, newUser)

}));

router.get('/', function (req, res, next) {
    res.render('login',);
});


router.post('/', passport.authenticate('local',{
    successRedirect:'/home',
    failureRedirect:'/login'
}), function (req, res, next) {});

router.get('/federated/google', passport.authenticate('google'));




module.exports = router;
