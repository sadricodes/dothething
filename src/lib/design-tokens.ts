/**
 * Design tokens for DoTheThing
 * These are used throughout the app for consistency
 */

export const colors = {
  // Primary brand colors
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Task status colors
  ready: '#6B7280',
  inProgress: '#3B82F6',
  blocked: '#F59E0B',
  completed: '#10B981',
  archived: '#9CA3AF',

  // Priority colors (Eisenhower Matrix)
  urgentImportant: '#EF4444',
  notUrgentImportant: '#3B82F6',
  urgentNotImportant: '#F59E0B',
  notUrgentNotImportant: '#6B7280',

  // Gradients for tags
  gradients: {
    sunset: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
    ocean: 'linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%)',
    forest: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)',
    twilight: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
    rose: 'linear-gradient(135deg, #EC4899 0%, #EF4444 100%)',
    candy: 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)',
    sky: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
    fire: 'linear-gradient(135deg, #EAB308 0%, #EF4444 100%)',
  },
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
}

export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
}
