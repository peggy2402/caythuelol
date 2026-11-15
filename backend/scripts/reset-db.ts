import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI không được tìm thấy trong backend/.env');
  process.exit(1);
}

async function resetDatabase() {
  console.log('🔄 Đang kết nối tới MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Đã kết nối thành công tới MongoDB Atlas.');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not ready');
  }

  const collections = await db.listCollections().toArray();
  console.log(`📋 Tìm thấy ${collections.length} collections:`, collections.map(c => c.name).join(', '));

  console.log('🗑️  Đang xóa toàn bộ dữ liệu trong các collections...');
  for (const col of collections) {
    const colName = col.name;
    // Bỏ qua system collections nếu có
    if (colName.startsWith('system.')) continue;
    
    const count = await db.collection(colName).countDocuments();
    if (count > 0) {
      await db.collection(colName).deleteMany({});
      console.log(`   - Đã xóa sạch ${count} bản ghi trong [${colName}]`);
    } else {
      console.log(`   - Collection [${colName}] đã trống (0 bản ghi)`);
    }
  }

  console.log('✨ Toàn bộ dữ liệu đã được dọn sạch hoàn toàn!');

  // Tạo tài khoản ADMIN mặc định để quản trị viên có thể đăng nhập ngay
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  const adminUser = {
    username: 'admin',
    email: 'admin@leorank.site',
    password_hash: passwordHash,
    role: 'ADMIN',
    isEmailVerified: true,
    platform: 'EMAIL',
    wallet_balance: 0,
    pending_balance: 0,
    profile: {
      avatar: '',
      discord_id: '',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection('users').insertOne(adminUser);
  console.log('👑 Đã khởi tạo tài khoản ADMIN mặc định:');
  console.log('   - Username: admin');
  console.log('   - Email:    admin@leorank.site');
  console.log(`   - Mật khẩu: ${adminPassword}`);
  console.log('   (Bạn có thể đổi mật khẩu bất kỳ lúc nào trong trang quản trị)');

  await mongoose.disconnect();
  console.log('🔌 Đã đóng kết nối MongoDB. Hoàn tất Reset Database 100%!');
}

resetDatabase().catch((err) => {
  console.error('❌ Lỗi khi reset database:', err);
  process.exit(1);
});
