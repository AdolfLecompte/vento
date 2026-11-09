import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { KeyboardAvoidingView, LayoutAnimation, Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import Animated, {
  Easing, interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaretLeftIcon, MagnifyingGlassIcon, PlusIcon, ShoppingBagIcon, XIcon } from '@/icons';
import { miles, money, num } from '@/formato';
import { alfa } from '@/paleta';
import { useColors, useT } from '@/tema';
import { fonts, radius, space, type } from '@/theme';

export { miles, money, num };

type TextProps = { children: ReactNode; style?: StyleProp<TextStyle>; color?: string; lines?: number };
const mk = (base: TextStyle, tono: 'ink' | 'muted') =>
  function Txt({ children, style, color, lines }: TextProps) {
    const colors = useColors();
    return <Text numberOfLines={lines} style={[base, { color: color ?? colors[tono] }, style]}>{children}</Text>;
  };
export const Hero = mk(type.hero, 'ink');
export const Title = mk(type.title, 'ink');
export const Sub = mk(type.subheading, 'ink');
export const Body = mk(type.body, 'ink');
export const Label = mk(type.label, 'ink');
export const Small = mk(type.small, 'muted');

// The brand: VENTO in its own wide rounded typeface (Unbounded), the only place it is used.
export function Wordmark({ size = 24, color }: { size?: number; color?: string }) {
  const colors = useColors();
  return <Text accessibilityRole="header" style={{ fontFamily: fonts.logo, fontSize: size, letterSpacing: size * 0.08, color: color ?? colors.primary }}>VENTO</Text>;
}

// Entrance: fade + rise. Shared value set in an effect (mount `entering` animations can stay stuck on Android).
export function Appear({ children, delay = 0, style, zoom, shift = 0 }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle>; zoom?: boolean; shift?: number }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) p.set(withDelay(delay, withTiming(1, { duration: zoom ? 420 : 320, easing: Easing.out(Easing.cubic) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value), transform: zoom ? [{ scale: 0.5 + 0.5 * p.value }] : [{ translateX: (1 - p.value) * shift }, { translateY: (1 - p.value) * (shift ? 0 : 12) }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

const APressable = Animated.createAnimatedComponent(Pressable);

// Press feedback: a slight shrink and a smooth return (no bounce). No gray overlay, no ripple.
export function Tap({ onPress, children, style, label, disabled }: {
  onPress?: () => void; children: ReactNode; style?: StyleProp<ViewStyle>; label?: string; disabled?: boolean;
}) {
  const k = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: k.value }] }));
  return (
    <APressable
      onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
      onPressIn={() => k.set(withTiming(0.97, { duration: 80 }))}
      onPressOut={() => k.set(withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) }))}
      style={[style, a]}
    >
      {children}
    </APressable>
  );
}

// Counts up to `target` (and between values when it changes).
export function useCountUp(target: number, ms = 800) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const t0 = Date.now(), a = from.current;
    let raf = requestAnimationFrame(function tick() {
      const k = Math.min(1, (Date.now() - t0) / ms);
      from.current = a + (target - a) * (1 - Math.pow(1 - k, 3));
      setV(from.current);
      if (k < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

// Call right before a state change that adds, removes or resizes rows: the layout glides instead of jumping.
export const animar = () =>
  LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));

// A money amount that counts up. It owns the per-frame state so only this text re-renders, not the whole screen.
export function Money({ value, kind = 'sub', color }: { value: number; kind?: 'hero' | 'title' | 'sub' | 'label'; color?: string }) {
  const v = useCountUp(value);
  const C = kind === 'hero' ? Hero : kind === 'title' ? Title : kind === 'sub' ? Sub : Label;
  return <C color={color}>{money(v)}</C>;
}

// `bottom`: for stack screens (no tab bar), keep content clear of the gesture bar / phone edge. Also lifts content above the keyboard.
export function Screen({ children, bottom }: { children: ReactNode; bottom?: boolean }) {
  const colors = useColors();
  return (
    <SafeAreaView edges={bottom ? ['top', 'bottom'] : ['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Edge-to-edge Android doesn't resize the window for the keyboard, so make room here. */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>{children}</KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Selectable card: 2px outline (transparent at rest, so nothing shifts) and a soft fill that fade in.
export function Option({ selected, onPress, children, label }: { selected: boolean; onPress?: () => void; children: ReactNode; label: string }) {
  const colors = useColors();
  const p = useSharedValue(selected ? 1 : 0);
  useEffect(() => { p.set(withTiming(selected ? 1 : 0, { duration: 200, easing: Easing.out(Easing.quad) })); }, [selected, p]);
  // computed out here: animated styles run on the UI thread and can't call ordinary functions like alfa()
  const sinBorde = alfa(colors.primary, 0);
  const a = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], [colors.surface, colors.soft]),
    borderColor: interpolateColor(p.value, [0, 1], [sinBorde, colors.primary]),
  }));
  return (
    <Animated.View style={[{ borderRadius: radius.lg, borderWidth: 2 }, a]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} style={{ padding: space.md - 2 }}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function Button({ label, onPress, kind = 'primary', icon }: {
  label: string; onPress: () => void; kind?: 'primary' | 'soft' | 'ghost'; icon?: ReactNode;
}) {
  const colors = useColors();
  const fg = kind === 'primary' ? colors.onPrimary : colors.primary;
  return (
    <Tap onPress={onPress} label={label} style={[s.btn, kind === 'primary' && { backgroundColor: colors.primary }, kind === 'soft' && { backgroundColor: colors.soft }, kind === 'ghost' && { backgroundColor: colors.surface }]}>
      {icon}
      <Text style={{ fontFamily: fonts.semi, fontSize: 16, color: fg }}>{label}</Text>
    </Tap>
  );
}

// Round icon button (steppers, delete).
export function RoundBtn({ children, onPress, label, soft }: { children: ReactNode; onPress: () => void; label: string; soft?: boolean }) {
  const colors = useColors();
  return (
    <Tap onPress={onPress} label={label} style={[s.round, { backgroundColor: soft ? colors.soft : colors.bg }]}>{children}</Tap>
  );
}

// Selected = primary fill, faded in.
// `block` makes it share the whole row with its siblings (equal widths) instead of hugging the left edge.
export function Chip({ label, on, onPress, block }: { label: string; on?: boolean; onPress?: () => void; block?: boolean }) {
  const colors = useColors();
  const p = useSharedValue(on ? 1 : 0);
  useEffect(() => { p.set(withTiming(on ? 1 : 0, { duration: 180 })); }, [on, p]);
  const bg = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [colors.surface, colors.primary]) }));
  const fg = useAnimatedStyle(() => ({ color: interpolateColor(p.value, [0, 1], [colors.ink, colors.onPrimary]) }));
  return (
    <Tap onPress={onPress} label={label} style={block ? { flex: 1 } : undefined}>
      <Animated.View style={[s.chip, block && { justifyContent: 'center', paddingHorizontal: space.sm }, bg]}>
        <Animated.Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[{ fontFamily: fonts.medium, fontSize: 14 }, fg]}>{label}</Animated.Text>
      </Animated.View>
    </Tap>
  );
}

export function Pill({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: fg }}>{label}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return <View style={[s.card, { backgroundColor: colors.surface }, style]}>{children}</View>;
}
export const Row = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[s.row, style]}>{children}</View>
);

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const colors = useColors();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.semi, fontSize: size * 0.4, color: colors.primary }}>{name.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export function Field({ label, ...p }: TextInputProps & { label?: string }) {
  const colors = useColors();
  return (
    <View style={{ gap: 4, flex: 1 }}>
      {label ? <Small>{label}</Small> : null}
      <TextInput placeholderTextColor={colors.muted} {...p} style={[s.input, { backgroundColor: colors.bg, color: colors.ink }, p.style]} />
    </View>
  );
}

// The search box of the lists. It is loud on purpose (accent outline and a filled magnifier) so nobody mistakes it for decoration.
export function Buscador({ value, onChange, placeholder }: { value: string; onChange: (s: string) => void; placeholder: string }) {
  const colors = useColors();
  const t = useT();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, height: 56, borderRadius: radius.pill, paddingLeft: 10, paddingRight: space.md, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <MagnifyingGlassIcon size={20} color={colors.onPrimary} weight="bold" />
      </View>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} returnKeyType="search"
        accessibilityLabel={t('Buscar')} autoCorrect={false}
        style={{ flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.ink, paddingVertical: 0 }}
      />
      {value ? <Tap onPress={() => onChange('')} label={t('Borrar búsqueda')}><XIcon size={20} color={colors.muted} weight="bold" /></Tap> : null}
    </View>
  );
}

// Money input: digits only, shown with thousands separators as you type.
export function MoneyField({ value, onChange, label, placeholder, onEnd }: {
  value: number; onChange: (n: number) => void; label?: string; placeholder?: string; onEnd?: () => void;
}) {
  return (
    <Field
      label={label} placeholder={placeholder ?? '0'} keyboardType="numeric" onEndEditing={onEnd}
      value={value ? miles(value) : ''} onChangeText={(t) => onChange(num(t))}
    />
  );
}

function SegLabel({ label, i, x }: { label: string; i: number; x: { value: number } }) {
  const colors = useColors();
  const a = useAnimatedStyle(() => ({ color: interpolateColor(Math.max(0, 1 - Math.abs(x.value - i)), [0, 1], [colors.muted, colors.onPrimary]) }));
  return <Animated.Text style={[{ fontFamily: fonts.semi, fontSize: 14 }, a]}>{label}</Animated.Text>;
}

// Equal-width choices in one rounded track; the filled thumb slides to the chosen one.
export function Segment<K extends string>({ options, value, onChange }: {
  options: { k: K; label: string }[]; value: K; onChange: (k: K) => void;
}) {
  const colors = useColors();
  const [w, setW] = useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.k === value));
  const x = useSharedValue(idx);
  useEffect(() => { x.set(withTiming(idx, { duration: 240, easing: Easing.out(Easing.cubic) })); }, [idx, x]);
  const cell = (w - 8) / options.length;
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * cell }] }));
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', backgroundColor: colors.bg, borderRadius: radius.pill, padding: 4 }}>
      {w > 0 && <Animated.View style={[{ position: 'absolute', left: 4, top: 4, width: cell, height: 44, borderRadius: radius.pill, backgroundColor: colors.primary }, thumb]} />}
      {options.map((o, i) => (
        <Tap key={o.k} onPress={() => onChange(o.k)} label={o.label} style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <SegLabel label={o.label} i={i} x={x} />
        </Tap>
      ))}
    </View>
  );
}

// Thin progress bar (paid / total) that fills in.
export function Bar({ value, color, track }: { value: number; color?: string; track?: string }) {
  const colors = useColors();
  const p = useSharedValue(0);
  useEffect(() => { p.set(withTiming(Math.max(0, Math.min(1, value)), { duration: 700, easing: Easing.out(Easing.cubic) })); }, [value, p]);
  const w = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View style={[s.bar, { backgroundColor: track ?? colors.line }]}>
      <Animated.View style={[{ height: '100%', backgroundColor: color ?? colors.primary, borderRadius: radius.pill }, w]} />
    </View>
  );
}

export function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  const colors = useColors();
  const t = useT();
  return (
    <View style={[s.row, { paddingHorizontal: space.lg, paddingVertical: space.sm, gap: space.sm }]}>
      {onBack && <RoundBtn soft label={t('Volver')} onPress={onBack}><CaretLeftIcon size={22} color={colors.primary} weight="bold" /></RoundBtn>}
      <View style={{ flex: 1 }}><Title lines={1}>{title}</Title></View>
      {right}
    </View>
  );
}

// Floating action button. On every visit to the screen it opens leftwards to show what it does, then folds back to a "+".
export function Fab({ onPress, label }: { onPress: () => void; label: string }) {
  const colors = useColors();
  const e = useSharedValue(0);
  const [lw, setLw] = useState(0);
  useFocusEffect(useCallback(() => {
    const open = setTimeout(() => e.set(withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) })), 400);
    const close = setTimeout(() => e.set(withTiming(0, { duration: 320, easing: Easing.inOut(Easing.cubic) })), 2900);
    return () => { clearTimeout(open); clearTimeout(close); e.set(0); };
  }, [e]));
  const box = useAnimatedStyle(() => ({ width: 64 + e.value * lw }));
  const text = useAnimatedStyle(() => ({ opacity: e.value }));
  return (
    <Appear zoom delay={250} style={s.fabWrap}>
      <Tap onPress={onPress} label={label}>
        <Animated.View style={[s.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }, box]}>
          {/* The label lives in a wide, fixed box so it never wraps; the button's overflow clips it while it is narrow.
              Its natural width (measured here once) is how far the button opens. */}
          <Animated.View pointerEvents="none" style={[s.fabLabelBox, text]}>
            <View onLayout={(ev) => setLw(Math.ceil(ev.nativeEvent.layout.width) + 20)}>
              <Text numberOfLines={1} style={{ fontFamily: fonts.semi, fontSize: 15, color: colors.onPrimary }}>{label}</Text>
            </View>
          </Animated.View>
          <View style={s.fabIcon}><PlusIcon size={28} color={colors.onPrimary} weight="bold" /></View>
        </Animated.View>
      </Tap>
    </Appear>
  );
}

const W = 52, H = 32, THUMB = 26;
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const on = useSharedValue(value ? 1 : 0);
  useEffect(() => { on.set(reduced ? (value ? 1 : 0) : withTiming(value ? 1 : 0, { duration: 200 })); }, [value, reduced, on]);
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(on.value, [0, 1], [colors.line, colors.primary]) }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: on.value * (W - THUMB - 6) }] }));
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} onPress={() => onChange(!value)} hitSlop={8}>
      <Animated.View style={[{ width: W, height: H, borderRadius: H / 2, padding: 3, justifyContent: 'center' }, track]}>
        <Animated.View style={[{ width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: colors.thumb }, thumb]} />
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { height: 56, borderRadius: radius.pill, flexDirection: 'row', gap: space.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chip: { minHeight: 40, borderRadius: radius.pill, flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: space.md },
  pill: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  card: { borderRadius: radius.lg, padding: space.md, gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  input: { height: 48, borderRadius: radius.md, paddingHorizontal: space.md, fontFamily: fonts.body, fontSize: 16, borderWidth: 2, borderColor: 'transparent' },
  fabWrap: { position: 'absolute', right: space.lg, bottom: space.lg },
  fabLabelBox: { position: 'absolute', right: 64, top: 0, bottom: 0, width: 320, alignItems: 'flex-end', justifyContent: 'center' },
  fabIcon: { position: 'absolute', right: 0, top: 0, width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  fab: { height: 64, borderRadius: 32, overflow: 'hidden', elevation: 6, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  bar: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
});

// Round badge for a product, the sibling of the box on orders.
export function ProductoIcono() {
  const colors = useColors();
  return (
    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
      <ShoppingBagIcon size={24} color={colors.primary} weight="duotone" />
    </View>
  );
}
