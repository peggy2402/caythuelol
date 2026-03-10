import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    // Lấy resource_type từ client gửi lên. 
    // Client gửi 'raw' cho PDF, không gửi gì thì mặc định là 'auto' (cho ảnh/video)
    const resourceType = (formData.get("resource_type") as "image" | "video" | "raw" | "auto") || "auto";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadOptions: any = {
      folder: "caythuelol/uploads", // Luôn dùng folder chuẩn
      resource_type: resourceType,  // 'raw' hoặc 'auto'
    };

    if (resourceType === 'raw') {
      // FIX TRIỆT ĐỂ: Không tự set public_id bằng tay.
      // Để Cloudinary tự lấy tên file từ file.name thông qua use_filename
      uploadOptions.use_filename = true;
      uploadOptions.unique_filename = false;
      uploadOptions.overwrite = true;
      // Lưu ý: Cloudinary sẽ tự động dùng tên file gốc (vd: contract_123.pdf) làm public_id trong folder
    }

    // Upload to Cloudinary using stream
    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}