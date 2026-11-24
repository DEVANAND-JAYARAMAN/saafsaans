import type { AqiBand } from "@/lib/types";

/**
 * Semicircular AQI gauge rendered as accessible SVG.
 * The arc length maps AQI 0..500 to a 180° sweep. A text alternative is exposed
 * via role="img" + aria-label so screen-reader users get the same information.
 */
export function AqiGauge({ aqi, size = 220 }: { aqi: AqiBand; size?: number }) {
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius; // semicircle
  const fraction = Math.min(aqi.index, 500) / 500;
  const dash = circumference * fraction;

  const label = `Air Quality Index ${aqi.index}, category ${aqi.category}. ${aqi.label}`;

  return (
    <figure className="flex flex-col items-center" role="img" aria-label={label}>
      <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`}>
        <path
          d={`M ${stroke / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={`M ${stroke / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${cy}`}
          fill="none"
          stroke={aqi.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-white" fontSize="34" fontWeight="800">
          {aqi.index}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="13" fill={aqi.color} fontWeight="700">
          {aqi.category}
        </text>
      </svg>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}
