import "./globals.css";
import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="bg-gray-50 text-gray-900 h-full flex flex-col">
        <Navbar />
        {/* 
            1. 移除 mx-auto, max-w-6xl, px-6, py-8
            2. 添加 flex-1 (占据剩余高度) 和 w-full (宽度铺满)
        */}
        <main className="flex-1 w-full overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}