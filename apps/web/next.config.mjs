/** @type {import('next').NextConfig} */
const API = process.env.API_URL ?? 'http://localhost:4000';
export default {
  output: 'standalone',
  poweredByHeader: false,
  // Trình duyệt chỉ gọi cùng một địa chỉ; Next chuyển tiếp /api sang máy chủ API (nên cookie đăng nhập an toàn, không cần CORS)
  async rewrites() { return [{ source: '/api/:path*', destination: `${API}/api/:path*` }]; },
};
