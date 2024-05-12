const mongoose = require('mongoose');
mongoose.connect('mongodb://0.0.0.0/ecommerce')
const plm = require('passport-local-mongoose')

const userSchema = mongoose.Schema({
  username:{
    type:String,
    unique:true,
  },
  isVerified:{
    type:Boolean,
    default:false
  },
  password:String,
  email:{
    type:String,
    unique:true
  },
  acctype:{
    type:String,
    default:'buyer'
  },
  address: {
    street: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    pincode: {
      type: Number,
    },
    country: {
      type: String,
      default:"India"
    },
  }
  ,createdOn:{
    type:Date,
    default:Date.now
  },
  wishlist:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product'
    }
  ]
})
userSchema.plugin(plm)

module.exports = mongoose.model('user',userSchema)
