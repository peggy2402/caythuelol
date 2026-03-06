import { AlertTriangle } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold">Hệ thống đang bảo trì</h1>
        
        <p className="text-zinc-400">
          Chúng tôi đang thực hiện nâng cấp hệ thống để mang lại trải nghiệm tốt hơn.
          <br />
          Vui lòng quay lại sau ít phút.
        </p>

        <div className="pt-8 text-sm text-zinc-600">
          &copy; {new Date().getFullYear()} CAYTHUELOL. All rights reserved.
        </div>
      </div>
    </div>
  );
}