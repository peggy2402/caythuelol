/**
 * Utility chuẩn hóa tính toán giá trị đơn hàng và thu nhập cho Booster.
 * Cơ chế phân bổ doanh thu LEORANK:
 * - Khách hàng thanh toán = Giá trị dịch vụ gốc (64.000 đ) + Phí dịch vụ sàn (ví dụ 2%: 1.280 đ) = 65.280 đ.
 * - Sàn / Admin nhận: Phí dịch vụ (1.280 đ).
 * - Booster nhận: Toàn bộ 100% giá trị dịch vụ đơn hàng (64.000 đ), không bị trừ 15% hoa hồng nào khác.
 */

export function getBoosterOrderValue(pricing?: any): number {
  if (!pricing) return 0;

  // 1. Nếu đơn hàng có lưu sẵn booster_earnings và voucher do Sàn tài trợ (PLATFORM)
  if (pricing.funding_source === 'PLATFORM') {
    if (typeof pricing.booster_earnings === 'number' && pricing.booster_earnings > 0) {
      return pricing.booster_earnings;
    }
    const listed = Number(pricing.listed_price || pricing.original_price || 0);
    if (listed > 0) return listed;
  }

  // 2. Nếu đã lưu sẵn booster_earnings
  if (typeof pricing.booster_earnings === 'number' && pricing.booster_earnings > 0) {
    return pricing.booster_earnings;
  }

  // 3. Nếu đã lưu sẵn booster_order_value
  if (pricing.booster_order_value && Number(pricing.booster_order_value) > 0) {
    return Number(pricing.booster_order_value);
  }

  const total = Number(pricing.total_amount || 0);
  const serviceFee = Number(pricing.service_fee || 0);

  // 2. Trừ trực tiếp phí dịch vụ nếu có
  if (serviceFee > 0) {
    return Math.max(0, total - serviceFee);
  }

  // 3. Giá gốc (original_price) trước khi cộng phí sàn
  if (pricing.original_price && Number(pricing.original_price) < total) {
    const discount = Number(pricing.discount_amount || 0);
    const net = Number(pricing.original_price) - discount;
    if (net > 0 && net < total) return net;
  }

  // 4. Nhận diện cấu trúc phí sàn 2% mặc định của LEORANK (65.280 đ = 64.000 đ * 1.02)
  if (total > 0) {
    const candidate = Math.round(total / 1.02);
    if (Math.abs(total - Math.round(candidate * 1.02)) <= 2) {
      return candidate;
    }
  }

  // 5. Tính theo tỷ lệ % phí sàn
  if (pricing.platform_fee_percent && Number(pricing.platform_fee_percent) > 0) {
    return Math.round(total / (1 + Number(pricing.platform_fee_percent) / 100));
  }

  // 6. Tổng base_price + option_fees/addons_cost
  const basePrice = Number(pricing.base_price || pricing.basePrice || 0);
  const optionFees = Number(pricing.option_fees || pricing.optionFees || pricing.addons_cost || 0);
  if (basePrice > 0 && basePrice + optionFees > 0 && basePrice + optionFees < total) {
    return basePrice + optionFees;
  }

  // 7. Khôi phục từ booster_earnings cũ nếu từng bị nhân 0.85
  if (pricing.booster_earnings && Number(pricing.booster_earnings) > 0) {
    const candidate = Math.round(Number(pricing.booster_earnings) / 0.85);
    if (candidate <= total && Math.abs(Math.round(candidate * 0.85) - Number(pricing.booster_earnings)) <= 5) {
      return candidate;
    }
    return Number(pricing.booster_earnings);
  }

  return total;
}

export function getBoosterEarnings(pricing?: any): number {
  if (!pricing) return 0;
  // Booster nhận trọn vẹn 100% giá trị dịch vụ đơn hàng (không trừ 15%)
  return getBoosterOrderValue(pricing);
}

/**
 * Tính số tiền cọc thực tế thuộc về phần dịch vụ của Booster.
 * Loại trừ phần cọc phí sàn thuộc về Admin để phía Booster hiển thị chính xác.
 */
export function getBoosterDepositValue(pricing?: any): number {
  if (!pricing) return 0;
  const total = Number(pricing.total_amount || 0);
  const deposit = Number(pricing.deposit_amount || 0);
  if (total <= 0 || deposit <= 0) return 0;
  if (deposit >= total) return getBoosterOrderValue(pricing);
  const ratio = deposit / total;
  return Math.round(getBoosterOrderValue(pricing) * ratio);
}
