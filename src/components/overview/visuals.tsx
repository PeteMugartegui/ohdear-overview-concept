import { useEffect, useId, useState, type KeyboardEvent } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/cn";
import {
  dayStatusLabel,
  PERF_ACTUAL,
  PERF_SAMPLE,
  UPTIME_DAYS,
  type DayState,
  type PerfPoint,
} from "./model";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduce;
}

function segmentFill(state: DayState) {
  return cn(
    "pointer-events-none h-2.5 w-full",
    state === "up" && "bg-ok",
    state === "down" && "bg-down",
    state === "missing" && "day-missing",
  );
}

function tipAnchor(index: number, count: number) {
  const ratio = (index + 0.5) / count;
  if (ratio < 0.14) return { left: 0 };
  if (ratio > 0.86) return { right: 0 };
  return { left: `${ratio * 100}%`, transform: "translateX(-50%)" };
}

export function UptimeTimeline({ sample }: { sample: boolean }) {
  const labelId = useId();
  const tipId = useId();
  const [active, setActive] = useState<number | null>(null);
  const states = UPTIME_DAYS.map((item) => (sample ? item.sample : item.observed));
  const day = active === null ? null : UPTIME_DAYS[active];
  const state = day ? states[active!] : null;

  function move(nextIndex: number) {
    const next = Math.max(0, Math.min(UPTIME_DAYS.length - 1, nextIndex));
    setActive(next);
    document.getElementById(`uptime-${UPTIME_DAYS[next].iso}`)?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = active ?? UPTIME_DAYS.length - 1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      move(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      move(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      move(0);
    } else if (event.key === "End") {
      event.preventDefault();
      move(UPTIME_DAYS.length - 1);
    }
  }

  return (
    <div className="mt-2">
      <p id={labelId} className="sr-only">
        Uptime history from October 1 to October 30, 2026
      </p>
      <div
        className="relative"
        onMouseLeave={() => setActive(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActive(null);
        }}
      >
        {day && state ? (
          <div
            role="tooltip"
            id={tipId}
            className="pointer-events-none absolute bottom-full z-10 mb-1 rounded-md border border-line bg-raised px-2 py-1 text-xs whitespace-nowrap text-fg shadow-pop"
            style={tipAnchor(active!, UPTIME_DAYS.length)}
          >
            {day.full} · {dayStatusLabel(state)}
          </div>
        ) : null}
        <div role="group" aria-labelledby={labelId} className="flex gap-px" onKeyDown={onKeyDown}>
          {UPTIME_DAYS.map((item, index) => {
            const value = states[index];
            const selected = index === (active ?? UPTIME_DAYS.length - 1);
            return (
              <button
                key={item.iso}
                id={`uptime-${item.iso}`}
                type="button"
                tabIndex={selected ? 0 : -1}
                aria-label={`${item.full}: ${dayStatusLabel(value)}`}
                aria-describedby={index === active ? tipId : undefined}
                className="flex h-6 min-w-0 flex-1 items-center"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
              >
                <span className={segmentFill(value)} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-1 flex justify-between text-xs text-faint">
        <span>Oct 1</span>
        <span>Oct 30</span>
      </div>
      <div className="mt-1 flex gap-3 text-xs text-muted">
        {states.includes("up") ? <Legend swatch="bg-ok" label="Up" /> : null}
        {states.includes("down") ? <Legend swatch="bg-down" label="Down" /> : null}
        {states.includes("missing") ? <Legend swatch="day-missing" label="No data" /> : null}
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("size-2 rounded-sm", swatch)} aria-hidden="true" />
      {label}
    </span>
  );
}

export function PerformanceTrend({ sample }: { sample: boolean }) {
  const points = sample ? PERF_SAMPLE : PERF_ACTUAL;
  const [tip, setTip] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const mounted = useMounted();
  const reduce = useReducedMotion();
  const labelId = useId();
  const tipId = useId();
  const point = tip === null ? null : points[tip];

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tip ?? points.length - 1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setTip(Math.min(points.length - 1, index + 1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setTip(Math.max(0, index - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setTip(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setTip(points.length - 1);
    }
  }

  return (
    <div className="mt-3">
      <p id={labelId} className="sr-only">
        Performance score from 0 to 100.
        {points.length < 2 ? " Performance trends will appear after more checks." : ""}{" "}
        {points.map((item) => `${item.full}: ${item.score}.`).join(" ")}
      </p>
      <div
        className="relative h-20"
        tabIndex={0}
        role="group"
        aria-labelledby={labelId}
        onKeyDown={onKeyDown}
        onFocus={() => {
          setFocused(true);
          setTip((current) => current ?? points.length - 1);
        }}
        onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setFocused(false);
          setTip(null);
        }}
        onMouseLeave={() => {
          if (!focused) setTip(null);
        }}
      >
        {point ? (
          <div
            role="tooltip"
            id={tipId}
            className="pointer-events-none absolute bottom-full z-20 mb-1 w-52 rounded-lg border border-line bg-raised px-2.5 py-2 text-xs text-fg shadow-pop"
            style={tipAnchor(tip!, points.length)}
          >
            <p>
              {point.full}
              <span className="text-muted"> · Performance {point.score}</span>
            </p>
            {sample && tip !== points.length - 1 ? (
              <p className="mt-1 text-muted">Sample score. Only the latest report is included.</p>
            ) : (
              <p className="mt-1 text-muted">Latest performance result.</p>
            )}
          </div>
        ) : null}
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              onMouseMove={(state) => {
                if (typeof state?.activeTooltipIndex === "number") setTip(state.activeTooltipIndex);
              }}
            >
              <CartesianGrid vertical={false} stroke="var(--color-metric)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 50, 100]}
                interval={0}
                width={28}
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={() => null} cursor={{ stroke: "var(--color-faint)" }} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--color-faint)"
                strokeWidth={1.5}
                isAnimationActive={!reduce}
                dot={(dotProps) => {
                  const { cx, cy, index } = dotProps as { cx?: number; cy?: number; index?: number };
                  if (cx == null || cy == null || index == null) return <g />;
                  const current = index === points.length - 1;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={current ? 3 : 2}
                      fill={current ? "var(--color-down)" : "var(--color-faint)"}
                    />
                  );
                }}
                activeDot={{ r: 4, fill: "var(--color-fg)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full" />
        )}
      </div>
      {points.length < 2 ? (
        <p className="mt-1 text-xs text-muted">Performance trends will appear after more checks.</p>
      ) : null}
    </div>
  );
}
