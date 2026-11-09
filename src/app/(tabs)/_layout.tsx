import { Tabs } from 'expo-router';
import type { BottomTabBarButtonProps } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { DotsThreeCircleIcon, HouseIcon, PackageIcon, ReceiptIcon, UsersIcon } from '@/icons';
import { fonts } from '@/theme';
import { useColors, useT } from '@/tema';

// Material-3 style: a soft pill grows behind the active icon while its outline fades into the filled glyph.
function TabIcon({ I, focused, color }: { I: typeof HouseIcon; focused: boolean; color: string }) {
  const colors = useColors();
  const p = useSharedValue(focused ? 1 : 0);
  useEffect(() => { p.set(withTiming(focused ? 1 : 0, { duration: 260, easing: Easing.out(Easing.cubic) })); }, [focused, p]);
  const pill = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scaleX: 0.3 + 0.7 * p.value }] }));
  const fill = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.85 + 0.15 * p.value }] }));
  const line = useAnimatedStyle(() => ({ opacity: 1 - p.value }));
  return (
    <View style={{ width: 64, height: 32, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 64, height: 32, borderRadius: 16, backgroundColor: colors.soft }, pill]} />
      <Animated.View style={[{ position: 'absolute' }, line]}><I size={24} color={color} weight="regular" /></Animated.View>
      <Animated.View style={[{ position: 'absolute' }, fill]}><I size={24} color={color} weight="fill" /></Animated.View>
    </View>
  );
}

const icon = (I: typeof HouseIcon) =>
  function Render({ color, focused }: { color: unknown; focused: boolean }) {
    return <TabIcon I={I} focused={focused} color={color as string} />;
  };

// Plain Pressable: the default tab button paints a gray ripple on press.
function TabButton({ children, style, onPress, onLongPress, accessibilityState, accessibilityLabel, testID }: BottomTabBarButtonProps) {
  return (
    <Pressable
      onPress={onPress} onLongPress={onLongPress} style={style} testID={testID}
      accessibilityRole="button" accessibilityState={accessibilityState} accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Pressable>
  );
}

export default function TabsLayout() {
  const colors = useColors();
  const t = useT();
  // Our own tab bar height replaces the default one, so the system inset (gesture bar) must be added back.
  const pad = Math.max(useSafeAreaInsets().bottom, 8);
  return (
    <Tabs screenOptions={{
      headerShown: false, animation: 'shift', sceneStyle: { backgroundColor: colors.bg }, tabBarButton: TabButton,
      tabBarStyle: { backgroundColor: colors.bg, borderTopWidth: 0, elevation: 8, height: 68 + pad, paddingTop: 10, paddingBottom: pad },
      tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted,
      tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12, marginTop: 4 },
    }}>
      <Tabs.Screen name="index" options={{ title: t('Inicio'), tabBarIcon: icon(HouseIcon) }} />
      <Tabs.Screen name="pedidos" options={{ title: t('Pedidos'), tabBarIcon: icon(ReceiptIcon) }} />
      <Tabs.Screen name="productos" options={{ title: t('Productos'), tabBarIcon: icon(PackageIcon) }} />
      <Tabs.Screen name="clientes" options={{ title: t('Clientes'), tabBarIcon: icon(UsersIcon) }} />
      <Tabs.Screen name="mas" options={{ title: t('Más'), tabBarIcon: icon(DotsThreeCircleIcon) }} />
    </Tabs>
  );
}
