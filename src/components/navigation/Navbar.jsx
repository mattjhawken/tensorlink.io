import { useState, useEffect } from "react";
import { close, logo, menu, dark_logo, logo_small } from "../../assets";
import { navLinks } from "../../constants";
import { useStateContext } from "../../contexts/contextProvider";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { blurFade } from "../../transitions";
import { SIDEBAR_WIDTH } from "./SidebarShell.jsx";
import { IS_TENSORLINK, SITE } from "../../config/site";

// Same-origin links go through the router (client-side navigation, so route
// transitions can animate); everything else stays a normal anchor.
function NavAnchor({ href = "", ...props }) {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin === window.location.origin) {
      // The landing page lives at /home; "/" only forwards returning users to /app.
      const path = url.pathname === "/" ? "/home" : url.pathname;
      return <Link to={path + url.search + url.hash} {...props} />;
    }
  } catch {
    // fall through to a plain anchor
  }
  return <a href={href} {...props} />;
}


const COMPACT_BREAKPOINT = 768;

const useIsCompactNav = (sidebarOpen) => {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const evaluate = () => {
      const availableWidth = window.innerWidth - (sidebarOpen ? SIDEBAR_WIDTH : 0);
      setIsCompact(availableWidth < COMPACT_BREAKPOINT);
    };
    evaluate();
    window.addEventListener("resize", evaluate);
    return () => window.removeEventListener("resize", evaluate);
  }, [sidebarOpen]);

  return isCompact;
};

const Navbar = () => {
  const [active, setActive] = useState(false);
  const [toggle, setToggle] = useState(false);
  const [theme, setTheme] = useState("dark");
  const { activeMenu } = useStateContext();
  const isCompact = useIsCompactNav(activeMenu);

  useEffect(() => {
    localStorage.removeItem("theme");
    setTheme("dark");
    document.documentElement.classList.add("dark");
  }, []);

  const logoSrc = logo;
  const tensorlinkLogoSrc = dark_logo;
  const smallLogoSrc = logo_small;

  return (
    <>

      <motion.nav {...blurFade} className="w-full flex z-20 pt-2 sm:pt-4 px-5 ml-1 md:ml-5 justify-between items-center" style={{ maxWidth: "1440px", margin: "0 auto", zIndex: 100000 }}>
        {/* Logo - always visible, same size and position regardless of sidebar state */}
        <NavAnchor
          href="/home"
          className="flex flex-row bg-slate-300 rounded-xl px-3 py-0"
          style={{ zIndex: 100000 }}
        >
          <img src={IS_TENSORLINK ? tensorlinkLogoSrc : logoSrc} alt="task" className={`w-auto h-auto max-w-[235px] max-h-[150px] ${isCompact ? "hidden" : "block"}
              ${IS_TENSORLINK ? "-mx-2 -my-1" : ""}`} />
          <img src={smallLogoSrc} alt="task" className={`w-[60px] h-[60px] ${isCompact ? "block" : "hidden"} mb-1 my-1.5`} />
        </NavAnchor>

      {/* Desktop navbar */}
      <ul className={`list-none ${isCompact ? "hidden" : "flex"} justify-end px-5 py-1 items-center flex-1`}>
        {navLinks.map((nav, index) => (
          <li
            key={nav.id}
            className={`font-poppins font-normal cursor-pointer text-[16px] ${
              active === nav.title ? "dark:text-white text-black" : "dark:text-dimWhite text-gray-500"
            } ${index === navLinks.length - 1 ? "mr-0" : "mr-10"} ${nav.title === "Dashboard" ? "transition-transform duration-300 hover:scale-105" : ""}`}
            onClick={() => setActive(nav.title)}
            style={{ zIndex: 10000 }}
          >
            {nav.title === "GitHub" ? (
              <NavAnchor href="https://github.com/tensorlink-lab">{nav.title}</NavAnchor>
            ) : nav.site ? (
              <NavAnchor
                href={nav.link}
                className={`transition-opacity duration-200 ${nav.site === SITE ? "opacity-100 font-medium" : "opacity-70 hover:opacity-100"}`}
              >
                {nav.title}
              </NavAnchor>
          ) : nav.title == "Launch App" ? (
              <NavAnchor href={nav.link} className="group relative inline-block rounded-lg">
                {/* optional soft glow, only shows on hover */}
                <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300"></span>

                {/* the gradient itself — this becomes the "border" via padding */}
                <span className="relative z-10 block rounded-lg p-[1.5px] bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 bg-[length:200%_200%] animate-gradient-x">
                  {/* solid interior — swap these for black/zinc/white as you like */}
                  <span className="flex items-center justify-center rounded-[7px] px-4 py-2 font-semibold text-black dark:text-white bg-white dark:bg-zinc-900 transition-colors duration-300">
                    {nav.title}
                  </span>
                </span>
              </NavAnchor>
            ) : (
              <NavAnchor href={`/${nav.id}`}>{nav.title}</NavAnchor>
            )}
          </li>
        ))}
        {/* <div className="ml-5" style={{ zIndex: 100000 }}>
          <ThemeButton className="px-20" />
        </div> */}
      </ul>

      {/* Mobile menu */}
      <div className={`${isCompact ? "flex" : "hidden"} flex-1 px-5 justify-end items-center`} style={{ zIndex: 100000000 }}>
        <img
          src={toggle ? close : menu}
          alt="menu"
          className="w-[24px] h-[24px] object-contain cursor-pointer"
          onClick={() => setToggle(!toggle)}
        />
        <div
          className={`
            absolute top-16 right-0 mx-4 mt-4 min-w-[140px]
            border border-gray-300 p-6 dark:bg-zinc-700 bg-slate-200
            rounded-xl shadow-xl z-30
            transform origin-top transition-all duration-300 ease-out
            ${toggle ? "scale-y-100 opacity-100 pointer-events-auto" : "scale-y-0 opacity-0 pointer-events-none"}
          `}
        >
          <ul className="list-none flex flex-col items-start">
            {navLinks.map((nav) => (
              <li
                key={nav.id}
                className={`font-poppins font-medium cursor-pointer text-[16px] ${
                  active === nav.title ? "dark:text-white" : "dark:text-dimWhite"
                } mb-4 z-50`}
                onClick={() => setActive(nav.title)}
              >
                {nav.title === "GitHub" ? (
                  <NavAnchor href="https://github.com/tensorlink-lab">{nav.title}</NavAnchor>
                ) : nav.site ? (
                  <NavAnchor
                    href={nav.link}
                    className={nav.site === SITE ? "font-medium" : "opacity-70"}
                  >
                    {nav.title}
                  </NavAnchor>
                ) : nav.title == "Dashboard" ? (
                  <NavAnchor href={nav.link}>
                    {nav.title}
                  </NavAnchor>
                ) : (
                  <NavAnchor href={`/${nav.id}`}>{nav.title}</NavAnchor>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
