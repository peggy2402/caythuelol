import mongoose from 'mongoose';

const SOURCE_URI = 'mongodb+srv://caythuelol:kywAAjhZMYpUcG1V@cluster0.8cyal7t.mongodb.net/caythuelol?retryWrites=true&w=majority';
const TARGET_URI = 'mongodb+srv://vtchn_admin_leorank:W3467o0ohOD5Vc90@cluster0.x1aha5z.mongodb.net/caythuelol_staging?retryWrites=true&w=majority';

// Các collection cấu hình và dữ liệu cốt lõi cần đồng bộ sang Staging
const COLLECTIONS_TO_CLONE = [
  'users',
  'boosterprofiles',
  'blogs',
  'comments',
  'rankingconfigs',
  'vouchers',
  'systemsettings',
  'games',
  'gameservicetemplates',
];

async function main() {
  console.log('🔄 Đang kết nối tới Database Source (caythuelol)...');
  const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
  console.log('✅ Đã kết nối Source DB');

  console.log('🔄 Đang kết nối tới Database Staging (caythuelol_staging)...');
  const targetConn = await mongoose.createConnection(TARGET_URI).asPromise();
  console.log('✅ Đã kết nối Target DB Staging');

  console.log('\n🚀 BẮT ĐẦU ĐỒNG BỘ DỮ LIỆU SANG STAGING:');
  for (const colName of COLLECTIONS_TO_CLONE) {
    try {
      const sourceCol = sourceConn.db.collection(colName);
      const docs = await sourceCol.find({}).toArray();

      if (docs.length === 0) {
        console.log(` ⏩ [${colName}]: 0 bản ghi (bỏ qua)`);
        continue;
      }

      const targetCol = targetConn.db.collection(colName);
      // Xóa dữ liệu cũ nếu có trong target collection
      await targetCol.deleteMany({});
      // Chèn toàn bộ dữ liệu từ source
      await targetCol.insertMany(docs);
      console.log(` ✅ [${colName}]: Đã sao chép thành công ${docs.length} bản ghi`);
    } catch (err: any) {
      console.error(` ❌ Lỗi sao chép [${colName}]:`, err.message);
    }
  }

  await sourceConn.close();
  await targetConn.close();

  console.log('\n🎉 HOÀN TẤT ĐỒNG BỘ DỮ LIỆU SANG STAGING 100% THÀNH CÔNG!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
