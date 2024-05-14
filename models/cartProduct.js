const mongoose = require('mongoose');

const cartSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId ,
        ref: 'user',
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
    },
    quantity: {
        type: Number,
        default: 1
    }
})

module.exports = mongoose.model('cartProduct', cartSchema)
