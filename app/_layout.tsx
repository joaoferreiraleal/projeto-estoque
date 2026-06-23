import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Estoque' }} />
      <Stack.Screen name="scanner" options={{ title: 'Scanner' }} />
    </Stack>
  );
}
