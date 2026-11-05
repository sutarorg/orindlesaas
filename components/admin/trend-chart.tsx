import { formatShortDate } from "@/lib/admin/format";

export type AdminChartPoint = {
  label: string;
  values: readonly number[];
};

export function AdminTrendChart({
  title,
  description,
  summary,
  points,
  series,
  formatValue,
}: {
  title: string;
  description: string;
  summary: string;
  points: readonly AdminChartPoint[];
  series: readonly { label: string; color: string }[];
  formatValue: (value: number) => string;
}) {
  const width = 720;
  const height = 250;
  const left = 62;
  const right = 18;
  const top = 18;
  const bottom = 48;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maximum = Math.max(1, ...points.flatMap((point) => point.values.map((value) => Math.max(0, value))));
  const denominator = Math.max(1, points.length - 1);
  const xFor = (index: number) => left + (index / denominator) * plotWidth;
  const yFor = (value: number) => top + plotHeight - (Math.max(0, value) / maximum) * plotHeight;
  const labelCount = Math.min(6, points.length);
  const labelIndices = Array.from({ length: labelCount }, (_, index) => labelCount <= 1 ? 0 : Math.round((index * (points.length - 1)) / (labelCount - 1)));

  return (
    <figure className="min-w-0">
      <figcaption>
        <h3 className="text-base font-semibold tracking-[-0.02em] text-ink">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
      </figcaption>
      {series.length > 1 && (
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Chart series">
          {series.map((item) => <li key={item.label} className="flex items-center gap-2 text-xs text-body"><span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />{item.label}</li>)}
        </ul>
      )}
      <div className="mt-3 max-w-full overflow-x-auto" role="region" aria-label={`${title} chart`} tabIndex={0}>
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto min-w-[520px] w-full" role="img" aria-label={`${title}. ${summary}`}>
          <title>{title}</title>
          <desc>{description} {summary} Exact demo values are available in the table below.</desc>
          {[0, 0.5, 1].map((ratio) => {
            const value = Math.round(maximum * ratio);
            const y = yFor(value);
            return (
              <g key={ratio}>
                <line x1={left} x2={width - right} y1={y} y2={y} stroke="#dfe7e3" strokeWidth="1" />
                <text x={left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#4f5d58">{formatValue(value)}</text>
              </g>
            );
          })}
          {series.map((item, seriesIndex) => {
            const coordinates = points.map((point, index) => `${xFor(index)},${yFor(point.values[seriesIndex] ?? 0)}`).join(" ");
            return <polyline key={item.label} points={coordinates} fill="none" stroke={item.color} strokeWidth={seriesIndex === 0 ? 3 : 2.25} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />;
          })}
          {labelIndices.map((pointIndex) => {
            const point = points[pointIndex];
            if (!point) return null;
            return <text key={pointIndex} x={xFor(pointIndex)} y={height - 16} textAnchor="middle" fontSize="11" fill="#4f5d58">{formatShortDate(point.label)}</text>;
          })}
        </svg>
      </div>
      <p className="mt-2 text-xs leading-5 text-body"><span className="font-semibold text-ink">Fixture summary:</span> {summary}</p>
      <details className="mt-4 rounded-xl border border-line bg-soft px-4 py-3">
        <summary className="min-h-8 cursor-pointer text-xs font-semibold text-ink">View exact demo values</summary>
        <div className="mt-3 max-h-72 overflow-auto" role="region" aria-label={`${title} values`} tabIndex={0}>
          <table className="w-full min-w-[420px] border-collapse text-left text-xs">
            <caption className="sr-only">Exact values for {title}; fictional demo data</caption>
            <thead><tr className="border-b border-line"><th scope="col" className="py-2 pr-4 font-semibold text-muted">Date</th>{series.map((item) => <th key={item.label} scope="col" className="py-2 pr-4 text-right font-semibold text-muted">{item.label}</th>)}</tr></thead>
            <tbody>{points.map((point) => <tr key={point.label} className="border-b border-line/70 last:border-0"><th scope="row" className="py-2 pr-4 font-medium text-ink">{formatShortDate(point.label)}</th>{series.map((item, index) => <td key={item.label} className="py-2 pr-4 text-right tabular-nums text-body">{formatValue(point.values[index] ?? 0)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
