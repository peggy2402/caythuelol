import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Cấu hình Cloudinary với thông tin từ biến môi trường
cloudinary.config({ 
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Chuyển file thành buffer để upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Tải lên Cloudinary bằng stream
    const response = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        folder: 'caythuelol_chat', // Tùy chọn: tạo thư mục riêng cho ảnh chat
        resource_type: 'auto'
      }, (error, result) => {
        if (error) reject(error);
        resolve(result);
      }).end(buffer);
    });

    // @ts-ignore
    const secureUrl = response.secure_url;

    if (!secureUrl) {
        throw new Error('Cloudinary upload failed');
    }

    return NextResponse.json({ url: secureUrl });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}