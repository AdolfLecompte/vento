import { Lexend_400Regular, Lexend_500Medium, Lexend_600SemiBold, useFonts } from '@expo-google-fonts/lexend';
import { Unbounded_700Bold } from '@expo-google-fonts/unbounded';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AvisosHost } from '@/AvisosHost';
import { migrate } from '@/db';
import { Feedback } from '@/feedback';
import { TemaProvider, useTema } from '@/tema';

// Everything that paints sits under TemaProvider, which needs the database (it keeps the settings there).
function Pantallas() {
  const { colors, oscuro } = useTema();
  return (
    <>
      <StatusBar style={oscuro ? 'light' : 'dark'} />
      <AvisosHost />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 280, contentStyle: { backgroundColor: colors.bg } }} />
      <Feedback />
    </>
  );
}

export default function Root() {
  const [ready] = useFonts({ Lexend_400Regular, Lexend_500Medium, Lexend_600SemiBold, Unbounded_700Bold });
  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="compraventa.db" onInit={migrate}>
        <TemaProvider>
          <Pantallas />
        </TemaProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
