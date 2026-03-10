// src/lib/geo.ts

// Map mã quốc gia (ISO Alpha-2) sang mã Server LOL
const COUNTRY_TO_SERVER: Record<string, string> = {
  'VN': 'VN',
  'KR': 'KR',
  'JP': 'JP',
  'US': 'NA', 'CA': 'NA',
  'GB': 'EUW', 'FR': 'EUW', 'DE': 'EUW', 'ES': 'EUW', 'IT': 'EUW', 'NL': 'EUW',
  'PL': 'EUNE', 'GR': 'EUNE', 'RO': 'EUNE', 'HU': 'EUNE', 'CZ': 'EUNE',
  'AU': 'OCE', 'NZ': 'OCE',
  'RU': 'RU',
  'TR': 'TR',
  'BR': 'BR',
  'MX': 'LAN',
  'AR': 'LAS', 'CL': 'LAS',
  'PH': 'PH',
  'SG': 'SG', 'MY': 'SG', 'ID': 'SG',
  'TH': 'TH',
  'TW': 'TW',
  'AE': 'ME', 'SA': 'ME', 'QA': 'ME', 'KW': 'ME', 'BH': 'ME', 'OM': 'ME'
};

export async function detectUserServer(): Promise<string | null> {
  try {
    // Sử dụng dịch vụ miễn phí ipapi.co (Giới hạn 1000 req/ngày)
    // Trong môi trường production lớn, nên dùng API trả phí hoặc proxy server
    const res = await fetch('https://api.ipapi.is/');
    if (!res.ok) return null;
    
    const data = await res.json();
    const countryCode = data.country_code; // VD: 'VN', 'US'

    return COUNTRY_TO_SERVER[countryCode] || null;
  } catch (error) {
    console.warn('Geo detection failed:', error);
    return null;
  }
}
