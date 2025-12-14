/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. กำหนดให้ Next.js สร้าง Static Export
  // ซึ่งจะสร้างไฟล์ทั้งหมดในโฟลเดอร์ 'out'
  output: 'export',

  // 2. กำหนดให้ path ที่สร้างขึ้นเป็นแบบสัมพัทธ์ (Relative)
  // เพื่อให้ลิงก์ต่างๆ ทำงานได้อย่างถูกต้องบน GitHub Pages ที่มี Subpath
  basePath: process.env.NODE_ENV === 'production' ? '/border-relief' : '',

  // 3. ปิดการ Optimize รูปภาพ เนื่องจากต้องใช้ Image Server
  // การตั้งค่านี้จะอนุญาตให้ใช้ <Image> Component โดยไม่มีข้อผิดพลาด
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;