import express from "express";
import { addCouponToUser, cleanupExpiredCoupons, getUserCoupons } from "./coupon-user.controller.js";
import checkPermission from "../../middlewares/checkPermission.js";

const router = express.Router();

// Thêm mã giảm giá cho user
router.post("/add", checkPermission.verifyToken, addCouponToUser);
// Lấy danh sách mã giảm giá đã lưu của user
router.get("/my-coupons", checkPermission.verifyToken, getUserCoupons);

router.get("/cleanup", checkPermission.verifyToken, checkPermission.isAdmin, cleanupExpiredCoupons);

export default router; 