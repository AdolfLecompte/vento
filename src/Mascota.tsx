import { useFocusEffect } from 'expo-router';
import { ReactNode, useCallback, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { MascotaId } from '@/mascotas';
import { alfa } from '@/paleta';
import { space } from '@/theme';
import { useColors, useT, useTema } from '@/tema';
import { Appear, Body, Label, Row } from '@/ui';

const AEllipse = Animated.createAnimatedComponent(Ellipse);

type Cara = { x: number; y: number; sep: number; color: string; mejilla: string };
const ROSA = alfa('#FF8FA3', 0.5);

// Each mascot keeps its own fixed colours (they never follow the app's accent colour), drawn in a 100 x 100 box.
// Every face has dark eyes and mouth with pink cheeks, in a dark shade of its own body. The face is common to all of
// them and is drawn on top at `cara`.
const CUERPOS: Record<MascotaId, { dibujo: ReactNode; cara: Cara }> = {
  pan: {
    dibujo: (
      <>
        <Path d="M16 66 C14 42 30 26 50 26 C70 26 86 42 84 66 C84 78 74 84 50 84 C26 84 16 78 16 66 Z" fill="#E9B86B" />
        <Path d="M18 70 C22 80 36 84 50 84 C64 84 78 80 82 70 C76 76 64 78 50 78 C36 78 24 76 18 70 Z" fill="#D9A24F" />
        <Path d="M33 35 q5 7 2 14 M50 31 q5 7 2 14 M67 35 q5 7 2 14" stroke="#F8DEAA" strokeWidth={4} strokeLinecap="round" fill="none" />
      </>
    ),
    cara: { x: 50, y: 63, sep: 22, color: '#5B3A12', mejilla: ROSA },
  },
  bebida: {
    dibujo: (
      <>
        <Path d="M58 28 L65 7" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
        <Path d="M58 28 L65 7" stroke="#F43F5E" strokeWidth={5} strokeLinecap="round" strokeDasharray="4 5" />
        <Path d="M26 38 H74 L67 84 Q66 90 60 90 H40 Q34 90 33 84 Z" fill="#F4728A" />
        <Path d="M26 38 H74 L72.8 47 Q66 52 60 47 Q54 52 48 47 Q42 52 36 47 Q31 50 27.2 47 Z" fill="#FFF3E6" />
        <Path d="M33 56 L35 78" stroke="#FFB3C4" strokeWidth={3} strokeLinecap="round" />
        <Path d="M34.6 81 H65.4 L64.8 85 Q64 90 60 90 H40 Q36 90 35.2 85 Z" fill="#E0516F" />
        <Circle cx={41} cy={85} r={2.6} fill="#7A3B4B" />
        <Circle cx={49} cy={86.5} r={2.6} fill="#7A3B4B" />
        <Circle cx={57} cy={85} r={2.6} fill="#7A3B4B" />
        <Rect x={21} y={28} width={58} height={11} rx={5.5} fill="#FFD166" />
        <Rect x={25} y={30} width={22} height={3} rx={1.5} fill="#FFF0B8" />
      </>
    ),
    cara: { x: 50, y: 66, sep: 20, color: '#5A1E30', mejilla: alfa('#FFE0E7', 0.9) },
  },
  billete: {
    dibujo: (
      <>
        <Rect x={11} y={28} width={78} height={46} rx={9} fill="#3FAE6E" />
        <Rect x={18} y={34} width={64} height={34} rx={6} fill="#86D9A6" stroke="#E2F8EA" strokeWidth={2} />
        <Circle cx={25.5} cy={51} r={4.6} fill="#FFD65A" stroke="#E0A81E" strokeWidth={1.5} />
        <Circle cx={74.5} cy={51} r={4.6} fill="#FFD65A" stroke="#E0A81E" strokeWidth={1.5} />
        <Path d="M14 38 L32 30 H20 Q14 30 14 36 Z" fill="#FFFFFF" fillOpacity={0.25} />
      </>
    ),
    cara: { x: 50, y: 49, sep: 22, color: '#14532D', mejilla: alfa('#FF8FA3', 0.55) },
  },
  moneda: {
    dibujo: (
      <>
        <Circle cx={50} cy={52} r={37} fill="#F4C542" />
        <Circle cx={50} cy={52} r={30} fill="none" stroke="#D9A21B" strokeWidth={3} />
      </>
    ),
    cara: { x: 50, y: 52, sep: 22, color: '#5A3E00', mejilla: ROSA },
  },
  bolsa: {
    dibujo: (
      <>
        <Path d="M38 42 V32 a12 12 0 0 1 24 0 V42" fill="none" stroke="#6B5DD3" strokeWidth={5} strokeLinecap="round" />
        <Path d="M22 40 H78 L82 82 Q82 88 76 88 H24 Q18 88 18 82 Z" fill="#8B7CF6" />
        <Path d="M22 40 H78 L78.5 49 H21.5 Z" fill="#B3A8FF" />
        <Rect x={20.5} y={50} width={59} height={3} fill="#FFD65A" />
        <Circle cx={38} cy={43} r={3} fill="#FFD65A" />
        <Circle cx={62} cy={43} r={3} fill="#FFD65A" />
        <Path d="M71 79 c-3 -4 -8 0 -4 4 l4 4 l4 -4 c4 -4 -1 -8 -4 -4 Z" fill="#FFD65A" />
      </>
    ),
    cara: { x: 50, y: 63, sep: 22, color: '#2E1F73', mejilla: ROSA },
  },
  cartera: {
    dibujo: (
      <>
        <Rect x={26} y={18} width={46} height={28} rx={5} fill="#6FCF97" transform="rotate(-10 49 32)" />
        <Rect x={34} y={22} width={44} height={26} rx={5} fill="#F9A8B8" transform="rotate(6 56 35)" />
        <Rect x={13} y={36} width={72} height={50} rx={12} fill="#B9733F" />
        <Path d="M13 50 V48 Q13 36 25 36 H73 Q85 36 85 48 V50 Z" fill="#CF8A52" />
        <Rect x={18} y={41} width={62} height={40} rx={9} fill="none" stroke="#8A4F28" strokeWidth={1.5} strokeDasharray="3 3" />
        <Rect x={62} y={53} width={30} height={18} rx={9} fill="#FFC857" />
        <Circle cx={73} cy={62} r={3.2} fill="#B9733F" />
      </>
    ),
    cara: { x: 37, y: 64, sep: 18, color: '#3B1F0C', mejilla: ROSA },
  },
};

function Ojos({ cara, parpadeo }: { cara: Cara; parpadeo: { value: number } }) {
  const props = useAnimatedProps(() => ({ ry: 3.6 * parpadeo.value }));
  return (
    <>
      <AEllipse cx={cara.x - cara.sep / 2} cy={cara.y} rx={3.4} fill={cara.color} animatedProps={props} />
      <AEllipse cx={cara.x + cara.sep / 2} cy={cara.y} rx={3.4} fill={cara.color} animatedProps={props} />
    </>
  );
}

// A friendly mascot. It breathes and blinks only while its screen is in front (tabs stay mounted, and endless
// animations on hidden screens would drain the battery), and it hops when tapped or when `saludo` changes.
// `feliz` gives it a big smile with happy closed eyes (used when something was saved).
export function Mascota({ id, size = 80, animada = true, saludo = 0, onPress, feliz = false }: {
  id: MascotaId; size?: number; animada?: boolean; saludo?: number; onPress?: () => void; feliz?: boolean;
}) {
  const t = useT();
  const reducido = useReducedMotion();
  const vivo = animada && !reducido;
  const respira = useSharedValue(0);
  const parpadeo = useSharedValue(1);
  const salto = useSharedValue(0);

  useFocusEffect(useCallback(() => {
    if (!vivo) return;
    respira.set(withRepeat(withSequence(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.quad) })), -1));
    let t: ReturnType<typeof setTimeout>;
    const siguiente = () => {
      t = setTimeout(() => {
        parpadeo.set(withSequence(withTiming(0.1, { duration: 90 }), withTiming(1, { duration: 130 })));
        siguiente();
      }, 2600 + Math.random() * 1800);
    };
    siguiente();
    return () => { clearTimeout(t); cancelAnimation(respira); cancelAnimation(parpadeo); respira.set(0); parpadeo.set(1); };
  }, [vivo, respira, parpadeo]));

  const hop = useCallback(() => {
    if (reducido) return;
    salto.set(withSequence(withTiming(-size * 0.16, { duration: 170, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 210, easing: Easing.in(Easing.quad) })));
    parpadeo.set(withSequence(withTiming(0.15, { duration: 120 }), withDelay(450, withTiming(1, { duration: 150 })))); // a happy squint
  }, [reducido, size, salto, parpadeo]);
  useEffect(() => { if (saludo) hop(); }, [saludo, hop]);

  const cuerpoAnim = useAnimatedStyle(() => ({ transform: [{ translateY: salto.value }, { scaleY: 1 + 0.035 * respira.value }, { scaleX: 1 - 0.015 * respira.value }] }));
  const { dibujo, cara } = CUERPOS[id];
  const vista = (
    <Animated.View style={[{ width: size, height: size, transformOrigin: '50% 100%' }, cuerpoAnim]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {dibujo}
        <Circle cx={cara.x - cara.sep / 2 - 5} cy={cara.y + 7} r={3.6} fill={cara.mejilla} />
        <Circle cx={cara.x + cara.sep / 2 + 5} cy={cara.y + 7} r={3.6} fill={cara.mejilla} />
        {feliz ? (
          <>
            <Path d={`M${cara.x - cara.sep / 2 - 4} ${cara.y + 2} Q${cara.x - cara.sep / 2} ${cara.y - 5} ${cara.x - cara.sep / 2 + 4} ${cara.y + 2}`} stroke={cara.color} strokeWidth={2.8} strokeLinecap="round" fill="none" />
            <Path d={`M${cara.x + cara.sep / 2 - 4} ${cara.y + 2} Q${cara.x + cara.sep / 2} ${cara.y - 5} ${cara.x + cara.sep / 2 + 4} ${cara.y + 2}`} stroke={cara.color} strokeWidth={2.8} strokeLinecap="round" fill="none" />
            <Path d={`M${cara.x - 8} ${cara.y + 6} Q${cara.x} ${cara.y + 19} ${cara.x + 8} ${cara.y + 6} Z`} fill={cara.color} />
          </>
        ) : (
          <>
            <Ojos cara={cara} parpadeo={parpadeo} />
            <Path d={`M${cara.x - 6} ${cara.y + 7} Q${cara.x} ${cara.y + 13} ${cara.x + 6} ${cara.y + 7}`} stroke={cara.color} strokeWidth={2.6} strokeLinecap="round" fill="none" />
          </>
        )}
      </Svg>
    </Animated.View>
  );

  // A decorative mascot must not be a Pressable: a Pressable takes the touch even without onPress, so a card
  // around it (e.g. the mascot picker) would never receive the tap.
  if (!animada) return <View pointerEvents="none" style={{ width: size, height: size }}>{vista}</View>;
  return (
    <Pressable onPress={() => { hop(); onPress?.(); }} accessibilityRole="image" accessibilityLabel={t('Tu mascota')} style={{ width: size, height: size }}>
      {vista}
    </Pressable>
  );
}

// Empty state: the user's mascot with a short line.
export function Vacio({ texto }: { texto: string }) {
  const { mascota, colors } = useTema();
  return (
    <View style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xl }}>
      <Mascota id={mascota} size={104} />
      <View style={{ paddingHorizontal: space.lg }}><Body style={{ textAlign: 'center' }} color={colors.muted}>{texto}</Body></View>
    </View>
  );
}

// A speech bubble with its tail pointing left, at the mascot that is talking.
export function Burbuja({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: space.md, gap: 2 }}>{children}</View>
      <View style={{ position: 'absolute', left: -5, bottom: 24, width: 14, height: 14, borderRadius: 3, backgroundColor: colors.surface, transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}

// The mascot walking you through a form with a short phrase ("Anotando…", "Ya casi…"). It hops when `n` changes.
export function Guia({ frase, n = 0 }: { frase: string; n?: number }) {
  const { mascota } = useTema();
  return (
    <Row style={{ alignItems: 'flex-end', gap: space.md, flexWrap: 'nowrap' }}>
      <Mascota id={mascota} size={60} saludo={n} />
      <Burbuja><Appear key={frase}><Label>{frase}</Label></Appear></Burbuja>
    </Row>
  );
}
