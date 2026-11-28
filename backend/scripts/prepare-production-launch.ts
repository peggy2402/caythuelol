import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI không tồn tại trong backend/.env');
  process.exit(1);
}

// Danh sách các collection chứa dữ liệu thử nghiệm cần dọn sạch
const TEST_COLLECTIONS_TO_PURGE = [
  'orders',                  // Đơn hàng test
  'transactions',            // Lịch sử giao dịch ví & cọc test
  'pointtransactions',       // Giao dịch điểm thưởng test
  'withdrawals',             // Yêu cầu rút tiền test
  'notifications',           // Thông báo test
  'messages',                // Tin nhắn chat trong đơn test
  'auditlogs',               // Nhật ký thao tác test
  'webhooklogs',             // Logs nhận webhook SePay test
  'unmatcheddeposits',       // Tiền nạp không khớp test
  'verificationcodes',       // Mã OTP test
  'rankhistories',           // Lịch sử rank test
  'boosterrankinghistories', // Lịch sử BXH booster test
];

// Danh sách collection BẢO TỒN NGUYÊN VẸN 100%
const PROTECTED_COLLECTIONS = [
  'users',                // Tài khoản Admin, Booster, Thành viên
  'boosterprofiles',     // Hồ sơ, tỷ lệ thắng, game nhận cày của Booster
  'blogs',               // 7 Bài viết tin tức & hướng dẫn
  'comments',            // Bình luận bài viết
  'systemsettings',      // 10 Cấu hình hệ thống, tỷ giá, phí sàn
  'rankingconfigs',      // Cấu hình VIP & Thưởng
  'vouchers',            // Mã giảm giá
  'games',               // Danh mục tựa game
  'gameservicetemplates',// Bảng giá dịch vụ cày thuê
];

async function main() {
  const isExecute = process.argv.includes('--execute');

  console.log('===============================================================');
  console.log('   🚀 LEORANK - PRODUCTION LAUNCH SANITIZER & PREPARATION');
  console.log('===============================================================');
  console.log(`📡 Database Target: ${MONGODB_URI.replace(/:([^@]+)@/, ':****@')}`);
  console.log(`⚙️  Chế độ: ${isExecute ? '🔴 THỰC THI THẬT (--execute)' : '🟡 KIỂM TRA TRƯỚC (DRY-RUN)'}`);
  console.log('---------------------------------------------------------------\n');

  const conn = await mongoose.createConnection(MONGODB_URI).asPromise();
  console.log('✅ Kết nối thành công tới Database Production.\n');

  console.log('🔍 THỐNG KÊ DỮ LIỆU CẦN DỌN DẸP:');
  let totalPurgeDocs = 0;

  for (const colName of TEST_COLLECTIONS_TO_PURGE) {
    try {
      const col = conn.db.collection(colName);
      const count = await col.countDocuments();
      totalPurgeDocs += count;
      console.log(` - [${colName}]: ${count} bản ghi`);

      if (isExecute && count > 0) {
        await col.deleteMany({});
        console.log(`   ➔ 🗑️  Đã xóa sạch ${count} bản ghi trong [${colName}]`);
      }
    } catch (err: any) {
      console.error(`   ❌ Lỗi xử lý [${colName}]:`, err.message);
    }
  }

  console.log(`\n📊 Tổng số bản ghi rác cần xóa: ${totalPurgeDocs} bản ghi\n`);

  console.log('🔍 THỐNG KÊ DỮ LIỆU ĐƯỢC BẢO VỆ NGUYÊN VẸN (100% PRESERVED):');
  for (const colName of PROTECTED_COLLECTIONS) {
    try {
      const col = conn.db.collection(colName);
      const count = await col.countDocuments();
      console.log(` - [${colName}]: ${count} bản ghi (AN TOÀN TUYỆT ĐỐI)`);
    } catch (err: any) {
      // Bỏ qua nếu collection chưa có document
    }
  }

  console.log('\n💳 RESET SỐ DƯ VÍ NGƯỜI DÙNG:');
  const userCol = conn.db.collection('users');
  const userCount = await userCol.countDocuments();
  console.log(` - Tìm thấy ${userCount} tài khoản.`);

  if (isExecute) {
    // Đặt lại số dư ví về 0, giữ nguyên thông tin tài khoản, role, mật khẩu
    await userCol.updateMany(
      {},
      {
        $set: {
          wallet_balance: 0,
          pending_balance: 0,
          held_balance: 0,
          deposit_spent: 0,
          loyalty_points: 0,
          orders_completed: 0,
          orders_cancelled: 0,
        },
      }
    );
    console.log(`   ➔ 💰 Đã đặt lại số dư ví của toàn bộ ${userCount} người dùng về 0 đ.`);
  } else {
    console.log(`   ➔ [DRY-RUN] Sẽ đặt lại số dư ví của ${userCount} người dùng về 0 đ.`);
  }

  await conn.close();

  console.log('\n---------------------------------------------------------------');
  if (!isExecute) {
    console.log('🟡 ĐÂY LÀ CHẾ ĐỘ DRY-RUN (Chưa có dữ liệu nào bị thay đổi).');
    console.log('👉 Khi bạn đã sẵn sàng dọn sạch thật để mở cửa web cho khách, hãy chạy:');
    console.log('   npm run prepare:prod\n');
  } else {
    console.log('🎉 ĐÃ DỌN DẸP SẠCH SẼ DATABASE PRODUCTION THÀNH CÔNG 100%!');
    console.log('✨ Hệ thống LeoRank đã sẵn sàng đón khách hàng thật với dữ liệu tinh sạch!\n');

    // Gửi thông báo tới Discord Admin
    if (DISCORD_WEBHOOK_URL) {
      try {
        await axios.post(DISCORD_WEBHOOK_URL, {
          username: 'LeoRank Bot',
          avatar_url: 'https://www.leorank.site/og-image.png',
          embeds: [
            {
              title: '🧹 DATABASE PRODUCTION ĐÃ ĐƯỢC DỌN DẸP SẠCH SẼ!',
              description: 'Toàn bộ đơn hàng test và giao dịch thử nghiệm đã được dọn sạch. Số dư ví người dùng đã đặt về 0 đ. Hệ thống sẵn sàng 100% cho ngày phát hành chính thức!',
              color: 0x00ff88,
              fields: [
                { name: '🗑️ Bản ghi đã xóa', value: `${totalPurgeDocs} bản ghi test`, inline: true },
                { name: '🛡️ Cấu hình bảo toàn', value: 'Bảng giá, Game, Admin, Booster, Blogs', inline: true },
                { name: '🚀 Trạng thái', value: '🟢 Sẵn sàng Go-Live', inline: true },
              ],
              timestamp: new Date().toISOString(),
            },
          ],
        });
        console.log('📢 Đã gửi thông báo xác nhận tới kênh Discord Admin.');
      } catch (err: any) {
        console.warn('Không thể gửi thông báo Discord:', err.message);
      }
    }
  }
  console.log('===============================================================\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
