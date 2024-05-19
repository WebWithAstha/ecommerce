const mongoose = require('mongoose');

const orderedProduct = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
    },
    quantity: Number,
})


const orderSchema = mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    items: [orderedProduct],
    amount: Number,
    quantity: Number,
    orderDate: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('order', orderSchema)
