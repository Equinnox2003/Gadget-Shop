export type CategoryName =
  | 'TV & Video'
  | 'Camera & Photo'
  | 'Phones & Accessories'
  | 'Video Games'
  | 'Headphones'
  | 'Speakers'
  | 'Computers & Laptops';

export type HeadphoneTag = 'Headphone' | 'Headband' | 'Earpads';

export interface VariantOption {
  name: string;
  stock: number;
}

export interface VariantGroup {
  id: string;
  label: string;
  options: VariantOption[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: CategoryName;
  tag?: HeadphoneTag;
  price: number;
  image: string;
  description: string;
  rating: number;
  stock: number;
  available: boolean;
  colors?: string[];
  variants?: VariantGroup[];
  specs: Record<string, string>;
  createdAt: number;
  popularity: number;
}

export interface CartItem {
  productId: string;
  qty: number;
  selected: Record<string, string>;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  qty: number;
  selected: Record<string, string>;
  category: string;
}

export interface Order {
  id: string;
  date: number;
  items: OrderItemSnapshot[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: OrderStatus;
  customer: { name: string; phone: string; address: string };
  coupon?: string;
}

export interface Settings {
  displayName: string;
  deliveryFee: number;
  defaultDiscount: number;
  currency: string;
  notifications: boolean;
  online: boolean;
}

export type SortKey = 'popularity' | 'newest' | 'oldest' | 'low' | 'high' | 'review';

export interface FilterState {
  query: string;
  category: CategoryName | 'All';
  tag: HeadphoneTag | 'All';
  sort: SortKey;
  minPrice: string;
  maxPrice: string;
}

export const DEFAULT_FILTER: FilterState = {
  query: '',
  category: 'All',
  tag: 'All',
  sort: 'popularity',
  minPrice: '',
  maxPrice: '',
};

export const DEFAULT_SETTINGS: Settings = {
  displayName: 'Howard',
  deliveryFee: 149,
  defaultDiscount: 0,
  currency: '₱',
  notifications: true,
  online: true,
};

const img = (id: string) =>
  `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Sony WH-1000XM5',
    brand: 'Sony',
    category: 'Headphones',
    tag: 'Headphone',
    price: 18999,
    image: img('photo-1505740420928-5e560c06d30e'),
    description:
      'Industry-leading noise cancelling wireless headphones with 30-hour battery life, crystal-clear calls and a lightweight comfortable fit for all-day listening.',
    rating: 4.6,
    stock: 12,
    available: true,
    colors: ['Black', 'Silver', 'Blue'],
    specs: {
      Connectivity: 'Bluetooth 5.2, 3.5mm',
      'Battery Life': 'Up to 30 hours (NC on)',
      'Noise Cancellation': 'Adaptive ANC, 8 mics',
      'Driver Size': '30mm',
      Microphone: '4 beamforming mics',
    },
    createdAt: now - 200 * DAY,
    popularity: 98,
  },
  {
    id: 'p2',
    name: 'JBL Tune 720BT',
    brand: 'JBL',
    category: 'Headphones',
    tag: 'Headphone',
    price: 4299,
    image: img('photo-1545127398-14699f92334b'),
    description:
      'Everyday wireless over-ear headphones with JBL Pure Bass sound, up to 76 hours of battery and multipoint connection for work and play.',
    rating: 4.6,
    stock: 25,
    available: true,
    colors: ['White', 'Black', 'Blue'],
    specs: {
      Connectivity: 'Bluetooth 5.3',
      'Battery Life': 'Up to 76 hours',
      'Noise Cancellation': 'Passive isolation',
      'Driver Size': '40mm',
      Microphone: 'Built-in mic',
    },
    createdAt: now - 160 * DAY,
    popularity: 91,
  },
  {
    id: 'p3',
    name: 'Bose QuietComfort',
    brand: 'Bose',
    category: 'Headphones',
    tag: 'Headphone',
    price: 16499,
    image: img('photo-1583394838336-acd977736f90'),
    description:
      'Legendary Bose noise cancelling with deep, clear audio, adjustable EQ and all-day comfort in a fold-flat design.',
    rating: 4.6,
    stock: 9,
    available: true,
    colors: ['Black', 'White', 'Green'],
    specs: {
      Connectivity: 'Bluetooth 5.1, 3.5mm',
      'Battery Life': 'Up to 24 hours',
      'Noise Cancellation': 'Active NC, 10 levels',
      'Driver Size': '40mm',
      Microphone: 'Voice pickup system',
    },
    createdAt: now - 180 * DAY,
    popularity: 88,
  },
  {
    id: 'p4',
    name: 'Sony Replacement Earpads',
    brand: 'Sony',
    category: 'Headphones',
    tag: 'Earpads',
    price: 999,
    image: img('photo-1590658268037-6bf12165a8df'),
    description:
      'Genuine memory-foam replacement earpads that restore comfort and noise isolation on compatible Sony headphones.',
    rating: 4.4,
    stock: 40,
    available: true,
    specs: {
      Compatibility: 'WH series over-ear',
      Material: 'Memory foam + protein leather',
      'In the Box': '1 pair earpads',
    },
    createdAt: now - 90 * DAY,
    popularity: 55,
  },
  {
    id: 'p5',
    name: 'JBL Cushion Headband',
    brand: 'JBL',
    category: 'Headphones',
    tag: 'Headband',
    price: 799,
    image: img('photo-1484704849700-f032a568e944'),
    description:
      'Soft replacement headband cushion that refreshes the fit of your JBL over-ear headphones in seconds.',
    rating: 4.3,
    stock: 32,
    available: true,
    specs: {
      Compatibility: 'Tune series over-ear',
      Material: 'Padded fabric',
      'In the Box': '1 headband cover',
    },
    createdAt: now - 80 * DAY,
    popularity: 48,
  },
  {
    id: 'p6',
    name: 'Samsung 55" QLED 4K TV',
    brand: 'Samsung',
    category: 'TV & Video',
    price: 42999,
    image: img('photo-1593359677879-a4bb92f829d1'),
    description:
      'See colour in a new light with Quantum Dot 4K, Object Tracking Sound and a slim AirSlim design. The next innovation in TV.',
    rating: 4.7,
    stock: 7,
    available: true,
    variants: [
      {
        id: 'size',
        label: 'Model',
        options: [
          { name: '43"', stock: 5 },
          { name: '55"', stock: 7 },
          { name: '65"', stock: 3 },
        ],
      },
    ],
    specs: {
      'Screen Size': '55 inch',
      Resolution: '4K UHD 3840x2160',
      'Panel Type': 'QLED Quantum Dot',
      'Refresh Rate': '120Hz',
      'Smart TV Platform': 'Tizen',
    },
    createdAt: now - 220 * DAY,
    popularity: 95,
  },
  {
    id: 'p7',
    name: 'LG 48" OLED evo TV',
    brand: 'LG',
    category: 'TV & Video',
    price: 69999,
    image: img('photo-1593784991095-a205069470b6'),
    description:
      'Self-lit OLED evo pixels deliver perfect blacks and vivid colour with a 120Hz panel built for movies and gaming.',
    rating: 4.8,
    stock: 4,
    available: true,
    variants: [
      {
        id: 'size',
        label: 'Model',
        options: [
          { name: '42"', stock: 2 },
          { name: '48"', stock: 4 },
          { name: '55"', stock: 1 },
        ],
      },
    ],
    specs: {
      'Screen Size': '48 inch',
      Resolution: '4K UHD 3840x2160',
      'Panel Type': 'OLED evo',
      'Refresh Rate': '120Hz',
      'Smart TV Platform': 'webOS',
    },
    createdAt: now - 140 * DAY,
    popularity: 82,
  },
  {
    id: 'p8',
    name: 'Canon EOS R50 Kit',
    brand: 'Canon',
    category: 'Camera & Photo',
    price: 45999,
    image: img('photo-1516035069371-29a1b244cc32'),
    description:
      'Compact mirrorless camera with 24.2MP sensor, 4K30 video and fast Dual Pixel autofocus — perfect for creators on the go.',
    rating: 4.7,
    stock: 6,
    available: true,
    specs: {
      Sensor: '24.2MP APS-C CMOS',
      Video: '4K30, Full HD 120p',
      Mount: 'Canon RF',
      Display: '3.0" vari-angle touchscreen',
      Connectivity: 'Wi-Fi, Bluetooth, USB-C',
    },
    createdAt: now - 190 * DAY,
    popularity: 76,
  },
  {
    id: 'p9',
    name: 'Sony Alpha A7 IV Body',
    brand: 'Sony',
    category: 'Camera & Photo',
    price: 129999,
    image: img('photo-1502920917128-1aa500764cbd'),
    description:
      'Full-frame hybrid camera with 33MP sensor, 4K60 10-bit video and advanced real-time tracking autofocus.',
    rating: 4.9,
    stock: 0,
    available: false,
    specs: {
      Sensor: '33MP full-frame BSI CMOS',
      Video: '4K60 10-bit 4:2:2',
      Mount: 'Sony E',
      Display: '3.0" vari-angle touchscreen',
      Connectivity: 'Wi-Fi, Bluetooth, USB-C',
    },
    createdAt: now - 240 * DAY,
    popularity: 70,
  },
  {
    id: 'p10',
    name: 'iPhone 17',
    brand: 'Apple',
    category: 'Phones & Accessories',
    price: 56999,
    image: img('photo-1592750475338-74b7b21085ab'),
    description:
      'The latest iPhone with a Super Retina display, A-series pro performance and an advanced dual-camera system.',
    rating: 4.8,
    stock: 19,
    available: true,
    colors: ['Black', 'White', 'Blue'],
    variants: [
      {
        id: 'storage',
        label: 'Storage',
        options: [
          { name: '128GB', stock: 10 },
          { name: '256GB', stock: 7 },
          { name: '512GB', stock: 2 },
        ],
      },
    ],
    specs: {
      Display: '6.3" Super Retina XDR',
      Processor: 'A19 chip',
      RAM: '8GB',
      Storage: '128GB / 256GB / 512GB',
      Battery: 'Up to 22h video playback',
      Camera: '48MP + 12MP dual',
      'Operating System': 'iOS 26',
    },
    createdAt: now - 20 * DAY,
    popularity: 99,
  },
  {
    id: 'p11',
    name: 'Samsung Galaxy S25',
    brand: 'Samsung',
    category: 'Phones & Accessories',
    price: 47999,
    image: img('photo-1610945415295-d9bbf067e59c'),
    description:
      'Flagship Galaxy with a 120Hz AMOLED display, pro-grade triple camera and all-day intelligent battery.',
    rating: 4.7,
    stock: 14,
    available: true,
    colors: ['Black', 'Silver', 'Blue'],
    variants: [
      {
        id: 'storage',
        label: 'Storage',
        options: [
          { name: '128GB', stock: 8 },
          { name: '256GB', stock: 6 },
        ],
      },
    ],
    specs: {
      Display: '6.2" AMOLED 120Hz',
      Processor: 'Snapdragon 8 Elite',
      RAM: '12GB',
      Storage: '128GB / 256GB',
      Battery: '4000mAh, 25W charging',
      Camera: '50MP + 12MP + 10MP',
      'Operating System': 'Android 16, One UI',
    },
    createdAt: now - 30 * DAY,
    popularity: 90,
  },
  {
    id: 'p12',
    name: 'ASUS ROG Strix G16',
    brand: 'ASUS',
    category: 'Computers & Laptops',
    price: 89999,
    image: img('photo-1603302576837-37561b2e2302'),
    description:
      'Gaming laptop with high-refresh display, RTX graphics and ROG cooling for serious play and creation.',
    rating: 4.7,
    stock: 14,
    available: true,
    variants: [
      {
        id: 'ram',
        label: 'RAM',
        options: [
          { name: '8GB RAM', stock: 5 },
          { name: '16GB RAM', stock: 8 },
          { name: '32GB RAM', stock: 1 },
        ],
      },
    ],
    specs: {
      Processor: 'Intel Core i7-14650HX',
      RAM: '8GB / 16GB / 32GB DDR5',
      Storage: '1TB NVMe SSD',
      GPU: 'RTX 4060 8GB',
      Display: '16" FHD+ 165Hz',
      Battery: '90Wh, 280W adapter',
    },
    createdAt: now - 100 * DAY,
    popularity: 84,
  },
  {
    id: 'p13',
    name: 'Acer Aspire 5 Slim',
    brand: 'Acer',
    category: 'Computers & Laptops',
    price: 32999,
    image: img('photo-1496181133206-80ce9b88a853'),
    description:
      'Everyday slim laptop for work and study with a Full HD IPS display and fast SSD storage.',
    rating: 4.4,
    stock: 3,
    available: true,
    variants: [
      {
        id: 'ram',
        label: 'RAM',
        options: [
          { name: '8GB RAM', stock: 3 },
          { name: '16GB RAM', stock: 0 },
        ],
      },
    ],
    specs: {
      Processor: 'Intel Core i5-1335U',
      RAM: '8GB / 16GB DDR4',
      Storage: '512GB NVMe SSD',
      GPU: 'Intel Iris Xe',
      Display: '15.6" Full HD IPS',
      Battery: 'Up to 8 hours',
    },
    createdAt: now - 120 * DAY,
    popularity: 66,
  },
  {
    id: 'p14',
    name: 'Sony PlayStation 5 Slim',
    brand: 'Sony',
    category: 'Video Games',
    price: 27999,
    image: img('photo-1606813907291-d86efa9b94db'),
    description:
      'Next-gen console with ultra-fast SSD, ray tracing and DualSense haptic feedback for immersive play.',
    rating: 4.9,
    stock: 10,
    available: true,
    specs: {
      Storage: '1TB SSD',
      Resolution: 'Up to 4K 120fps',
      Controller: 'DualSense wireless',
      'In the Box': 'Console, controller, HDMI, stand',
    },
    createdAt: now - 210 * DAY,
    popularity: 93,
  },
  {
    id: 'p15',
    name: 'Nintendo Switch OLED',
    brand: 'Nintendo',
    category: 'Video Games',
    price: 18999,
    image: img('photo-1578303512597-81e6cc155b3e'),
    description:
      'Play at home or on the go with a vibrant 7" OLED screen, wide kickstand and 64GB storage.',
    rating: 4.8,
    stock: 11,
    available: true,
    specs: {
      Display: '7" OLED touchscreen',
      Storage: '64GB + microSD slot',
      Battery: '4.5 - 9 hours',
      'In the Box': 'Console, dock, Joy-Con, straps',
    },
    createdAt: now - 170 * DAY,
    popularity: 86,
  },
  {
    id: 'p16',
    name: 'JBL Flip 6 Portable Speaker',
    brand: 'JBL',
    category: 'Speakers',
    price: 7999,
    image: img('photo-1608043152269-423dbba4e7e1'),
    description:
      'Portable Bluetooth speaker with bold JBL sound, IP67 waterproofing and 12 hours of playtime.',
    rating: 4.5,
    stock: 18,
    available: true,
    colors: ['Black', 'Blue', 'Red'],
    specs: {
      Connectivity: 'Bluetooth 5.1',
      'Battery Life': 'Up to 12 hours',
      Waterproof: 'IP67 dust + waterproof',
      Power: '20W RMS',
    },
    createdAt: now - 110 * DAY,
    popularity: 78,
  },
  {
    id: 'p17',
    name: 'Bose SoundLink Flex',
    brand: 'Bose',
    category: 'Speakers',
    price: 12999,
    image: img('photo-1545454675-3531b543be5d'),
    description:
      'Rugged portable speaker with clear, deep Bose audio and PositionIQ auto-EQ for any placement.',
    rating: 4.6,
    stock: 2,
    available: true,
    colors: ['Black', 'White'],
    specs: {
      Connectivity: 'Bluetooth 4.2',
      'Battery Life': 'Up to 12 hours',
      Waterproof: 'IP67 dust + waterproof',
      Microphone: 'Built-in speakerphone',
    },
    createdAt: now - 130 * DAY,
    popularity: 64,
  },
  {
    id: 'p18',
    name: 'Amazfit GTS Smartwatch',
    brand: 'Amazfit',
    category: 'Phones & Accessories',
    price: 8999,
    image: img('photo-1523275335684-37898b6baf30'),
    description:
      'Slim smartwatch with AMOLED display, 150+ sport modes and 2-week typical battery life.',
    rating: 4.3,
    stock: 16,
    available: true,
    colors: ['Black', 'White'],
    specs: {
      Display: '1.75" AMOLED',
      Battery: 'Up to 14 days typical',
      'Water Resistance': '5 ATM',
      Connectivity: 'Bluetooth 5.3, GPS',
    },
    createdAt: now - 60 * DAY,
    popularity: 58,
  },
];

export const SEED_RECENT = ['Sony headphones', 'Wireless headphones'];
