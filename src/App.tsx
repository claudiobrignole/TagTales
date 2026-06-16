/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { I18nProvider } from "./contexts/I18nContext";
import { PublicDataProvider } from "./contexts/PublicDataContext";
import Layout from "./components/Layout";
import { trackPageView } from "./utils/analytics";
import { initCacheVersion } from "./utils/cacheManager";
import PublicHome from "./pages/PublicHome";

// Lazy-loaded pages to reduce initial bundle size and boost performance
const PublicWriters = React.lazy(() => import("./pages/PublicWriters"));
const PublicWriterDetail = React.lazy(() => import("./pages/PublicWriterDetail"));
const PublicExhibitions = React.lazy(() => import("./pages/PublicExhibitions"));
const PublicExhibitionDetail = React.lazy(() => import("./pages/PublicExhibitionDetail"));
const PublicMagazine = React.lazy(() => import("./pages/PublicMagazine"));
const PublicArticleDetail = React.lazy(() => import("./pages/PublicArticleDetail"));
const PublicPage = React.lazy(() => import("./pages/PublicPage"));
const PublicAssistance = React.lazy(() => import("./pages/PublicAssistance"));
const Populate = React.lazy(() => import("./pages/Populate"));
const Login = React.lazy(() => import("./pages/Login"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Artworks = React.lazy(() => import("./pages/Artworks"));
const Sales = React.lazy(() => import("./pages/Sales"));
const Payments = React.lazy(() => import("./pages/Payments"));
const Contracts = React.lazy(() => import("./pages/Contracts"));
const AdminContracts = React.lazy(() => import("./pages/AdminContracts"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = React.lazy(() => import("./pages/AdminUsers"));
const AdminPayments = React.lazy(() => import("./pages/AdminPayments"));
const AdminSales = React.lazy(() => import("./pages/AdminSales"));
const Help = React.lazy(() => import("./pages/Help"));
const AdminHelp = React.lazy(() => import("./pages/AdminHelp"));
const AdminWriters = React.lazy(() => import("./pages/AdminWriters"));
const AdminExhibitions = React.lazy(() => import("./pages/AdminExhibitions"));
const AdminArticles = React.lazy(() => import("./pages/AdminArticles"));
const AdminPages = React.lazy(() => import("./pages/AdminPages"));
const AdminMedia = React.lazy(() => import("./pages/AdminMedia"));
const AdminSEO = React.lazy(() => import("./pages/admin/SEOManager"));
const AdminNewsletter = React.lazy(() => import("./pages/admin/AdminNewsletter"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

import EnRouteWrapper from "./components/EnRouteWrapper";

import LanguagePrompt from "./components/LanguagePrompt";
import PWAInstallBanner from "./components/PWAInstallBanner";
import { isSuperAdminEmail } from "./constants/admin";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [resending, setResending] = React.useState(false);
  const [message, setMessage] = React.useState("");

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2EEE8]">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  if (!user.emailVerified && !isSuperAdminEmail(user.email)) {
    const handleResend = async () => {
      setResending(true);
      setMessage("");
      try {
        const { sendEmailVerification } = await import("firebase/auth");
        await sendEmailVerification(user);
        setMessage("Verification email sent! Please check your inbox.");
      } catch (error: any) {
        setMessage(error.message || "Failed to send verification email.");
      } finally {
        setResending(false);
      }
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2EEE8] p-6 text-center font-['Karla']">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#EAE3D9] max-w-md w-full">
          <h2 className="text-2xl font-bold text-[#121212] mb-4">
            Verify your email
          </h2>
          <p className="text-[#59554E] mb-6">
            Please check your inbox and verify your email address to access your
            account.
          </p>

          {message && (
            <div
              className={`mb-6 p-3 rounded-lg text-sm ${message.includes("sent") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}
            >
              {message}
            </div>
          )}

          <button
            onClick={async () => {
              setResending(true);
              try {
                await user.reload();
                if (user.emailVerified) {
                  window.location.reload();
                } else {
                  setMessage(
                    "Email not verified yet. Please check your inbox.",
                  );
                }
              } catch (error: any) {
                setMessage(
                  error.message || "Failed to check verification status.",
                );
              } finally {
                setResending(false);
              }
            }}
            disabled={resending}
            className="w-full bg-[#FF4F00] text-white font-bold py-3 px-6 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#FF4F00]/20 mb-4 disabled:opacity-50"
          >
            I've verified my email
          </button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full bg-white border border-[#EAE3D9] text-[#121212] font-bold py-3 px-6 rounded-full hover:bg-[#F2EEE8] transition-all disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend verification email"}
          </button>

          <button
            onClick={() => {
              import("firebase/auth").then(({ signOut }) => {
                import("./firebase").then(({ auth }) => {
                  signOut(auth);
                });
              });
            }}
            className="w-full mt-4 bg-transparent text-[#59554E] font-bold py-3 px-6 rounded-full hover:bg-[#F2EEE8] transition-all"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function PublicRouteWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

export default function App() {
  useEffect(() => {
    initCacheVersion();
    const handleContextMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);
  return (
    <AuthProvider>
      <BrowserRouter>
        <PublicDataProvider>
          <I18nProvider>
            <LanguagePrompt />
          <PWAInstallBanner />
          <RouteTracker />
          <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2EEE8] font-['Karla'] p-6 text-center">
              <div className="w-8 h-8 border-4 border-[#FF4F00] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-[#59554E] text-sm uppercase tracking-wider font-bold">Caricamento...</p>
            </div>
          }>
            <Routes>
            <Route path="/coming-soon" element={<Navigate to="/" replace />} />
            <Route 
              path="/en" 
              element={
                <PublicRouteWrapper>
                  <EnRouteWrapper>
                    <PublicHome />
                  </EnRouteWrapper>
                </PublicRouteWrapper>
              } 
            />
            <Route 
              path="/en/writers" 
              element={
                <PublicRouteWrapper>
                  <EnRouteWrapper>
                    <PublicWriters />
                  </EnRouteWrapper>
                </PublicRouteWrapper>
              } 
            />
            <Route 
              path="/en/writers/:slug" 
              element={
                <PublicRouteWrapper>
                  <EnRouteWrapper>
                    <PublicWriterDetail />
                  </EnRouteWrapper>
                </PublicRouteWrapper>
              } 
            />
            <Route 
              path="/en/exhibitions" 
              element={
                <PublicRouteWrapper>
                  <EnRouteWrapper>
                    <PublicExhibitions />
                  </EnRouteWrapper>
                </PublicRouteWrapper>
              } 
            />
            <Route 
              path="/en/exhibitions/:slug" 
              element={
                <PublicRouteWrapper>
                  <EnRouteWrapper>
                    <PublicExhibitionDetail />
                  </EnRouteWrapper>
                </PublicRouteWrapper>
              } 
            />
            <Route 
              path="/en/magazine" 
              element={
                <PublicRouteWrapper>
                  <EnRouteWrapper>
                    <PublicMagazine />
                  </EnRouteWrapper>
                </PublicRouteWrapper>
              } 
            />
            <Route 
              path="/en/magazine/:slug" 
              element={
                <PublicRouteWrapper>
                  <EnRouteWrapper>
                    <PublicArticleDetail />
                  </EnRouteWrapper>
                </PublicRouteWrapper>
              } 
            />
            <Route
              path="/en/support"
              element={
                <PublicRouteWrapper>
                  <EnRouteWrapper>
                    <PublicAssistance />
                  </EnRouteWrapper>
                </PublicRouteWrapper>
              }
            />
            <Route
              path="/en/about"
              element={
                <PublicRouteWrapper>
                  <EnRouteWrapper>
                    <PublicPage id="su-di-noi" />
                  </EnRouteWrapper>
                </PublicRouteWrapper>
              }
            />
            <Route
              path="/en/info/:id"
              element={
                <PublicRouteWrapper>
                  <EnRouteWrapper>
                    <PublicPage id="dynamic" />
                  </EnRouteWrapper>
                </PublicRouteWrapper>
              }
            />
            <Route 
              path="/" 
              element={
                <PublicRouteWrapper>
                  <PublicHome />
                </PublicRouteWrapper>
              } 
            />
            <Route 
              path="/writers" 
              element={
                <PublicRouteWrapper>
                  <PublicWriters />
                </PublicRouteWrapper>
              } 
            />
            <Route 
              path="/writers/:slug" 
              element={
                <PublicRouteWrapper>
                  <PublicWriterDetail />
                </PublicRouteWrapper>
              } 
            />
            <Route 
              path="/exhibitions" 
              element={
                <PublicRouteWrapper>
                  <PublicExhibitions />
                </PublicRouteWrapper>
              } 
            />
            <Route
              path="/exhibitions/:slug"
              element={
                <PublicRouteWrapper>
                  <PublicExhibitionDetail />
                </PublicRouteWrapper>
              }
            />
            <Route 
              path="/magazine" 
              element={
                <PublicRouteWrapper>
                  <PublicMagazine />
                </PublicRouteWrapper>
              } 
            />
            <Route 
              path="/magazine/:slug" 
              element={
                <PublicRouteWrapper>
                  <PublicArticleDetail />
                </PublicRouteWrapper>
              } 
            />
            <Route 
              path="/assistenza" 
              element={
                <PublicRouteWrapper>
                  <PublicAssistance />
                </PublicRouteWrapper>
              } 
            />
            <Route 
              path="/su-di-noi" 
              element={
                <PublicRouteWrapper>
                  <PublicPage id="su-di-noi" />
                </PublicRouteWrapper>
              } 
            />
            <Route 
              path="/info/:id" 
              element={
                <PublicRouteWrapper>
                  <PublicPage id="dynamic" />
                </PublicRouteWrapper>
              } 
            />
            <Route path="/populate" element={<Populate />} />
            <Route path="/login" element={<Login />} />
            <Route path="/en/login" element={<Login />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="artworks" element={<Artworks />} />
              <Route path="sales" element={<Sales />} />
              <Route path="payments" element={<Payments />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="writers" element={<AdminWriters />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/users" element={<AdminUsers />} />
              <Route path="admin/payments" element={<AdminPayments />} />
              <Route path="admin/sales" element={<AdminSales />} />
              <Route path="admin/contracts" element={<AdminContracts />} />
              <Route path="admin/drive" element={<Artworks />} />
              <Route path="admin/media" element={<AdminMedia />} />
              <Route path="admin/writers" element={<AdminWriters />} />
              <Route path="admin/exhibitions" element={<AdminExhibitions />} />
              <Route path="admin/articles" element={<AdminArticles />} />
              <Route path="admin/pages" element={<AdminPages />} />
              <Route path="admin/seo" element={<AdminSEO />} />
              <Route path="admin/newsletter" element={<AdminNewsletter />} />
              <Route path="admin/faq" element={<AdminHelp />} />
              <Route path="profile" element={<Profile />} />
              <Route path="help" element={<Help />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </I18nProvider>
      </PublicDataProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
