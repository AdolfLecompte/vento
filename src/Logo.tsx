import Svg, { Defs, G, Mask, Path, Polygon, Rect } from 'react-native-svg';
import { useTema } from '@/tema';
import { divisaPorId } from '@/divisas';

// The Vento mark: two arrows going opposite ways and a box with the chosen currency symbol. Same geometry as
// scripts/make-logo.py (which draws the launcher icon); the rim and the symbol are cut out, so it sits on any colour.
const ARROW = '40,66 342,66 342,26 430,105 342,184 342,146 40,146';
const S = 2.1;
const MASK = { maskUnits: 'userSpaceOnUse' as const, x: -200, y: -200, width: 900, height: 900 };
const caja = (
  <>
    <Rect x={134} y={120} width={198} height={48} rx={18} />
    <Path d="M141 160 H325 V270 A30 30 0 0 1 295 300 H171 A30 30 0 0 1 141 270 Z" />
  </>
);

export function Logo({ size = 96, color }: { size?: number; color?: string }) {
  const { colors, divisa } = useTema();
  const c = color ?? colors.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityLabel="Vento">
      <Defs>
        <Mask id="recorte" {...MASK}>
          <Rect x={-200} y={-200} width={900} height={900} fill="white" />
          <G fill="black" stroke="black" strokeWidth={24} strokeLinejoin="round">{caja}</G>
        </Mask>
        <Mask id="simbolo" {...MASK}>
          <Rect x={-200} y={-200} width={900} height={900} fill="white" />
          <G transform="translate(189 192) scale(0.88)" fill="none" stroke="black" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round">
            {divisaPorId(divisa).trazos.map((d) => <Path key={d} d={d} />)}
          </G>
        </Mask>
      </Defs>
      <G transform={`translate(${512 - 236.5 * S} ${512 - 213 * S}) scale(${S})`}>
        <G mask="url(#recorte)" fill={c} stroke={c} strokeWidth={12} strokeLinejoin="round">
          <Polygon points={ARROW} />
          <Polygon points={ARROW} transform="rotate(180 236.5 213)" />
        </G>
        <G mask="url(#simbolo)" fill={c}>{caja}</G>
      </G>
    </Svg>
  );
}
