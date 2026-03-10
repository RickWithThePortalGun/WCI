'use client';

import { useMemo, useState } from 'react';
import { Shield, ChevronDown, ChevronUp, Bomb, Anchor, Plane, Users } from 'lucide-react';
import { MILITARY_POWERS, TIER_COLORS, TIER_LABELS, type MilitaryPower } from '@/lib/military-power';

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return n.toLocaleString();
}

function fmtBudget(b: number): string {
  if (b >= 100) return '$' + Math.round(b) + 'B';
  if (b >= 1) return '$' + b.toFixed(1) + 'B';
  return '$' + (b * 1000).toFixed(0) + 'M';
}

function PowerBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1 w-16 bg-[#0a1a10] rounded-sm overflow-hidden">
      <div className="h-full rounded-sm transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function PwrIndexBar({ pwrIndex }: { pwrIndex: number }) {
  // Lower = better. Max meaningful index ~1.5, invert for bar
  const strength = Math.max(0, 1 - pwrIndex / 1.5);
  const pct = Math.min(strength * 100, 100);
  const color = pwrIndex < 0.2 ? '#ff2200' : pwrIndex < 0.4 ? '#ff8800' : pwrIndex < 0.7 ? '#ffcc00' : '#44aa66';
  return (
    <div className="h-2 flex-1 bg-[#0a1a10] rounded-sm overflow-hidden">
      <div className="h-full rounded-sm transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

interface RowProps {
  mp: MilitaryPower;
  maxTroops: number;
  maxTanks: number;
  maxAircraft: number;
  maxNaval: number;
  highlight?: boolean;
}

function CountryRow({ mp, maxTroops, maxTanks, maxAircraft, maxNaval, highlight }: RowProps) {
  const [expanded, setExpanded] = useState(false);
  const tierColor = TIER_COLORS[mp.tier];

  return (
    <div
      className={`border-b border-[#1a2e1a] transition-colors ${highlight ? 'bg-[#0d2010]' : 'hover:bg-[#080f08]'}`}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-3 py-2 flex items-center gap-2"
      >
        {/* Rank */}
        <span className="text-[10px] font-mono w-6 text-center" style={{ color: tierColor }}>
          #{mp.rank}
        </span>

        {/* Flag */}
        <span className="text-sm w-6 text-center">{getFlagEmoji(mp.countryCode)}</span>

        {/* Country name */}
        <span className="font-mono text-xs text-[#c8e6c8] flex-1 min-w-0 truncate">
          {mp.country.toUpperCase()}
          {mp.nuclearWarheads && (
            <span className="ml-1 text-[#ff4400]" title={`${mp.nuclearWarheads} nuclear warheads`}>☢</span>
          )}
        </span>

        {/* Tier badge */}
        <span className="text-[9px] font-mono px-1 border rounded hidden sm:block"
          style={{ color: tierColor, borderColor: tierColor + '44' }}>
          {TIER_LABELS[mp.tier]}
        </span>

        {/* PwrIndex bar */}
        <div className="flex items-center gap-1 w-28 hidden md:flex">
          <PwrIndexBar pwrIndex={mp.pwrIndex} />
          <span className="text-[10px] font-mono text-[#44aa66] w-12 text-right">{mp.pwrIndex.toFixed(4)}</span>
        </div>

        {/* Budget */}
        <span className="text-[10px] font-mono text-[#ffcc00] w-12 text-right hidden lg:block">
          {fmtBudget(mp.defenseBudgetB)}
        </span>

        {expanded ? <ChevronUp size={12} className="text-[#44aa66]" /> : <ChevronDown size={12} className="text-[#44aa66]" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[#1a2e1a] pt-2 bg-[#050c05]">
          <MetricBlock
            icon={<Users size={10} />}
            label="Active Troops"
            value={fmt(mp.activeTroops) + 'k'}
            bar={<PowerBar value={mp.activeTroops} max={maxTroops} color="#44aa66" />}
          />
          <MetricBlock
            icon={<Shield size={10} />}
            label="Tank Fleet"
            value={mp.tanks.toLocaleString()}
            bar={<PowerBar value={mp.tanks} max={maxTanks} color="#ffcc00" />}
          />
          <MetricBlock
            icon={<Plane size={10} />}
            label="Aircraft"
            value={mp.aircraft.toLocaleString()}
            bar={<PowerBar value={mp.aircraft} max={maxAircraft} color="#4488ff" />}
          />
          <MetricBlock
            icon={<Anchor size={10} />}
            label="Naval / Subs"
            value={`${mp.navalVessels} / ${mp.submarines}`}
            bar={<PowerBar value={mp.navalVessels} max={maxNaval} color="#0088ff" />}
          />
          {mp.nuclearWarheads != null && (
            <div className="col-span-2 sm:col-span-4 flex items-center gap-2 mt-1">
              <Bomb size={10} className="text-[#ff4400]" />
              <span className="text-[10px] font-mono text-[#ff4400]">
                NUCLEAR ARSENAL: ~{mp.nuclearWarheads.toLocaleString()} warheads (SIPRI/FAS est.)
              </span>
            </div>
          )}
          <div className="col-span-2 sm:col-span-4 flex items-center gap-3 mt-1">
            <span className="text-[10px] font-mono text-[#888]">Defense Budget: <span className="text-[#ffcc00]">{fmtBudget(mp.defenseBudgetB)}/yr</span></span>
            <span className="text-[10px] font-mono text-[#888]">Reserve: <span className="text-[#c8e6c8]">{fmt(mp.reserveTroops)}k</span></span>
            <span className="text-[10px] font-mono text-[#888]">GFP Rank: <span style={{ color: TIER_COLORS[mp.tier] }}>#{mp.rank}/145</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBlock({ icon, label, value, bar }: { icon: React.ReactNode; label: string; value: string; bar: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-[#888]">
        {icon}
        <span className="text-[9px] font-mono uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-xs font-mono text-[#c8e6c8]">{value}</span>
      {bar}
    </div>
  );
}

function getFlagEmoji(code: string): string {
  const flags: Record<string, string> = {
    US: '🇺🇸', RU: '🇷🇺', CN: '🇨🇳', IN: '🇮🇳', KR: '🇰🇷',
    GB: '🇬🇧', JP: '🇯🇵', FR: '🇫🇷', TR: '🇹🇷', DE: '🇩🇪',
    PK: '🇵🇰', IL: '🇮🇱', EG: '🇪🇬', IR: '🇮🇷', SA: '🇸🇦',
    AU: '🇦🇺', PL: '🇵🇱', UA: '🇺🇦', KP: '🇰🇵', TW: '🇹🇼',
    AE: '🇦🇪', ET: '🇪🇹', JO: '🇯🇴', LB: '🇱🇧', SY: '🇸🇾',
    SD: '🇸🇩', RW: '🇷🇼', BY: '🇧🇾', QA: '🇶🇦', PH: '🇵🇭',
    TD: '🇹🇩', SO: '🇸🇴', MM: '🇲🇲', AO: '🇦🇴', NE: '🇳🇪',
    ER: '🇪🇷', UG: '🇺🇬', IQ: '🇮🇶', TH: '🇹🇭', EE: '🇪🇪', NT: '🛡️',
  };
  return flags[code] ?? '🏳';
}

type SortKey = 'rank' | 'troops' | 'tanks' | 'aircraft' | 'budget';

export default function MilitaryBalance({ highlightCountries = [] }: { highlightCountries?: string[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [filter, setFilter] = useState('');
  const [showAll, setShowAll] = useState(false);

  const highlightSet = useMemo(() => {
    const s = new Set<string>();
    for (const name of highlightCountries) {
      const n = name.trim().toLowerCase();
      for (const mp of MILITARY_POWERS) {
        if (mp.country.toLowerCase() === n || mp.aliases.some(a => a.toLowerCase() === n)) {
          s.add(mp.countryCode);
        }
      }
    }
    return s;
  }, [highlightCountries]);

  const sorted = useMemo(() => {
    let list = [...MILITARY_POWERS];
    if (filter) {
      const q = filter.toLowerCase();
      list = list.filter(m =>
        m.country.toLowerCase().includes(q) ||
        m.aliases.some(a => a.toLowerCase().includes(q)),
      );
    }
    switch (sortKey) {
      case 'troops':   list.sort((a, b) => b.activeTroops - a.activeTroops); break;
      case 'tanks':    list.sort((a, b) => b.tanks - a.tanks); break;
      case 'aircraft': list.sort((a, b) => b.aircraft - a.aircraft); break;
      case 'budget':   list.sort((a, b) => b.defenseBudgetB - a.defenseBudgetB); break;
      default:         list.sort((a, b) => a.rank - b.rank); break;
    }
    // Always float highlights to top
    if (highlightSet.size > 0) {
      list.sort((a, b) => {
        const aH = highlightSet.has(a.countryCode) ? 0 : 1;
        const bH = highlightSet.has(b.countryCode) ? 0 : 1;
        return aH - bH;
      });
    }
    return list;
  }, [sortKey, filter, highlightSet]);

  const display = showAll ? sorted : sorted.slice(0, 15);

  const maxTroops   = Math.max(...MILITARY_POWERS.map(m => m.activeTroops));
  const maxTanks    = Math.max(...MILITARY_POWERS.map(m => m.tanks));
  const maxAircraft = Math.max(...MILITARY_POWERS.map(m => m.aircraft));
  const maxNaval    = Math.max(...MILITARY_POWERS.map(m => m.navalVessels));

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'rank', label: 'GFP RANK' },
    { key: 'troops', label: 'TROOPS' },
    { key: 'tanks', label: 'ARMOR' },
    { key: 'aircraft', label: 'AIRPOWER' },
    { key: 'budget', label: 'BUDGET' },
  ];

  return (
    <div className="border border-[#1a3320] bg-[#030805] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a3320] bg-[#040e06]">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-[#44aa66]" />
          <span className="text-xs font-mono text-[#44aa66] tracking-widest">MILITARY BALANCE</span>
          <span className="text-[10px] font-mono text-[#444] ml-1">GFP 2025 · {MILITARY_POWERS.length} NATIONS</span>
        </div>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="FILTER..."
          className="bg-[#0a1a10] border border-[#1a3320] text-[#44aa66] font-mono text-[10px] px-2 py-1 rounded w-28 outline-none placeholder:text-[#2a4a2a]"
        />
      </div>

      {/* Sort tabs */}
      <div className="flex border-b border-[#1a3320]">
        {SORT_OPTIONS.map(o => (
          <button
            key={o.key}
            onClick={() => setSortKey(o.key)}
            className={`flex-1 py-1.5 text-[9px] font-mono tracking-wider transition-colors ${
              sortKey === o.key
                ? 'text-[#44aa66] bg-[#0a1a10] border-b border-[#44aa66]'
                : 'text-[#445544] hover:text-[#88aa88]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-[#0d1e0d] text-[9px] font-mono text-[#334433] uppercase tracking-wider">
        <span className="w-6">Rnk</span>
        <span className="w-6"></span>
        <span className="flex-1">Nation</span>
        <span className="w-28 hidden md:block">Power Index</span>
        <span className="w-12 text-right hidden lg:block">Budget</span>
        <span className="w-4"></span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#0d1e0d]">
        {display.map(mp => (
          <CountryRow
            key={mp.countryCode}
            mp={mp}
            maxTroops={maxTroops}
            maxTanks={maxTanks}
            maxAircraft={maxAircraft}
            maxNaval={maxNaval}
            highlight={highlightSet.has(mp.countryCode)}
          />
        ))}
      </div>

      {/* Show more / source */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-[#1a3320] bg-[#040e06]">
        {sorted.length > 15 && (
          <button
            onClick={() => setShowAll(s => !s)}
            className="text-[10px] font-mono text-[#44aa66] hover:text-[#66cc88] transition-colors"
          >
            {showAll ? '▲ SHOW LESS' : `▼ SHOW ALL ${sorted.length}`}
          </button>
        )}
        <span className="text-[9px] font-mono text-[#334433] ml-auto">
          SOURCE: GLOBALFIREPOWER.COM · SIPRI · FAS 2025
        </span>
      </div>
    </div>
  );
}
