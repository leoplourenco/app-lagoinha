export function GoldWaves() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 120% 80% at 10% -10%, rgba(197,147,76,0.55), transparent 55%), radial-gradient(ellipse 90% 70% at 90% 0%, rgba(168,112,40,0.45), transparent 50%)',
        }}
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full opacity-70"
        viewBox="0 0 390 160"
        preserveAspectRatio="none"
      >
        <path
          d="M0 90C60 40 110 130 180 70C250 10 300 100 390 40V0H0Z"
          fill="url(#g1)"
          opacity="0.55"
        />
        <path
          d="M0 120C80 70 140 150 210 95C280 40 330 120 390 70V160H0Z"
          fill="url(#g2)"
          opacity="0.35"
        />
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="390" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C5934C" />
            <stop offset="1" stopColor="#8B5E2B" />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="390" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A87028" />
            <stop offset="1" stopColor="#C5934C" />
          </linearGradient>
        </defs>
      </svg>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-36"
        style={{
          background:
            'radial-gradient(ellipse 100% 80% at 80% 120%, rgba(197,147,76,0.4), transparent 55%), radial-gradient(ellipse 80% 70% at 10% 110%, rgba(139,94,43,0.35), transparent 50%)',
        }}
      />
    </>
  )
}
