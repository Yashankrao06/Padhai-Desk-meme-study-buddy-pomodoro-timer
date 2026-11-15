import type { StudyTheme } from '../types/study';

interface AtmosphereLayerProps {
  theme: StudyTheme;
}

const RAIN_DROPS = [
  { left: '6%', delay: '0s', duration: '1.15s', h: 'h-8' },
  { left: '14%', delay: '0.5s', duration: '1.35s', h: 'h-6' },
  { left: '23%', delay: '0.25s', duration: '1.2s', h: 'h-7' },
  { left: '32%', delay: '0.75s', duration: '1.45s', h: 'h-5' },
  { left: '41%', delay: '0.1s', duration: '1.1s', h: 'h-8' },
  { left: '50%', delay: '0.6s', duration: '1.3s', h: 'h-6' },
  { left: '59%', delay: '0.35s', duration: '1.25s', h: 'h-6' },
  { left: '68%', delay: '0.9s', duration: '1.4s', h: 'h-8' },
  { left: '77%', delay: '0.2s', duration: '1.3s', h: 'h-7' },
  { left: '86%', delay: '0.65s', duration: '1.2s', h: 'h-5' },
  { left: '94%', delay: '1.05s', duration: '1.35s', h: 'h-7' },
  { left: '28%', delay: '1.1s', duration: '1.3s', h: 'h-6' },
  { left: '64%', delay: '1.2s', duration: '1.2s', h: 'h-7' },
];

const FIREFLIES = [
  { left: '10%', top: '24%', delay: '0s' },
  { left: '26%', top: '48%', delay: '1.1s' },
  { left: '58%', top: '18%', delay: '2.2s' },
  { left: '80%', top: '36%', delay: '0.7s' },
  { left: '18%', top: '66%', delay: '1.7s' },
  { left: '74%', top: '60%', delay: '2.8s' },
  { left: '89%', top: '52%', delay: '1.4s' },
];

const MOTES = [
  { left: '14%', top: '22%', delay: '0s' },
  { left: '32%', top: '44%', delay: '1.3s' },
  { left: '68%', top: '26%', delay: '2.1s' },
  { left: '82%', top: '54%', delay: '0.8s' },
  { left: '22%', top: '64%', delay: '2.9s' },
  { left: '54%', top: '16%', delay: '1.8s' },
];

const FAIRY_BULBS = [
  { cx: 36, cy: 20, delay: '0s', color: '#FDE49E' },
  { cx: 112, cy: 36, delay: '0.5s', color: '#FFB899' },
  { cx: 192, cy: 34, delay: '1.1s', color: '#FDE49E' },
  { cx: 280, cy: 24, delay: '0.3s', color: '#FFE0B5' },
  { cx: 364, cy: 35, delay: '1.4s', color: '#FFB899' },
  { cx: 452, cy: 32, delay: '0.8s', color: '#FDE49E' },
  { cx: 538, cy: 22, delay: '1.7s', color: '#FFE0B5' },
  { cx: 608, cy: 14, delay: '0.6s', color: '#FDE49E' },
];

export function AtmosphereLayer({ theme }: AtmosphereLayerProps) {
  const { atmosphere } = theme;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Sunbeams & warm floating dust motes */}
      {atmosphere === 'sunbeams' && (
        <>
          <div
            className="absolute -top-12 left-6 h-80 w-28 rotate-[24deg] opacity-30"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,248,226,0.75) 0%, rgba(255,214,158,0) 100%)',
            }}
          />
          <div
            className="absolute -top-10 left-36 h-80 w-20 rotate-[24deg] opacity-25"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,248,226,0.7) 0%, rgba(255,214,158,0) 100%)',
            }}
          />
          {MOTES.map((mote, i) => (
            <span
              key={i}
              className="anim-mote absolute h-1.5 w-1.5 rounded-full bg-amber-100/80"
              style={{ left: mote.left, top: mote.top, animationDelay: mote.delay }}
            />
          ))}
        </>
      )}

      {/* Monsoon window rain streaks */}
      {atmosphere === 'rain' && (
        <div className="absolute inset-0">
          {RAIN_DROPS.map((drop, i) => (
            <span
              key={i}
              className={`anim-rain absolute top-0 block ${drop.h} w-[1.5px] rounded-full bg-sky-100/45`}
              style={{
                left: drop.left,
                animationDelay: drop.delay,
                animationDuration: drop.duration,
              }}
            />
          ))}
        </div>
      )}

      {/* Floating library dust motes */}
      {atmosphere === 'motes' && (
        <>
          {MOTES.map((mote, i) => (
            <span
              key={i}
              className="anim-mote absolute h-1.5 w-1.5 rounded-full bg-amber-200/70"
              style={{ left: mote.left, top: mote.top, animationDelay: mote.delay }}
            />
          ))}
        </>
      )}

      {/* Drifting conservatory fireflies */}
      {atmosphere === 'fireflies' && (
        <>
          {FIREFLIES.map((fly, i) => (
            <span
              key={i}
              className="anim-firefly absolute h-2 w-2 rounded-full bg-lime-200"
              style={{
                left: fly.left,
                top: fly.top,
                animationDelay: fly.delay,
                boxShadow: '0 0 14px rgba(217, 249, 157, 0.95)',
              }}
            />
          ))}
        </>
      )}

      {/* Hostel Night draped fairy lights */}
      {atmosphere === 'fairy-lights' && (
        <svg viewBox="0 0 640 76" className="absolute left-0 right-0 top-0 h-20 w-full opacity-90">
          <path
            d="M0,10 Q150,52 310,24 T640,12"
            fill="none"
            stroke="rgba(165, 155, 205, 0.42)"
            strokeWidth="1.5"
          />
          {FAIRY_BULBS.map((bulb, i) => (
            <g key={i} className="anim-twinkle" style={{ animationDelay: bulb.delay }}>
              <circle cx={bulb.cx} cy={bulb.cy} r="13" fill={bulb.color} opacity="0.2" />
              <circle cx={bulb.cx} cy={bulb.cy} r="3.5" fill={bulb.color} />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
