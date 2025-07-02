import CouponUser from "./coupon-user.model.js";
import Coupon from "../coupons/coupon.model.js";
import Account from "../accounts/account.model.js";
import mongoose from "mongoose";

// Thêm mã giảm giá cho user
export const addCouponToUser = async (req, res) => {
  try {
    const { coupon_id } = req.body;
    const user_id = req.user?._id || req.body.user_id; // lấy từ token hoặc body
    if (!coupon_id || !user_id) {
      return res.status(400).json({ status: false, message: "Thiếu coupon_id hoặc user_id" });
    }
    // Kiểm tra coupon tồn tại
    const coupon = await Coupon.findById(coupon_id);
    if (!coupon) {
      return res.status(404).json({ status: false, message: "Không tìm thấy mã giảm giá" });
    }
    // Kiểm tra hết hạn
    const now = new Date();
    if (now > coupon.end_date) {
      return res.status(400).json({ status: false, message: "Mã giảm giá đã hết hạn" });
    }
    // Kiểm tra còn lượt dùng
    if (!coupon.is_unlimited && coupon.max_uses <= 0) {
      return res.status(400).json({ status: false, message: "Mã giảm giá đã hết lượt sử dụng" });
    }
    // Kiểm tra user đã có mã này chưa
    const existed = await CouponUser.findOne({ coupon_id, user_id });
    if (existed) {
      return res.status(400).json({ status: false, message: "Bạn đã thêm mã này rồi" });
    }
    // Thêm vào coupon-user
    await CouponUser.create({ coupon_id, user_id });
    // Trừ lượt dùng nếu có giới hạn
    if (!coupon.is_unlimited) {
      coupon.max_uses -= 1;
      await coupon.save();
    }
    return res.status(201).json({ status: true, message: "Thêm mã giảm giá thành công" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Hàm dọn dẹp: Xóa mã hết hạn mà chưa dùng khỏi danh sách coupon-user
export const cleanupExpiredCoupons = async (req, res) => {
  try {
    const now = new Date();
    // Lấy tất cả coupon hết hạn
    const expiredCoupons = await Coupon.find({ end_date: { $lt: now } });
    const expiredIds = expiredCoupons.map(c => c._id);
    if (expiredIds.length > 0) {
      const result = await CouponUser.deleteMany({ coupon_id: { $in: expiredIds }, is_used: false });
      return res.json({ status: true, message: "Đã dọn dẹp mã hết hạn chưa dùng", deleted: result.deletedCount });
    }
    return res.json({ status: true, message: "Không có mã nào cần dọn dẹp" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
}; 

 
export const getUserCoupons = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.user_id;

    if (!userId) {
      return res.status(400).json({ status: false, message: "Thiếu user_id" });
    }

    const coupons = await CouponUser.find({ user_id: userId })
      .populate('coupon_id') // Lấy thông tin chi tiết của coupon
      .lean();

    const formattedCoupons = coupons.map(item => {
      const coupon = item.coupon_id;
      return {
        _id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        start_date: coupon.start_date,
        end_date: coupon.end_date,
        is_unlimited: coupon.is_unlimited,
        is_used: item.is_used, // Trạng thái đã dùng hay chưa
        added_at: item.createdAt, // Ngày thêm coupon
      };
    });

    return res.json({ status: true, data: formattedCoupons });
  } catch (error) {
    console.error('Error getUserCoupons:', error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
