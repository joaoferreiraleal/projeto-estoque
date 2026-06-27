export const colors = {
  navy950: '#081121',
  navy900: '#0b1629',
  navy800: '#112644',
  navy700: '#1d4778',
  white: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.66)',
  textSubtle: 'rgba(255, 255, 255, 0.46)',
  border: 'rgba(255, 255, 255, 0.14)',
  surface: 'rgba(8, 17, 33, 0.72)',
  surfaceStrong: 'rgba(8, 17, 33, 0.92)',
  green: '#18bf86',
  greenPressed: '#13a977',
  blue: '#3f82ef',
  bluePressed: '#3270d3',
  danger: '#ff8a8a',
} as const;

export const gradients = {
  app: [colors.navy950, colors.navy800, colors.navy700] as const,
  cameraOverlay: [
    'rgba(8, 17, 33, 0.92)',
    'rgba(17, 38, 68, 0.18)',
    'rgba(29, 71, 120, 0.86)',
  ] as const,
} as const;

export const radius = {
  sm: 8,
  md: 10,
} as const;
