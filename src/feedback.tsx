// Our own toast and confirm dialog (nothing native on screen).
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mascota } from '@/Mascota';
import { radius, space } from '@/theme';
import { useColors, useT, useTema } from '@/tema';
import { Appear, Body, Button, Label, Title } from '@/ui';

export type Kind = 'ok' | 'borrar' | 'aviso';
type Toast = { text: string; kind: Kind; id: number };
type Confirm = { title: string; message?: string; ok: string; no: string; done: (v: boolean) => void };
let setToast: (t: Toast | null) => void = () => {};
let setAsk: (c: Confirm | null) => void = () => {};

// The mascot is the one who says it. ok = done (accent colour), borrar = deleted and aviso = something to fix (both dark).
export const notify = (text: string, kind: Kind = 'ok') => setToast({ text, kind, id: Date.now() });
// `title` and `message` come already translated; `ok` and `no` are keys the dialog translates.
export const confirm = (title: string, ok = 'Borrar', message?: string, no = 'Cancelar') =>
  new Promise<boolean>((done) => setAsk({ title, message, ok, no, done }));

const SHOW = 2400, OUT = 240;

function ToastView({ t }: { t: Toast }) {
  const colors = useColors();
  const p = useSharedValue(0); // 0 hidden above, 1 in place
  const pop = useSharedValue(0);
  const { mascota } = useTema();
  const fondo = t.kind === 'ok' ? colors.primary : colors.ink; // ink flips with the mode, so the text uses the opposite
  const texto = t.kind === 'ok' ? colors.onPrimary : colors.bg;
  useEffect(() => {
    p.set(withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    pop.set(withDelay(160, withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.8)) })));
    const h = setTimeout(() => p.set(withTiming(0, { duration: OUT, easing: Easing.in(Easing.cubic) })), SHOW);
    return () => clearTimeout(h);
  }, [p, pop]);
  const box = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value * 1.4), transform: [{ translateY: (1 - p.value) * -28 }, { scale: 0.96 + 0.04 * p.value }] }));
  const icon = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Animated.View style={[s.toast, { backgroundColor: fondo }, box]}>
      <Animated.View style={[s.toastIcon, { backgroundColor: colors.surface }, icon]}><Mascota id={mascota} size={30} animada={false} feliz={t.kind === 'ok'} /></Animated.View>
      <View style={{ flexShrink: 1 }}><Label color={texto}>{t.text}</Label></View>
    </Animated.View>
  );
}

export function Feedback() {
  const colors = useColors();
  const tr = useT();
  const [toast, t] = useState<Toast | null>(null);
  const [ask, a] = useState<Confirm | null>(null);
  const clear = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => { setToast = t; setAsk = a; }, []);
  useEffect(() => {
    if (!toast) return;
    clearTimeout(clear.current);
    clear.current = setTimeout(() => t(null), SHOW + OUT + 40); // unmount only after the exit animation
    return () => clearTimeout(clear.current);
  }, [toast]);

  const close = (v: boolean) => { ask?.done(v); a(null); };
  return (
    <>
      {toast && (
        <SafeAreaView edges={['top']} pointerEvents="none" style={s.toastWrap}>
          <ToastView key={toast.id} t={toast} />
        </SafeAreaView>
      )}
      <Modal visible={!!ask} transparent animationType="fade" onRequestClose={() => close(false)}>
        <Pressable style={[s.scrim, { backgroundColor: colors.scrim }]} onPress={() => close(false)}>
          <Pressable>
            <Appear style={[s.dialog, { backgroundColor: colors.bg }]}>
              <Title>{ask?.title}</Title>
              {ask?.message ? <Body color={colors.muted}>{ask.message}</Body> : null}
              <View style={{ gap: space.sm, marginTop: space.sm }}>
                <Button label={tr(ask?.ok ?? '')} onPress={() => close(true)} />
                <Button label={tr(ask?.no ?? 'Cancelar')} kind="soft" onPress={() => close(false)} />
              </View>
            </Appear>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  toastWrap: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderRadius: radius.pill, paddingLeft: space.sm, paddingRight: space.lg, paddingVertical: space.sm, marginTop: space.sm, maxWidth: '92%' },
  toastIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  scrim: { flex: 1, justifyContent: 'center', padding: space.lg },
  dialog: { borderRadius: radius.lg, padding: space.lg, gap: space.sm },
});
