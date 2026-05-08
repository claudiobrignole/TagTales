import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import LanguagePrompt from "./LanguagePrompt";
import BackToTop from "./BackToTop";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F2EEE8] text-[#121212] font-['Karla'] font-sans selection:bg-[#FF4F00] selection:text-white overflow-x-hidden w-full max-w-[100vw]">
      {/* Texture Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(#12121215 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      ></div>
      
      <LanguagePrompt />
      <Header />
      
      <main className="relative z-10 pt-[65px] lg:pt-[75px] w-full min-w-0">
        {children}
      </main>
      
      <BackToTop />
      <Footer />
    </div>
  );
}
