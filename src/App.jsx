import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useStateContext } from "./contexts/contextProvider";
import { blurFade } from "./transitions";
import Navbar from "./components/navigation/Navbar.jsx";
import SidebarShell from "./components/navigation/SidebarShell.jsx";
import SidebarToggle from "./components/navigation/SidebarToggle.jsx";
import Footer from "./components/Footer.jsx";
import NotFound from "./components/NotFound.jsx";
import { StoreProvider } from "./components/chat/store.jsx";
import ChatShell from "./components/chat/ChatShell.jsx";
import TensorLinkLanding from "./components/landing/TensorLinkLanding.jsx";
import Overview from "./components/docs/Overview.jsx";
import GettingStarted from "./components/docs/GettingStarted.jsx";
import Installation from "./components/docs/Installation.jsx";
import WalletSetup from "./components/docs/WalletSetup.jsx";
import ModelExample from "./components/docs/ModelExample.jsx";
import ApiExample from "./components/docs/ApiExample.jsx";
import Nodes from "./components/docs/Nodes.jsx";
import Mining from "./components/docs/Mining.jsx";
import Community from "./components/docs/Community.jsx";

const EXCLUDED_FROM_SIDEBAR_RESIZE = ["/app"];

const useWindowSizeHandler = (setActiveMenu, pathname) => {
  useEffect(() => {
    const handleResize = () => {
      const excluded = EXCLUDED_FROM_SIDEBAR_RESIZE.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
      );
      if (!excluded) setActiveMenu(window.innerWidth >= 1130);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setActiveMenu, pathname]);
};

function SiteLayout({ activeMenu }) {
  return (
    <div className="relative flex-row min-h-screen bg-zinc-100 dark:bg-[#0A0D13]">
      {/* Same sidebar as the chat app (minus the tabs); see SidebarShell.jsx */}
      <SidebarShell open={activeMenu} style={{ zIndex: 1000000 }} />
      <SidebarToggle />
      <div className={`flex flex-col min-h-screen w-full ${activeMenu ? "pl-[270px]" : ""} transition-[padding] duration-300 ease-out`}>
        {/* The navbar blurs itself (see Navbar.jsx) so its fixed toggle stays put. */}
        <div className="z-40 w-full">
          <Navbar />
        </div>
        <motion.div {...blurFade} className="flex flex-1 flex-col">
          <main className="flex-1 w-full overflow-x-hidden">
            <Outlet />
          </main>
          <Footer />
        </motion.div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { activeMenu, setActiveMenu } = useStateContext();
  const location = useLocation();
  const { pathname } = location;
  useWindowSizeHandler(setActiveMenu, pathname);

  // Only crossing between the two layouts (site <-> app) triggers the exit/enter
  // animation; moving between pages inside one layout doesn't remount it.
  const layoutKey = pathname === "/app" || pathname.startsWith("/app/") ? "app" : "site";

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={layoutKey}>
        <Route element={<SiteLayout activeMenu={activeMenu} />}>
          {/* "/" is the public entry point (main.jsx sends returning app users on to /app).
              "/home" is the same page but never redirected, so it can be refreshed and linked. */}
          <Route index element={<TensorLinkLanding activeMenu={activeMenu} />} />
          <Route path="home" element={<TensorLinkLanding activeMenu={activeMenu} />} />

          <Route path="docs">
            <Route index element={<Overview />} />
            <Route path="overview" element={<Overview />} />
            <Route path="start" element={<GettingStarted />} />
            <Route path="install" element={<Installation />} />
            <Route path="wallet" element={<WalletSetup />} />
            <Route path="model" element={<ModelExample />} />
            <Route path="api" element={<ApiExample />} />
            <Route path="nodes" element={<Nodes />} />
            <Route path="mining" element={<Mining />} />
            <Route path="community" element={<Community />} />
          </Route>
        </Route>

        {/* Chat app owns its own layout entirely (header, tabbed sidebar,
            view switching) — it doesn't use Navbar/Sidebar/Footer at all. */}
        <Route
          path="/app/*"
          element={
            <StoreProvider>
              <ChatShell />
            </StoreProvider>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;
