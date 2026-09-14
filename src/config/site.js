export const HOSTNAME = typeof window !== "undefined" ? window.location.hostname : "";

export const IS_TENSORLINK =
  import.meta.env.VITE_SITE === "tensorlink" ||
  HOSTNAME === "tensorlink.io" ||
  HOSTNAME === "www.tensorlink.io";

export const SITE = IS_TENSORLINK ? "tensorlink" : "smartnodes";

const SMARTNODES_URL = import.meta.env.VITE_SMARTNODES_URL || "https://smartnodes.ca";
const TENSORLINK_URL = import.meta.env.VITE_TENSORLINK_URL || "https://tensorlink.io";

// Returns a same-site relative path ("docs/overview") if `site` matches the
// current domain, or a full cross-domain URL if it doesn't.
export const crossLink = (site, path = "") => {
  if (site === SITE) return path;
  const base = site === "tensorlink" ? TENSORLINK_URL : SMARTNODES_URL;
  return path ? `${base}/${path}` : base;
};

export const isExternal = (site) => site !== SITE;