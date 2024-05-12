const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref:'user' },
    name: String,
    description: String,
    category: String,
    brand: String,
    price: Number,
    discountprice: Number,
    images: [{ type: String, }],
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('product', productSchema)
