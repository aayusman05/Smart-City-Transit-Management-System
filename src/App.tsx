import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'search' | 'results' | 'detail'
type FilterKey = 'fastest' | 'cheapest' | 'fewest'
type ModeKey = 'walk' | 'metro' | 'bus' | 'train' | 'cab'

interface Leg {
  mode: ModeKey
  from: string
  to: string
  duration: string
  fare: number
  stops?: number
  line?: string
  detail?: string
}

interface Route {
  id: number
  modes: ModeKey[]
  totalTime: string
  totalMinutes: number
  totalFare: number
  transfers: number
  isCheapest?: boolean
  isFastest?: boolean
  isFewest?: boolean
  legs: Leg[]
  mapPath: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROUTE_COLORS: Record<number, string> = {
  1: '#0D9488',
  2: '#059669',
  3: '#EA580C',
  4: '#2563EB',
}

const MODE_CONFIG: Record<ModeKey, { lightText: string; lightBg: string; darkText: string; darkBg: string }> = {
  walk:  { lightText: '#475569', lightBg: '#F1F5F9', darkText: '#94A3B8', darkBg: 'rgba(148,163,184,0.1)' },
  metro: { lightText: '#1E3A8A', lightBg: '#DBEAFE', darkText: '#60A5FA', darkBg: 'rgba(96,165,250,0.1)' },
  bus:   { lightText: '#6B21A8', lightBg: '#F3E8FF', darkText: '#C084FC', darkBg: 'rgba(192,132,252,0.1)' },
  train: { lightText: '#92400E', lightBg: '#FEF3C7', darkText: '#FBB222', darkBg: 'rgba(251,178,34,0.1)'  },
  cab:   { lightText: '#991B1B', lightBg: '#FEE2E2', darkText: '#F87171', darkBg: 'rgba(248,113,113,0.1)' },
}

const MODE_LABELS: Record<ModeKey, string> = {
  walk: 'Walk', metro: 'Metro', bus: 'Bus', train: 'Train', cab: 'Cab',
}

const ROUTES: Route[] = [
  {
    id: 1, modes: ['walk', 'metro', 'bus'],
    totalTime: '38 min', totalMinutes: 38, totalFare: 42, transfers: 1, isFastest: true,
    mapPath: 'M 50 222 C 88 198 128 148 178 118 C 228 88 278 66 340 38',
    legs: [
      { mode: 'walk',  from: 'Connaught Place',    to: 'Rajiv Chowk Metro', duration: '4 min',  fare: 0,  detail: '350 m' },
      { mode: 'metro', from: 'Rajiv Chowk',        to: 'Hauz Khas',         duration: '22 min', fare: 30, stops: 7,  line: 'Yellow Line' },
      { mode: 'bus',   from: 'Hauz Khas Metro',    to: 'IIT Delhi Gate',    duration: '12 min', fare: 12, line: 'Route 534' },
    ],
  },
  {
    id: 2, modes: ['metro', 'metro'],
    totalTime: '52 min', totalMinutes: 52, totalFare: 30, transfers: 1, isCheapest: true,
    mapPath: 'M 50 222 C 78 212 118 202 162 192 C 212 180 258 132 294 86 C 314 64 330 50 340 38',
    legs: [
      { mode: 'metro', from: 'Rajiv Chowk',        to: 'Central Secretariat', duration: '8 min',  fare: 15, stops: 3,  line: 'Yellow Line' },
      { mode: 'metro', from: 'Central Secretariat', to: 'IIT',                 duration: '44 min', fare: 15, stops: 11, line: 'Violet Line' },
    ],
  },
  {
    id: 3, modes: ['cab'],
    totalTime: '25 min', totalMinutes: 25, totalFare: 185, transfers: 0,
    mapPath: 'M 50 222 C 128 188 208 132 252 92 C 288 62 320 50 340 38',
    legs: [
      { mode: 'cab', from: 'Connaught Place', to: 'IIT Delhi Gate', duration: '25 min', fare: 185, detail: 'via Ring Road' },
    ],
  },
  {
    id: 4, modes: ['walk', 'metro', 'walk'],
    totalTime: '44 min', totalMinutes: 44, totalFare: 35, transfers: 0, isFewest: true,
    mapPath: 'M 50 222 C 82 202 112 178 158 152 C 208 124 268 80 340 38',
    legs: [
      { mode: 'walk',  from: 'Connaught Place',    to: 'Rajiv Chowk',        duration: '4 min',  fare: 0,  detail: '350 m' },
      { mode: 'metro', from: 'Rajiv Chowk',        to: 'IIT',                duration: '35 min', fare: 35, stops: 9, line: 'Yellow Line' },
      { mode: 'walk',  from: 'IIT Metro Station',  to: 'IIT Delhi Gate',     duration: '5 min',  fare: 0,  detail: '400 m' },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function modeColor(mode: ModeKey, dark: boolean) {
  const c = MODE_CONFIG[mode]
  return { text: dark ? c.darkText : c.lightText, bg: dark ? c.darkBg : c.lightBg }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconSun({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7 1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91 1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/>
    </svg>
  )
}

function IconMoon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
    </svg>
  )
}

function IconPin({ size = 17, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  )
}

function IconSwap({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3 5 6.99h3V14h2V6.99h3L9 3z"/>
    </svg>
  )
}

function IconBack({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    </svg>
  )
}

function IconChevron({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
    </svg>
  )
}

function IconArrow({ size = 13, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
    </svg>
  )
}

function IconClock({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23L12 13.17V7z"/>
    </svg>
  )
}

function ModeIcon({ mode, size = 15 }: { mode: ModeKey; size?: number }) {
  switch (mode) {
    case 'walk':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.49 5.48c.57 0 1.03-.46 1.03-1.03s-.46-1.03-1.03-1.03-1.03.46-1.03 1.03.46 1.03 1.03 1.03zm-3.91 11.03 1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.5-.6-1.91 6.51-3.59-.51-.5 1.96 3.5.54z"/>
        </svg>
      )
    case 'metro':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8zm-2-9.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S14.33 8 13.5 8 12 7.33 12 6.5zm-5 0c0-.83.67-1.5 1.5-1.5S10 5.67 10 6.5 9.33 8 8.5 8 7 7.33 7 6.5z"/>
        </svg>
      )
    case 'bus':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM19 10H5V6h14v4z"/>
        </svg>
      )
    case 'train':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5H8l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5v-9.5c0-3.5-4-4-8-4zm-4 9V7h8v4H8zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
        </svg>
      )
    case 'cab':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      )
  }
}

// ─── City Map ─────────────────────────────────────────────────────────────────

function CityMap({
  dark,
  showRoute,
  activeRouteId,
  hoveredRouteId,
}: {
  dark: boolean
  showRoute: boolean
  activeRouteId?: number | null
  hoveredRouteId?: number | null
}) {
  const bg        = dark ? '#090F1C' : '#E8EFF6'
  const street    = dark ? '#111A2A' : '#CDD6E2'
  const streetSub = dark ? '#0E1624' : '#D8E1EC'
  const building  = dark ? '#152030' : '#C5CFD9'
  const park      = dark ? '#0B2416' : '#BDE8CB'
  const water     = dark ? '#091624' : '#B8D8EE'
  const metroline = dark ? '#192B42' : '#AABFCF'

  const activeRoute = ROUTES.find(r => r.id === (hoveredRouteId ?? activeRouteId))
  const displayRoute = activeRoute ?? (showRoute ? ROUTES[0] : null)

  return (
    <svg viewBox="0 0 400 260" style={{ display: 'block', width: '100%', height: '100%' }}>
      <rect width="400" height="260" fill={bg} />

      {/* Water */}
      <path
        d="M 0 208 Q 52 200 84 190 Q 114 180 128 167 Q 143 152 138 138 Q 133 124 148 114 Q 164 104 181 109 Q 200 116 219 111 Q 240 105 262 97 Q 280 90 300 85 Q 340 78 400 74"
        fill="none" stroke={water} strokeWidth="14" strokeLinecap="round"
      />

      {/* Major streets */}
      {[46, 106, 170, 230].map(y => <line key={`mh${y}`} x1="0" y1={y} x2="400" y2={y} stroke={street} strokeWidth="6" />)}
      {[66, 142, 218, 296, 358].map(x => <line key={`mv${x}`} x1={x} y1="0" x2={x} y2="260" stroke={street} strokeWidth="6" />)}

      {/* Minor streets */}
      {[22, 76, 138, 200, 248].map(y => <line key={`sh${y}`} x1="0" y1={y} x2="400" y2={y} stroke={streetSub} strokeWidth="2.5" opacity="0.55" />)}
      {[32, 104, 180, 256, 326, 382].map(x => <line key={`sv${x}`} x1={x} y1="0" x2={x} y2="260" stroke={streetSub} strokeWidth="2.5" opacity="0.55" />)}

      {/* Parks */}
      <rect x="75" y="116" width="55" height="44" rx="6" fill={park} />
      <rect x="222" y="50" width="64" height="44" rx="6" fill={park} />
      <rect x="302" y="162" width="46" height="38" rx="5" fill={park} />

      {/* Buildings */}
      {([
        [8,8,46,28],[10,56,40,34],[8,120,44,38],
        [76,8,50,28],[82,54,40,30],
        [150,8,52,32],[154,56,44,38],[150,120,54,38],
        [226,116,50,42],[230,172,50,40],
        [306,8,40,28],[310,56,42,30],[308,118,38,28],
        [366,8,28,46],[364,86,28,50],[368,172,22,36],
        [75,174,54,42],[78,234,42,18],
        [154,178,50,40],[158,234,40,18],
        [226,8,38,28],
      ] as number[][]).map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="3" fill={building} />
      ))}

      {/* Background metro lines */}
      <path d="M 0 248 L 400 2"   fill="none" stroke={metroline} strokeWidth="2.5" strokeDasharray="8,5" />
      <path d="M 0 130 L 400 102" fill="none" stroke={metroline} strokeWidth="2"   strokeDasharray="8,5" />

      {/* Metro station dots */}
      {[[66,238],[142,196],[218,152],[296,110],[358,70]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3.5" fill={metroline} />
      ))}

      {/* Active route */}
      {displayRoute && (
        <g>
          {/* Glow shadow */}
          <path d={displayRoute.mapPath} fill="none" stroke={dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)'} strokeWidth="9" strokeLinecap="round" />
          {/* Route line */}
          <path d={displayRoute.mapPath} fill="none" stroke={ROUTE_COLORS[displayRoute.id]} strokeWidth="3.5" strokeLinecap="round" className="route-path" />
          {/* Shimmer */}
          <path d={displayRoute.mapPath} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5,18" />

          {/* Transfer waypoints */}
          {displayRoute.legs.length > 1 && (
            <g>
              <circle cx="154" cy="150" r="6" fill="white" stroke={ROUTE_COLORS[displayRoute.id]} strokeWidth="2.5" />
              <circle cx="154" cy="150" r="2.5" fill={ROUTE_COLORS[displayRoute.id]} />
            </g>
          )}
          {displayRoute.legs.length > 2 && (
            <g>
              <circle cx="228" cy="110" r="6" fill="white" stroke={ROUTE_COLORS[displayRoute.id]} strokeWidth="2.5" />
              <circle cx="228" cy="110" r="2.5" fill={ROUTE_COLORS[displayRoute.id]} />
            </g>
          )}
        </g>
      )}

      {/* Origin pin */}
      {showRoute && (
        <g>
          <circle cx="50" cy="222" r="10" fill={dark ? '#1B3A6B' : '#0C1F3F'} />
          <circle cx="50" cy="222" r="4" fill="white" />
          <rect x="26" y="235" width="48" height="17" rx="4" fill={dark ? 'rgba(15,25,41,0.92)' : 'rgba(255,255,255,0.94)'} />
          <text x="50" y="246.5" textAnchor="middle" fontSize="7.5" fontWeight="600" fill={dark ? '#8EA3BF' : '#334155'} fontFamily="Inter,sans-serif">Connaught Pl.</text>
        </g>
      )}

      {/* Destination pin */}
      {showRoute && (
        <g>
          <circle cx="340" cy="38" r="10" fill="#0D9488" />
          <circle cx="340" cy="38" r="4" fill="white" />
          <rect x="316" y="52" width="48" height="17" rx="4" fill={dark ? 'rgba(15,25,41,0.92)' : 'rgba(255,255,255,0.94)'} />
          <text x="340" y="63.5" textAnchor="middle" fontSize="7.5" fontWeight="600" fill={dark ? '#8EA3BF' : '#334155'} fontFamily="Inter,sans-serif">IIT Delhi</text>
        </g>
      )}
    </svg>
  )
}

// ─── Search Screen ────────────────────────────────────────────────────────────

function SearchScreen({
  dark, onToggleDark, from, to, datetime,
  setFrom, setTo, setDatetime, onSearch,
}: {
  dark: boolean; onToggleDark: () => void
  from: string; to: string; datetime: string
  setFrom: (v: string) => void; setTo: (v: string) => void; setDatetime: (v: string) => void
  onSearch: () => void
}) {
  const swap = () => { const t = from; setFrom(to); setTo(t) }
  const hasRoute = from.trim() !== '' && to.trim() !== ''

  const cardBg  = dark ? '#0F1929' : '#FFFFFF'
  const inputBg = dark ? '#0A111D' : '#F4F7FB'
  const iborder = dark ? '#1A2D44' : '#DDE3EE'
  const textM   = dark ? '#E8F0FE' : '#0F172A'
  const textS   = dark ? '#8EA3BF' : '#64748B'
  const divider = dark ? '#1A2D44' : '#E2E8F0'
  const appBg   = dark ? '#080E1A' : '#F4F7FB'

  return (
    <div style={{ backgroundColor: appBg, minHeight: '100vh' }}>
      {/* Header */}
      <div
        className="px-5 pt-9 pb-8"
        style={{ background: dark ? 'linear-gradient(150deg,#0A1428 0%,#0C1D3A 100%)' : 'linear-gradient(150deg,#0C1F3F 0%,#1A3B72 60%,#0F2B5B 100%)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div style={{ backgroundColor: '#0D9488', borderRadius: '8px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconPin size={13} color="white" />
              </div>
              <span style={{ color: '#0D9488', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                SmartCity Transit
              </span>
            </div>
            <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
              Plan Your Journey
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: '13px', marginTop: '6px' }}>
              Metro · Bus · Train · Cab — all in one fare
            </p>
          </div>
          <button
            onClick={onToggleDark}
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: 'rgba(255,255,255,0.55)', marginTop: '2px', flexShrink: 0 }}
          >
            {dark ? <IconSun /> : <IconMoon />}
          </button>
        </div>
      </div>

      {/* Search card */}
      <div className="px-4" style={{ marginTop: '-20px' }}>
        <div style={{ backgroundColor: cardBg, border: `1px solid ${divider}`, borderRadius: '18px', padding: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
          {/* From */}
          <div
            style={{ backgroundColor: inputBg, border: `1.5px solid ${from ? '#0D9488' : iborder}`, borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'text', transition: 'border-color 0.15s' }}
          >
            <IconPin size={17} color={from ? '#0D9488' : textS} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: from ? '#0D9488' : textS, marginBottom: '2px' }}>From</div>
              <input
                value={from}
                onChange={e => setFrom(e.target.value)}
                placeholder="Enter starting point"
                style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '14px', fontWeight: 500, color: textM, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
          </div>

          {/* Swap */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: divider }} />
            <button
              onClick={swap}
              style={{ backgroundColor: dark ? '#132035' : '#EBF0FA', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#4A7FCC' : '#0C1F3F', transition: 'transform 0.25s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(180deg)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
            >
              <IconSwap />
            </button>
            <div style={{ flex: 1, height: '1px', backgroundColor: divider }} />
          </div>

          {/* To */}
          <div
            style={{ backgroundColor: inputBg, border: `1.5px solid ${to ? '#EF4444' : iborder}`, borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'text', marginBottom: '14px', transition: 'border-color 0.15s' }}
          >
            <IconPin size={17} color={to ? '#EF4444' : textS} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: to ? '#EF4444' : textS, marginBottom: '2px' }}>To</div>
              <input
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="Enter destination"
                style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '14px', fontWeight: 500, color: textM, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
          </div>

          {/* Datetime */}
          <div
            style={{ backgroundColor: inputBg, border: `1.5px solid ${iborder}`, borderRadius: '14px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}
          >
            <IconClock size={15} color={textS} />
            <span style={{ fontSize: '13px', flex: 1, color: textM }}>
              {datetime === 'now' ? 'Leave now' : `+${datetime} from now`}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['now', '30m', '1h', '2h'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setDatetime(t)}
                  style={{
                    backgroundColor: datetime === t ? '#0C1F3F' : (dark ? '#132035' : '#DDE8F5'),
                    color: datetime === t ? '#fff' : textS,
                    border: 'none', borderRadius: '8px', padding: '5px 8px', fontSize: '11px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'background-color 0.15s',
                  }}
                >
                  {t === 'now' ? 'Now' : t}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onSearch}
            style={{
              width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(130deg, #0C1F3F 0%, #1B4080 48%, #0D9488 100%)',
              boxShadow: '0 6px 28px rgba(13,148,136,0.38)',
              color: 'white', fontSize: '15px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              transition: 'opacity 0.2s, transform 0.15s',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.92')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'none')}
          >
            Find Best Routes →
          </button>
        </div>
      </div>

      {/* Map preview */}
      <div className="px-4 mt-4 mb-8">
        <div style={{ height: '210px', borderRadius: '18px', overflow: 'hidden', border: `1px solid ${divider}`, position: 'relative' }}>
          <CityMap dark={dark} showRoute={hasRoute} />
          {!hasRoute && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: dark ? 'rgba(8,14,26,0.5)' : 'rgba(244,247,251,0.5)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill={textS} opacity="0.4">
                <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
              </svg>
              <span style={{ fontSize: '12px', color: textS, textAlign: 'center', paddingLeft: '24px', paddingRight: '24px' }}>
                Enter origin &amp; destination to preview route
              </span>
            </div>
          )}
          {hasRoute && (
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: dark ? 'rgba(13,148,136,0.2)' : 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.32)', borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#0D9488' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D9488' }}>Route preview · ~7.2 km</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Route Card ───────────────────────────────────────────────────────────────

function RouteCard({ route, dark, expanded, onToggle, onSelect, onHover }: {
  route: Route; dark: boolean; expanded: boolean
  onToggle: () => void; onSelect: () => void; onHover: (id: number | null) => void
}) {
  const cardBg  = dark ? '#0F1929' : '#FFFFFF'
  const divider = dark ? '#1A2D44' : '#EBF0F8'
  const textM   = dark ? '#E8F0FE' : '#0F172A'
  const textS   = dark ? '#8EA3BF' : '#64748B'

  const badge = route.isFastest
    ? { label: 'Fastest',          color: '#0D9488', bg: dark ? 'rgba(13,148,136,0.12)'  : '#CCFBF1' }
    : route.isCheapest
    ? { label: 'Best Value',       color: '#059669', bg: dark ? 'rgba(5,150,105,0.12)'   : '#D1FAE5' }
    : route.isFewest
    ? { label: 'Least Transfers',  color: '#2563EB', bg: dark ? 'rgba(37,99,235,0.12)'   : '#DBEAFE' }
    : null

  return (
    <div
      className="fade-up"
      style={{
        backgroundColor: cardBg,
        border: `1.5px solid ${expanded ? '#0D9488' : divider}`,
        borderRadius: '16px', overflow: 'hidden',
        boxShadow: expanded ? '0 0 0 3px rgba(13,148,136,0.1), 0 4px 20px rgba(0,0,0,0.07)' : '0 2px 16px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={() => onHover(route.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div style={{ padding: '16px' }}>
        {/* Mode sequence + badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {route.modes.map((mode, i) => {
              const mc = modeColor(mode, dark)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {i > 0 && <IconArrow size={11} color={textS} />}
                  <div style={{ backgroundColor: mc.bg, color: mc.text, width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ModeIcon mode={mode} size={15} />
                  </div>
                </div>
              )
            })}
          </div>
          {badge && (
            <span style={{ backgroundColor: badge.bg, color: badge.color, fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Metrics + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: textM }}>{route.totalTime}</span>
              <span style={{ fontSize: '12px', color: textS }}>
                {route.transfers === 0 ? 'Direct' : `${route.transfers} transfer${route.transfers > 1 ? 's' : ''}`}
              </span>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: route.isCheapest ? '#059669' : textM }}>₹{route.totalFare}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onToggle}
              style={{ backgroundColor: dark ? '#132035' : '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textS, cursor: 'pointer' }}
            >
              <div style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', display: 'flex' }}>
                <IconChevron />
              </div>
            </button>
            <button
              onClick={onSelect}
              style={{ background: 'linear-gradient(135deg,#0C1F3F,#0D9488)', border: 'none', borderRadius: '12px', padding: '9px 18px', color: 'white', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 2px 14px rgba(13,148,136,0.28)', transition: 'opacity 0.15s' }}
            >
              Select
            </button>
          </div>
        </div>
      </div>

      {/* Expanded legs */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${divider}` }}>
          {route.legs.map((leg, i) => {
            const mc = modeColor(leg.mode, dark)
            return (
              <div
                key={i}
                style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderBottom: i < route.legs.length - 1 ? `1px solid ${divider}` : 'none' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px', minWidth: '28px' }}>
                  <div style={{ backgroundColor: mc.bg, color: mc.text, width: '28px', height: '28px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ModeIcon mode={leg.mode} size={13} />
                  </div>
                  {i < route.legs.length - 1 && (
                    <div style={{ width: '1.5px', flex: 1, marginTop: '4px', backgroundColor: divider, minHeight: '16px' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: mc.text, marginBottom: '2px' }}>
                        {MODE_LABELS[leg.mode]}{leg.line ? ` · ${leg.line}` : ''}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: textM, lineHeight: 1.3 }}>{leg.from}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <IconArrow size={10} color={textS} />
                        <span style={{ fontSize: '12px', color: textS }}>{leg.to}</span>
                      </div>
                      {leg.stops && <div style={{ fontSize: '11px', color: textS, marginTop: '2px' }}>{leg.stops} stops</div>}
                      {leg.detail && <div style={{ fontSize: '11px', color: textS, marginTop: '2px' }}>{leg.detail}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: textM }}>{leg.duration}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: leg.fare === 0 ? '#059669' : textS, marginTop: '2px' }}>
                        {leg.fare === 0 ? 'Free' : `₹${leg.fare}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  dark, onToggleDark, from, to,
  selectedFilter, setSelectedFilter,
  expandedCards, toggleCard, onSelectRoute, onBack,
}: {
  dark: boolean; onToggleDark: () => void
  from: string; to: string
  selectedFilter: FilterKey; setSelectedFilter: (f: FilterKey) => void
  expandedCards: Set<number>; toggleCard: (id: number) => void
  onSelectRoute: (r: Route) => void; onBack: () => void
}) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const cardBg  = dark ? '#0F1929' : '#FFFFFF'
  const textM   = dark ? '#E8F0FE' : '#0F172A'
  const textS   = dark ? '#8EA3BF' : '#64748B'
  const divider = dark ? '#1A2D44' : '#E2E8F0'
  const appBg   = dark ? '#080E1A' : '#F4F7FB'

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'fastest',  label: '⚡ Fastest' },
    { key: 'cheapest', label: '₹ Cheapest' },
    { key: 'fewest',   label: '↔ Fewest' },
  ]

  const sortedRoutes = [...ROUTES].sort((a, b) =>
    selectedFilter === 'fastest' ? a.totalMinutes - b.totalMinutes
    : selectedFilter === 'cheapest' ? a.totalFare - b.totalFare
    : a.transfers - b.transfers
  )

  return (
    <div style={{ backgroundColor: appBg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: dark ? '#0A1428' : '#0C1F3F', padding: '24px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', flexShrink: 0 }}
          >
            <IconBack />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600, color: 'white' }}>
              <span style={{ opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{from || 'Connaught Place'}</span>
              <IconArrow size={13} color="rgba(255,255,255,0.4)" />
              <span style={{ color: '#0D9488', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{to || 'IIT Delhi'}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', marginTop: '2px' }}>
              {ROUTES.length} routes found · Leave now
            </div>
          </div>
          <button
            onClick={onToggleDark}
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', flexShrink: 0 }}
          >
            {dark ? <IconSun /> : <IconMoon />}
          </button>
        </div>
      </div>

      {/* Map strip */}
      <div style={{ height: '160px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <CityMap dark={dark} showRoute={true} hoveredRouteId={hoveredId} />
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {ROUTES.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '999px', backgroundColor: dark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.9)', border: `1px solid ${ROUTE_COLORS[r.id]}40`, fontSize: '10px', fontWeight: 700, color: ROUTE_COLORS[r.id] }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: ROUTE_COLORS[r.id] }} />
              {r.totalTime}
            </div>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ backgroundColor: cardBg, borderBottom: `1px solid ${divider}`, padding: '12px 16px', display: 'flex', gap: '8px', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setSelectedFilter(f.key)}
            style={{
              flex: 1, padding: '9px 4px', borderRadius: '12px', border: `1.5px solid ${selectedFilter === f.key ? '#0C1F3F' : divider}`,
              backgroundColor: selectedFilter === f.key ? '#0C1F3F' : (dark ? '#132035' : '#EBF0FA'),
              color: selectedFilter === f.key ? '#fff' : textS,
              fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Route list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedRoutes.map(route => (
          <RouteCard
            key={route.id}
            route={route}
            dark={dark}
            expanded={expandedCards.has(route.id)}
            onToggle={() => toggleCard(route.id)}
            onSelect={() => onSelectRoute(route)}
            onHover={setHoveredId}
          />
        ))}
        <div style={{ height: '8px' }} />
      </div>
    </div>
  )
}

// ─── Detail Screen ────────────────────────────────────────────────────────────

function DetailScreen({ route, dark, onToggleDark, onBack, onPay }: {
  route: Route; dark: boolean; onToggleDark: () => void; onBack: () => void; onPay: () => void
}) {
  const cardBg    = dark ? '#0F1929' : '#FFFFFF'
  const textM     = dark ? '#E8F0FE' : '#0F172A'
  const textS     = dark ? '#8EA3BF' : '#64748B'
  const divider   = dark ? '#1A2D44' : '#EBF0F8'
  const appBg     = dark ? '#080E1A' : '#F4F7FB'
  const routeClr  = ROUTE_COLORS[route.id] || '#0D9488'

  return (
    <div style={{ backgroundColor: appBg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: dark ? '#0A1428' : '#0C1F3F', padding: '24px 20px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', flexShrink: 0 }}
          >
            <IconBack />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>Route Detail</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
              {route.modes.map(m => MODE_LABELS[m]).join(' → ')}
            </div>
          </div>
          <button
            onClick={onToggleDark}
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', flexShrink: 0 }}
          >
            {dark ? <IconSun /> : <IconMoon />}
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ height: '220px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <CityMap dark={dark} showRoute={true} activeRouteId={route.id} />
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '12px', backgroundColor: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.94)', border: `1px solid ${routeClr}30`, fontSize: '11px', fontWeight: 700, color: routeClr }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: routeClr }} />
          {route.totalTime} · ₹{route.totalFare}
        </div>
      </div>

      {/* Summary tiles */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: '8px', flexShrink: 0 }}>
        {[
          { label: 'Duration',  value: route.totalTime,       color: textM },
          { label: 'Fare',      value: `₹${route.totalFare}`, color: routeClr },
          { label: 'Transfers', value: `${route.transfers}`,  color: textM },
        ].map(item => (
          <div key={item.label} style={{ flex: 1, backgroundColor: cardBg, border: `1px solid ${divider}`, borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: textS, marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ padding: '0 16px 120px', flex: 1 }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: textS, marginBottom: '10px' }}>
          Step-by-step
        </div>
        <div style={{ backgroundColor: cardBg, border: `1px solid ${divider}`, borderRadius: '18px', overflow: 'hidden' }}>
          {/* Origin */}
          <div style={{ display: 'flex', gap: '12px', padding: '14px 16px', borderBottom: `1px solid ${divider}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#0C1F3F', outline: '3px solid rgba(12,31,63,0.18)', outlineOffset: '2px', marginTop: '2px' }} />
              <div style={{ width: '1.5px', flex: 1, marginTop: '5px', backgroundColor: divider, minHeight: '12px' }} />
            </div>
            <div style={{ paddingBottom: '4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: textS, marginBottom: '3px' }}>Start</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: textM }}>{route.legs[0].from}</div>
              <div style={{ fontSize: '12px', color: textS, marginTop: '2px' }}>Board here</div>
            </div>
          </div>

          {/* Legs */}
          {route.legs.map((leg, i) => {
            const mc = modeColor(leg.mode, dark)
            const isLast = i === route.legs.length - 1

            return (
              <div key={i}>
                {/* Leg detail */}
                <div style={{ display: 'flex', gap: '12px', padding: '14px 16px', borderBottom: `1px solid ${divider}` }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px' }}>
                    <div style={{ backgroundColor: mc.bg, color: mc.text, width: '28px', height: '28px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ModeIcon mode={leg.mode} size={14} />
                    </div>
                    <div style={{ width: '1.5px', flex: 1, marginTop: '5px', backgroundColor: divider, minHeight: '24px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: mc.text, marginBottom: '4px' }}>
                          {MODE_LABELS[leg.mode]}{leg.line ? ` · ${leg.line}` : ''}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: textM }}>
                          {leg.from} → {leg.to}
                        </div>
                        {leg.stops && <div style={{ fontSize: '12px', color: textS, marginTop: '3px' }}>{leg.stops} stops</div>}
                        {leg.detail && <div style={{ fontSize: '12px', color: textS, marginTop: '3px' }}>{leg.detail}</div>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: textM }}>{leg.duration}</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: leg.fare === 0 ? '#059669' : textS, marginTop: '3px' }}>
                          {leg.fare === 0 ? 'Free' : `₹${leg.fare}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrival node */}
                <div style={{ display: 'flex', gap: '12px', padding: '10px 16px', borderBottom: !isLast ? `1px solid ${divider}` : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px' }}>
                    <div style={{
                      width: isLast ? '14px' : '12px',
                      height: isLast ? '14px' : '12px',
                      borderRadius: '50%',
                      backgroundColor: isLast ? '#0D9488' : (dark ? '#1A2D44' : '#CBD5E0'),
                      border: `2.5px solid ${isLast ? '#0D9488' : (dark ? '#2A4060' : '#A0AABE')}`,
                      outline: isLast ? '3px solid rgba(13,148,136,0.18)' : 'none',
                      outlineOffset: '2px',
                      marginTop: '2px',
                    }} />
                    {!isLast && <div style={{ width: '1.5px', flex: 1, marginTop: '4px', backgroundColor: divider, minHeight: '8px' }} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', paddingTop: '1px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: textM }}>{leg.to}</span>
                    {!isLast && (
                      <span style={{ backgroundColor: dark ? 'rgba(251,191,34,0.12)' : '#FEF9C3', color: '#92400E', fontSize: '10px', fontWeight: 700, padding: '3px 7px', borderRadius: '6px' }}>
                        Transfer
                      </span>
                    )}
                    {isLast && (
                      <span style={{ backgroundColor: dark ? 'rgba(13,148,136,0.15)' : '#CCFBF1', color: '#0D9488', fontSize: '10px', fontWeight: 700, padding: '3px 7px', borderRadius: '6px' }}>
                        Destination
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        backgroundColor: cardBg, borderTop: `1px solid ${divider}`,
        padding: '16px 20px 24px',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: textS, marginBottom: '2px' }}>Total Fare</div>
            <div style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1, color: routeClr }}>₹{route.totalFare}</div>
          </div>
          <button
            onClick={onPay}
            style={{
              flex: 1, padding: '16px', border: 'none', borderRadius: '14px',
              background: 'linear-gradient(130deg,#0C1F3F 0%,#1B4080 48%,#0D9488 100%)',
              boxShadow: '0 6px 28px rgba(13,148,136,0.38)',
              color: 'white', fontSize: '15px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              letterSpacing: '0.01em', transition: 'opacity 0.2s',
            }}
          >
            Confirm & Pay →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]               = useState<Screen>('search')
  const [from, setFrom]                   = useState('Connaught Place')
  const [to, setTo]                       = useState('')
  const [datetime, setDatetime]           = useState('now')
  const [selectedFilter, setFilter]       = useState<FilterKey>('fastest')
  const [expandedCards, setExpanded]      = useState<Set<number>>(new Set())
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [dark, setDark]                   = useState(false)

  const toggleCard = (id: number) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh' }}>
      {screen === 'search' && (
        <SearchScreen
          dark={dark} onToggleDark={() => setDark(d => !d)}
          from={from} to={to} datetime={datetime}
          setFrom={setFrom} setTo={setTo} setDatetime={setDatetime}
          onSearch={() => setScreen('results')}
        />
      )}
      {screen === 'results' && (
        <ResultsScreen
          dark={dark} onToggleDark={() => setDark(d => !d)}
          from={from} to={to}
          selectedFilter={selectedFilter} setSelectedFilter={setFilter}
          expandedCards={expandedCards} toggleCard={toggleCard}
          onSelectRoute={r => { setSelectedRoute(r); setScreen('detail') }}
          onBack={() => setScreen('search')}
        />
      )}
      {screen === 'detail' && selectedRoute && (
        <DetailScreen
          route={selectedRoute} dark={dark} onToggleDark={() => setDark(d => !d)}
          onBack={() => setScreen('results')}
          onPay={() => alert('Redirecting to payment gateway…')}
        />
      )}
    </div>
  )
}
