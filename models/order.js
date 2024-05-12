const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    amount: Number,
    quantity: Number,
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cart',
    }],
    orderDate: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('order', orderSchema)
