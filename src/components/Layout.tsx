import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useI18n } from "../contexts/I18nContext";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  LayoutDashboard,
  Palette,
  Receipt,
  CreditCard,
  FileText,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Film,
  HardDrive,
  Bell,
  HelpCircle,
  Languages,
  Globe,
  ImageIcon,
} from "lucide-react";
import clsx from "clsx";
import NotificationsDropdown from "./NotificationsDropdown";
import { getAvatarFallback } from "../utils/avatar";

export default function Layout() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setUserData(userDoc.data());
        setIsAdmin(
          userDoc.data()?.role === "admin" ||
            user.email?.toLowerCase() === "claudio@brignole.ch",
        );
      }
    };
    checkAdmin();
  }, [user]);

  const avatar = userData?.photoURL ? (
    <img
      src={userData.photoURL}
      alt="Avatar"
      className="w-full h-full object-cover"
    />
  ) : (
    <div
      className="w-full h-full flex items-center justify-center text-white font-bold"
      style={{ backgroundColor: "#121212" }}
    >
      {userData?.artistName
        ? userData.artistName.charAt(0).toUpperCase()
        : user?.email?.charAt(0).toUpperCase() || "A"}
    </div>
  );

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const navItems = [
    { to: "/app", icon: LayoutDashboard, label: "dashboard" },
    { to: "/app/artworks", icon: Palette, label: "myArtworks" },
    { to: "/app/sales", icon: Receipt, label: "sales" },
    { to: "/app/payments", icon: CreditCard, label: "payments" },
    { to: "/app/contracts", icon: FileText, label: "contracts" },
    { to: "/app/help", icon: HelpCircle, label: "help" },
  ];

  const adminOnlyNavItems = [
    { to: "/app/admin", icon: LayoutDashboard, label: "dashboard" },
    { to: "/app/admin/sales", icon: Receipt, label: "allSales" },
    { to: "/app/admin/payments", icon: CreditCard, label: "paymentRequests" },
    { to: "/app/admin/contracts", icon: FileText, label: "manageContracts" },
    { to: "/app/admin/drive", icon: HardDrive, label: "drive" },
    { to: "/app/admin/users", icon: User, label: "manageUsers" },
    { to: "/app/admin/media", icon: ImageIcon, label: "mediaLibrary" },
    { to: "/app/admin/writers", icon: User, label: "manageWriters" },
    { to: "/app/admin/exhibitions", icon: LayoutDashboard, label: "manageExhibitions" },
    { to: "/app/admin/articles", icon: FileText, label: "manageMagazine" },
    { to: "/app/admin/pages", icon: FileText, label: "managePages" },
    { to: "/app/admin/seo", icon: Globe, label: "manageSEO" },
    { to: "/app/admin/faq", icon: HelpCircle, label: "helpFaq" },
  ];

  const languages: ("EN" | "IT")[] = [
    "EN",
    "IT",
  ];

  return (
    <div className="min-h-screen flex bg-[#F2EEE8] text-[#121212] font-['Karla'] antialiased">
      {/* Texture Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(#FF4F0005 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      ></div>

      {/* Mobile Menu Toggle */}
      <button
        className="lg:hidden fixed top-6 left-6 z-50 p-2 bg-white rounded-full shadow-md"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#F2EEE8] border-r border-[#121212]/5 flex flex-col z-40 transition-transform duration-300",
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="p-8 pb-4 pt-24 lg:pt-8">
          <div className="flex flex-col gap-1 items-start">
            <img
              src="/logo.png"
              alt="TagTales Logo"
              className="h-[91px] w-auto object-contain"
            />
            <p className="text-xs uppercase tracking-widest text-[#59554E] font-bold mt-2">
              {isAdmin ? "Admin Dashboard" : "Writer Dashboard"}
            </p>
            <NavLink
              to="/"
              className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#FF4F00] hover:underline"
            >
              <Settings size={14} />
              <span>{t("nav.viewSite")}</span>
            </NavLink>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-1 overflow-y-auto">
          {(!isAdmin) ? (
            navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/app"}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 px-4 py-2 font-medium rounded-full transition-all duration-200",
                    isActive
                      ? "bg-[#FF4F00] text-white shadow-lg shadow-[#FF4F00]/20 scale-[1.02]"
                      : "text-[#59554E] hover:bg-[#EAE3D9] hover:text-[#121212]",
                  )
                }
              >
                <item.icon size={20} />
                <span>{t("nav." + item.label)}</span>
              </NavLink>
            ))
          ) : (
            <>
              {adminOnlyNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/app/admin"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 px-4 py-2 font-medium rounded-full transition-all duration-200",
                      isActive
                        ? "bg-[#FF4F00] text-white shadow-lg shadow-[#FF4F00]/20 scale-[1.02]"
                        : "text-[#59554E] hover:bg-[#EAE3D9] hover:text-[#121212]",
                    )
                  }
                >
                  <item.icon size={20} />
                  <span>{t("nav." + item.label)}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen relative z-10 flex flex-col w-full lg:w-[calc(100%-16rem)]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#F2EEE8]/80 backdrop-blur-md flex justify-end lg:justify-between items-center h-20 px-6 lg:px-10 border-b border-[#121212]/5">
          <h1 className="hidden lg:block text-[40px] font-bold tracking-tight text-[#121212]">
            {/* Title will be injected by pages or we can leave it empty here and let pages render their own title below header */}
          </h1>
          <div className="flex items-center gap-4 lg:gap-8">
            <nav className="flex gap-2 sm:gap-4">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={clsx(
                    "font-bold text-[10px] sm:text-xs tracking-widest uppercase transition-transform",
                    language === lang
                      ? "text-[#FF4F00] border-b-2 border-[#FF4F00] pb-1"
                      : "text-[#59554E] hover:scale-105",
                  )}
                >
                  {lang}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-2 lg:gap-5">
              <NotificationsDropdown />
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="h-10 w-10 rounded-full border-2 border-[#EAE3D9] overflow-hidden focus:outline-none"
                >
                  {avatar}
                </button>
                {userDropdownOpen && (
                  <div className="fixed sm:absolute top-20 sm:top-auto right-[25px] left-[25px] sm:left-auto sm:right-0 mt-2 sm:w-64 bg-white rounded-xl shadow-lg border border-[#EAE3D9] py-2 z-50">
                    <NavLink
                      to="/app/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#59554E] hover:bg-[#F2EEE8] hover:text-[#121212]"
                    >
                      <Settings size={16} />
                      {t("settings")}
                    </NavLink>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#59554E] hover:bg-[#F2EEE8] hover:text-[#121212]"
                    >
                      <LogOut size={16} />
                      {t("nav.logout")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-[25px] md:p-[50px] w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
