/**
 * Utility chuẩn hóa tính toán giá trị đơn hàng và thu nhập cho Booster.
 * Trừ toàn bộ phí dịch vụ (phí sàn / service_fee) của hệ thống trước khi hiển thị cho Booster.
 * Ví dụ: Đơn gốc 64.000 đ + 2% phí sàn (1.280 đ) = 65.280 đ khách trả.
 * Booster sẽ thấy:
 * - Giá trị đơn hàng nhận được: 64.000 đ
 * - Thu nhập thực nhận (85%): 54.400 đ
 */

export function getBoosterOrderValue(pricing?: any): number {
  if (!pricing) return 0;

  // 1. Nếu đã lưu sẵn booster_order_value
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

  // 4. Suy luận từ booster_earnings (thu nhập = 85% giá trị đơn hàng sau trừ phí sàn)
  if (pricing.booster_earnings && Number(pricing.booster_earnings) > 0) {
    const candidate = Math.round(Number(pricing.booster_earnings) / 0.85);
    if (candidate < total && Math.abs(Math.round(candidate * 0.85) - Number(pricing.booster_earnings)) <= 5) {
      return candidate;
    }
  }

  // 5. Tổng base_price + option_fees/addons_cost
  const basePrice = Number(pricing.base_price || pricing.basePrice || 0);
  const optionFees = Number(pricing.option_fees || pricing.optionFees || pricing.addons_cost || 0);
  if (basePrice > 0 && basePrice + optionFees > 0 && basePrice + optionFees < total) {
    return basePrice + optionFees;
  }

  // 6. Tính theo tỷ lệ % phí sàn
  if (pricing.platform_fee_percent && Number(pricing.platform_fee_percent) > 0) {
    return Math.round(total / (1 + Number(pricing.platform_fee_percent) / 100));
  }

  // 7. Nhận diện cấu trúc phí sàn 2% mặc định của LEORANK (65.280 đ = 64.000 đ * 1.02)
  if (total > 0) {
    const candidate = Math.round(total / 1.02);
    if (Math.abs(total - Math.round(candidate * 1.02)) <= 2) {
      return candidate;
    }
  }

  return total;
}

export function getBoosterEarnings(pricing?: any): number {
  if (!pricing) return 0;
  if (pricing.booster_earnings && Number(pricing.booster_earnings) > 0) {
    return Number(pricing.booster_earnings);
  }
  const orderValue = getBoosterOrderValue(pricing);
  return Math.round(orderValue * 0.85);
}
