// Cursive "L" drawn in one stroke, trailing off as a dashed thread that a pair
// of scissors snips. Animation lives in index.css (.logo-*), so it also works
// as a plain static mark when the user prefers reduced motion.
export default function Logo({ className = '' }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 76 48"
      fill="none"
      className={`logo overflow-visible ${className}`}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        className="logo-l"
        pathLength="1"
        d="M7 37 C13 35 21 19 25 10 C28 3 34 5 31 13 C27 23 18 34 18 38 C18 42 25 41 31 38 C35 36 38 35 42 36"
        stroke="#e6c65c"
        strokeWidth="3"
      />
      <path
        className="logo-thread"
        d="M42 36 L52 36"
        stroke="#c9a227"
        strokeWidth="1.6"
        strokeDasharray="2.5 3"
      />
      <g className="logo-scissors" transform="translate(60 36)">
        <g className="logo-blade logo-blade-a">
          <path d="M0 0 L-15 -2.6 L-15 0 Z" fill="#f4ead9" stroke="#f4ead9" strokeWidth="0.8" />
          <path d="M0 0 L7 5" stroke="#c9a227" strokeWidth="1.8" />
          <circle cx="10.5" cy="7.6" r="3.4" stroke="#c9a227" strokeWidth="1.8" />
        </g>
        <g className="logo-blade logo-blade-b">
          <path d="M0 0 L-15 2.6 L-15 0 Z" fill="#f4ead9" stroke="#f4ead9" strokeWidth="0.8" />
          <path d="M0 0 L7 -5" stroke="#c9a227" strokeWidth="1.8" />
          <circle cx="10.5" cy="-7.6" r="3.4" stroke="#c9a227" strokeWidth="1.8" />
        </g>
        <circle r="1.4" fill="#200406" stroke="#c9a227" strokeWidth="1" />
      </g>
    </svg>
  )
}
