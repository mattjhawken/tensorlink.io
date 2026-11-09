import { useEffect, useState } from "react";
import { ArrowRight, GitBranch } from "lucide-react";
import useReveal from "../hooks/useReveal";

const headlines = [
  { line1: "Become your own", line2: "AI cloud." },
  { line1: "Pool GPUs to run", line2: "larger models." },
  { line1: "Borrow and lend", line2: "compute." },
];

const ROTATE_MS = 5000;

const pillars = [
  {
    id: "run",
    accent: "#4FD8C4",
    stage: "Private AI",
    title: "Your hardware, reachable from anywhere",
    description:
      "Run any Hugging Face or PyTorch model on your own machine and call it from your phone, laptop, or app through an OpenAI-compatible API.",
  },
  {
    id: "combine",
    accent: "#A78BFA",
    stage: "Distributed AI",
    title: "Pool devices to go bigger",
    description:
      "Link your own machines, or add peers from the public network, into one pool of GPU memory. Run and train models too large for any single device.",
  },
  {
    id: "share",
    accent: "#F2A65A",
    stage: "Open network",
    title: "Tap the public network",
    description:
      "Borrow community compute when you need extra capacity, and earn rewards when your GPU sits idle.",
  },
];


const Glyph = ({ id, accent }) => {
  const common = {
    stroke: accent,
    strokeWidth: 1.5,
    strokeLinecap: "round",
    fill: "none",
  };
  const node = (cx, cy, r, filled = true, opacity = 1) => (
    <circle
      key={`${cx}-${cy}`}
      cx={cx}
      cy={cy}
      r={r}
      stroke={accent}
      strokeWidth={1.5}
      fill={filled ? accent : "none"}
      fillOpacity={filled ? 0.25 : 0}
      opacity={opacity}
    />
  );

  return (
    <svg
      viewBox="0 0 72 40"
      className="w-[72px] h-12"
      aria-hidden="true"
      focusable="false"
    >
      {id === "run" && (
        <>
          {node(14, 20, 7)}
          <line x1="22" y1="20" x2="44" y2="20" strokeDasharray="3 3" {...common} />
          <rect x="46" y="11" width="12" height="18" rx="3" {...common} />
        </>
      )}

      {id === "combine" && (
        <>
          <line x1="14" y1="31" x2="36" y2="2" {...common} />
          <line x1="36" y1="2" x2="58" y2="31" {...common} />
          <line x1="14" y1="31" x2="58" y2="31" {...common} />
          {node(14, 31, 5)}
          {node(36, 2, 5)}
          {node(58, 31, 5)}
        </>
      )}

      {id === "share" && (
        <>
          {[
            [8, 12],
            [8, 30],
            [26, 37],
            [46, 37],
            [64, 30],
            [64, 12],
            [36, 3],
          ].map(([x, y]) => (
            <line
              key={`l-${x}-${y}`}
              x1="36"
              y1="20"
              x2={x}
              y2={y}
              opacity="0.5"
              {...common}
            />
          ))}
          {[
            [8, 12],
            [8, 30],
            [26, 37],
            [46, 37],
            [64, 30],
            [64, 12],
            [36, 3],
          ].map(([x, y]) => node(x, y, 2.5, true, 0.8))}
          {node(36, 20, 5)}
        </>
      )}
    </svg>
  );
};

const Hero = () => {
  const [pillarsRef, pillarsVisible] = useReveal(0.1);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Respect prefers-reduced-motion: show one static headline.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Rotate headlines. Pauses on hover/focus and when motion is reduced.
  useEffect(() => {
    if (paused || reduceMotion) return undefined;
    const id = setInterval(
      () => setActive((i) => (i + 1) % headlines.length),
      ROTATE_MS
    );
    return () => clearInterval(id);
  }, [paused, reduceMotion]);

  return (
    <section className="relative w-full overflow-hidden">
      {/* Ambient network mesh */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-20 pb-16 sm:pt-28 sm:pb-24">
        {/* Eyebrow: previews the page's structure */}
        <div className="tl-hero-anim flex items-center justify-center gap-2 mb-6 animate-[tl-hero-in_0.6s_ease-out]">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#4FD8C4]" />
          <span className="font-['JetBrains_Mono'] text-[11px] tracking-[0.25em] uppercase text-[#8B93A7]">
            Tensorlink
          </span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#A78BFA]" />
        </div>

        <div
          className="tl-hero-anim animate-[tl-hero-in_0.7s_ease-out_0.05s_both]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <h1 className="grid justify-items-center text-center font-['Space_Grotesk'] font-bold text-4xl sm:text-6xl md:text-7xl leading-[1.05] text-gray-900 dark:text-[#EDEFF4] max-w-4xl mx-auto">
            {headlines.map((h, i) => {
              const isActive = i === active;
              return (
                <span
                  key={h.line2}
                  aria-hidden={!isActive}
                  className={`col-start-1 row-start-1 transition-all duration-500 motion-reduce:transition-none ${
                    isActive
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2 pointer-events-none"
                  }`}
                >
                  {h.line1}
                  <br />
                  <span className="bg-gradient-to-r from-[#4FD8C4] to-[#A78BFA] bg-clip-text text-transparent">
                    {h.line2}
                  </span>
                </span>
              );
            })}
          </h1>

          {/* Manual headline selector */}
          <div
            className="flex items-center justify-center gap-1 mt-5"
            role="group"
            aria-label="Choose headline"
          >
            {headlines.map((h, i) => (
              <button
                key={h.line2}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show headline: ${h.line1} ${h.line2}`}
                aria-pressed={i === active}
                className="p-1.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4FD8C4]"
              >
                <span
                  className="block h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none"
                  style={{
                    width: i === active ? 24 : 6,
                    backgroundColor:
                      i === active ? "#4FD8C4" : "rgba(154,162,180,0.4)",
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Static subhead: describes all three pillars whichever title is showing */}
        <p className="tl-hero-anim text-center text-[#9AA2B4] text-base sm:text-lg max-w-2xl mx-auto mt-6 leading-relaxed animate-[tl-hero-in_0.7s_ease-out_0.1s_both]">
          Tensorlink is an open-source Python library and peer-to-peer network.
          Serve models from your own devices, combine them into bigger
          clusters, and tap shared community compute when you need it.
        </p>

        {/* CTAs: one primary, one secondary, one quiet */}
        <div className="tl-hero-anim flex flex-wrap items-center justify-center gap-3 mt-9 animate-[tl-hero-in_0.7s_ease-out_0.15s_both]">
          <a
            href="/app"
            className="group inline-flex items-center gap-2 px-6 py-3 bg-[#4FD8C4] hover:bg-[#6EE2D1] text-[#0A0D13] font-medium rounded-full transition-colors no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0D13]"
          >
            Launch App
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>

          <a
            href="/docs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-transparent hover:bg-white/5 text-[#EDEFF4] font-medium rounded-full border border-white/20 transition-colors no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4FD8C4]"
          >
            Read the docs
          </a>

          <a
            href="https://github.com/tensorlink-lab/tensorlink"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-3 text-[#9AA2B4] hover:text-[#EDEFF4] font-medium rounded-full transition-colors no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4FD8C4]"
          >
            <GitBranch size={16} />
            GitHub
          </a>
        </div>

        {/* The three pillars */}
        <div
          ref={pillarsRef}
          className="grid md:grid-cols-3 gap-5 mt-20 max-w-6xl mx-auto"
        >
          {pillars.map((pillar, i) => (
            <div
              key={pillar.id}
              style={{
                transitionDelay: pillarsVisible ? `${i * 120}ms` : "0ms",
                borderColor: `${pillar.accent}33`,
              }}
              className={`relative rounded-2xl border bg-white/[0.03] backdrop-blur-sm p-6 sm:p-7 transition-all duration-700 hover:bg-white/[0.05] ${
                pillarsVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              <Glyph id={pillar.id} accent={pillar.accent} />

              <span
                className="block font-['JetBrains_Mono'] text-xs mt-5"
                style={{ color: pillar.accent }}
              >
                {pillar.stage}
              </span>

              <h3 className="font-['Space_Grotesk'] font-semibold text-xl text-[#EDEFF4] mt-2 mb-3 leading-snug">
                {pillar.title}
              </h3>

              <p className="text-sm text-[#9AA2B4] leading-relaxed mb-5">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes tl-hero-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tl-hero-anim { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
};

export default Hero;