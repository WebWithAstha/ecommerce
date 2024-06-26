const mongoose = require('mongoose');

const cartSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId ,
        ref: 'user',
    },
    products:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cartProduct',
    }],
    price:Number
})

module.exports = mongoose.model('cart', cartSchema)
