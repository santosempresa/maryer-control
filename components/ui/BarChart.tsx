"use client";

import clsx from "clsx";

export interface BarChartDatum {
  key: string;
  label: string;
  value: number;
  emphasis?: boolean;
}

interface BarChartProps {
  data: BarChartDatum[];
  formatValue: (value: number) => string;
  plotHeight?: number;
}

export function BarChart({ data, formatValue, plotHeight = 96 }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex items-end gap-2 sm:gap-3">
      {data.map((d) => {
        const barHeight = d.value <= 0 ? 2 : Math.max(4, (d.value / max) * plotHeight);
        return (
          <div key={d.key} className="flex flex-1 flex-col items-center">
            <span className="mb-1 block h-4 text-[11px] font-medium tabular-nums text-muted">
              {d.value > 0 ? formatValue(d.value) : ""}
            </span>
            <div className="flex items-end" style={{ height: plotHeight }}>
              <button
                type="button"
                title={`${d.label}: ${formatValue(d.value)}`}
                aria-label={`${d.label}: ${formatValue(d.value)}`}
                style={{ height: barHeight }}
                className={clsx(
                  "w-5 rounded-t-[4px] transition-[filter] hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-6",
                  d.emphasis ? "bg-primary" : "bg-gray-200"
                )}
              />
            </div>
            <span
              className={clsx(
                "mt-1.5 text-[11px]",
                d.emphasis ? "font-medium text-foreground" : "text-muted"
              )}
            >
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
