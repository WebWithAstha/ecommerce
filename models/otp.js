const mongoose = require('mongoose');

const otpSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    otp: Number,
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiryAt: Date,

})

module.exports = mongoose.model('otp', otpSchema)
