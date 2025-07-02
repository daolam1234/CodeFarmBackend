import mongoose from "mongoose";

const couponUserSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Account', // Hoặc 'User' tuỳ theo bảng bạn dùng
    required: true 
  },
  coupon_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Coupon', 
    required: true 
  },
  is_used: { 
    type: Boolean, 
    default: false 
  },
}, { 
  timestamps: true, 
  versionKey: false 
});

const CouponUser = mongoose.model("CouponUser", couponUserSchema, "coupon_users");
export default CouponUser;
