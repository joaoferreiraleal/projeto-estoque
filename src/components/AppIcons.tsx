import { BarChart3, ChevronLeft, ScanLine } from 'lucide-react-native';

import { colors } from '../theme/design';

interface IconProps {
  color?: string;
  size?: number;
}

export function ScanIcon({ color = colors.white, size = 17 }: IconProps) {
  return <ScanLine color={color} size={size} strokeWidth={2.15} />;
}

export function ChartIcon({ color = colors.white, size = 17 }: IconProps) {
  return <BarChart3 color={color} size={size} strokeWidth={2.15} />;
}

export function BackIcon({ color = colors.white, size = 22 }: IconProps) {
  return <ChevronLeft color={color} size={size} strokeWidth={2.2} />;
}
