import { TagColor, TagGradient } from '@/types/tag'

export const tagColors: Record<TagColor, { bg: string; text: string; border: string }> = {
  red: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  orange: { bg: '#FFEDD5', text: '#9A3412', border: '#FDBA74' },
  amber: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  yellow: { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' },
  lime: { bg: '#ECFCCB', text: '#3F6212', border: '#BEF264' },
  green: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  emerald: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  teal: { bg: '#CCFBF1', text: '#115E59', border: '#5EEAD4' },
  cyan: { bg: '#CFFAFE', text: '#155E75', border: '#67E8F9' },
  sky: { bg: '#E0F2FE', text: '#075985', border: '#7DD3FC' },
  blue: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  indigo: { bg: '#E0E7FF', text: '#3730A3', border: '#A5B4FC' },
  violet: { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD' },
  purple: { bg: '#F3E8FF', text: '#6B21A8', border: '#D8B4FE' },
  fuchsia: { bg: '#FAE8FF', text: '#86198F', border: '#F0ABFC' },
  pink: { bg: '#FCE7F3', text: '#9F1239', border: '#F9A8D4' },
  rose: { bg: '#FFE4E6', text: '#9F1239', border: '#FDA4AF' },
  gray: { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
}

export const tagGradients: Record<TagGradient, string> = {
  sunset: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
  ocean: 'linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%)',
  forest: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)',
  twilight: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
  rose: 'linear-gradient(135deg, #EC4899 0%, #EF4444 100%)',
  candy: 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)',
  sky: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
  fire: 'linear-gradient(135deg, #EAB308 0%, #EF4444 100%)',
}

export function getTagStyle(color: TagColor | null, gradient: TagGradient | null) {
  if (gradient) {
    return {
      background: tagGradients[gradient],
      color: '#FFFFFF',
      border: 'none',
    }
  }

  if (color) {
    const colorDef = tagColors[color]
    return {
      backgroundColor: colorDef.bg,
      color: colorDef.text,
      borderColor: colorDef.border,
    }
  }

  // Default gray
  return {
    backgroundColor: tagColors.gray.bg,
    color: tagColors.gray.text,
    borderColor: tagColors.gray.border,
  }
}
