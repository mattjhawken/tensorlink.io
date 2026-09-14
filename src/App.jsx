import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { useStateContext } from "./contexts/contextProvider";
import Navbar from "./components/navigation/Navbar.jsx";
import Sidebar from "./components/navigation/Sidebar.jsx";
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
      {activeMenu && <Sidebar />}
      <div className={`flex flex-col min-h-screen w-full ${activeMenu ? "pl-[245px]" : ""} transition-all duration-300 ease-out`}>
        <div className="z-40 w-full">
          <Navbar />
        </div>
        <main className="flex-1 w-full overflow-x-hidden">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

function AppRoutes() {
  const { activeMenu, setActiveMenu } = useStateContext();
  const { pathname } = useLocation();
  useWindowSizeHandler(setActiveMenu, pathname);

  return (
    <Routes>
      <Route element={<SiteLayout activeMenu={activeMenu} />}>
        <Route index element={<TensorLinkLanding activeMenu={activeMenu} />} />

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
  );
}

const App = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;
