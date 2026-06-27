import { Stack } from 'expo-router';

import { colors } from '../src/theme/design';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: colors.navy950,
        },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Estoque' }} />
      <Stack.Screen name="scanner" options={{ title: 'Scanner' }} />
      <Stack.Screen name="summary" options={{ title: 'Resumo' }} />
    </Stack>
  );
}
