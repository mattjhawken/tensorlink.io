import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";

const CLOUD = "#F2A65A";
const LOCAL = "#4FD8C4";

const Chip = ({ children, color, dim = false }) => (
  <span
    className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-['JetBrains_Mono']"
    style={{
      color,
      background: `${color}${dim ? "12" : "1A"}`,
      border: `1px solid ${color}${dim ? "26" : "40"}`,
    }}
  >
    {children}
  </span>
);

// One horizontal data-flow row: You -> destination, plus what ends up stored there.
const FlowRow = ({ title, color, destination, caption, chips, muted = false }) => (
  <div
    className="rounded-2xl border bg-white/[0.03] backdrop-blur-sm p-5 sm:p-6"
    style={{ borderColor: `${color}${muted ? "26" : "40"}` }}
  >
    <p className="font-['Space_Grotesk'] font-semibold text-base text-[#EDEFF4]">
      {title}
    </p>

    <div className="mt-4 flex items-center gap-3 sm:gap-4">
      {/* Source */}
      <div className="shrink-0 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-sm text-[#EDEFF4]">
        You
      </div>

      {/* Link */}
      <svg
        viewBox="0 0 80 12"
        className="h-3 flex-1 min-w-[40px]"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <line
          x1="0"
          y1="6"
          x2="72"
          y2="6"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="3 3"
        />
        <path
          d="M70 1.5 L78 6 L70 10.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Destination */}
      <div
        className="shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-medium"
        style={{
          color,
          background: `${color}1F`,
          border: `1px solid ${color}66`,
        }}
      >
        {destination}
      </div>
    </div>

    <p className="mt-4 text-xs leading-relaxed text-[#9AA2B4]">{caption}</p>

    <div className="mt-3 flex flex-wrap gap-2">
      {chips.map((c) => (
        <Chip key={c} color={color} dim={muted}>
          {c}
        </Chip>
      ))}
    </div>
  </div>
);

const DataPrivacy = () => {
  const [sectionRef, visible] = useReveal(0.15);

  return (
    <section className="relative w-full py-16 sm:py-24">
      <div
        ref={sectionRef}
        className={`max-w-6xl mx-auto px-4 sm:px-8 transition-all duration-700 motion-reduce:transition-none ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* Argument */}
          <div>
            <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl leading-[1.1] text-[#EDEFF4]">
              Stop giving your data to cloud providers.
            </h2>

            <p className="mt-5 text-[#9AA2B4] text-sm sm:text-base leading-relaxed max-w-lg">
              Most AI today runs through a handful of centralized cloud
              providers. They store your chat history and every file you hand
              them. Whether that data is used to train their models or kept
              around for other reasons is up for debate, but the fact that it
              all sits on their servers is concerning, to say the least.
            </p>

            <p className="mt-4 text-[#EDEFF4] text-base sm:text-lg font-medium leading-relaxed max-w-lg">
              So what are the alternatives? Run the models yourself.
            </p>

            <p className="mt-4 text-[#9AA2B4] text-sm sm:text-base leading-relaxed max-w-lg">
              Tensorlink lets you serve models from your own hardware and use
              them from anywhere, through the same OpenAI-compatible API you
              already know. In private mode, your prompts only ever reach
              machines you control.
            </p>

            <Link
              to="/docs/nodes"
              className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium text-[#4FD8C4] hover:text-[#6FE8D6] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4FD8C4] rounded"
            >
              Set up a private node
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          {/* Comparison */}
          <div className="flex flex-col gap-4">
            <FlowRow
              title="Hosted AI"
              color={CLOUD}
              destination="Provider's servers"
              caption="Everything you send is stored on infrastructure you don't control."
              chips={["Chat history", "Uploaded files", "Retention you can't verify"]}
              muted
            />
            <FlowRow
              title="Tensorlink private mode"
              color={LOCAL}
              destination="Your hardware"
              caption="Requests are routed only to your own machines. Nothing leaves your network."
              chips={["Your laptop", "Your GPU", "Your rules"]}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataPrivacy;
