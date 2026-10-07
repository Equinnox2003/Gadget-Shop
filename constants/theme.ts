export const COLORS = {
  ink: '#1A1A2E',
  muted: '#6B7280',
  faint: '#9CA3AF',
  // 60-30-10 theme: dominant / secondary / accent.
  primary: '#FF80C7',
  primaryDark: '#C14A8B',
  secondary: '#FFDBFD',
  accent: '#FBEFEF',
  // Legacy aliases — all point at the new palette so existing
  // references pick up the retheme without layout changes.
  pink: '#FF80C7',
  pinkDark: '#C14A8B',
  blue: '#FFDBFD',
  blueBorder: '#F0BFE3',
  bg: '#FBEFEF',
  page: '#FBEFEF',
  card: '#FFFFFF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  star: '#F59E0B',
};

export const RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
};

export const CATEGORIES = [
  'TV & Video',
  'Camera & Photo',
  'Phones & Accessories',
  'Video Games',
  'Headphones',
  'Speakers',
  'Computers & Laptops',
] as const;

export const HEADPHONE_TAGS = ['Headphone', 'Headband', 'Earpads'] as const;

export const SORT_OPTIONS = [
  { key: 'popularity', label: 'Popularity' },
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'low', label: 'Low Price' },
  { key: 'high', label: 'High Price' },
  { key: 'review', label: 'Review' },
] as const;

export const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
] as const;

export const PAYMENT_METHODS = ['Cash on Delivery', 'GCash', 'Card'] as const;

export const DEMO_COUPON = 'DISCOUNT20';
export const DEMO_COUPON_RATE = 0.2;
