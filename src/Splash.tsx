import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Logo } from '@/Logo';
import { useTema } from '@/tema';

// The system splash can't change colour while the app runs (Android paints it before any code), so it only covers the
// start-up. This one is drawn right after, in the colour the user picked: the logo settles in, holds a moment, fades out.
SplashScreen.preventAutoHideAsync().catch(() => {});
setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 5000); // if the settings never load, the system splash must not stay forever

export function Splash() {
  const { colors } = useTema();
  const [visible, setVisible] = useState(true);
  const fondo = useSharedValue(1);
  const logo = useSharedValue(0);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {}); // our own is on screen now, so the system one can go
    logo.set(withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    fondo.set(withDelay(950, withTiming(0, { duration: 380 }, (fin) => { if (fin) runOnJS(setVisible)(false); })));
  }, [fondo, logo]);

  const capa = useAnimatedStyle(() => ({ opacity: fondo.value }));
  const marca = useAnimatedStyle(() => ({ opacity: logo.value, transform: [{ scale: 0.82 + 0.18 * logo.value }] }));
  if (!visible) return null;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, capa]}>
      <Animated.View style={marca}><Logo size={200} color={colors.onPrimary} /></Animated.View>
    </Animated.View>
  );
}
