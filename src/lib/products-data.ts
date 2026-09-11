/**
 * @fileoverview Shared product models, defaults, and helper functions for SI-LATECH.
 */

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: 'beams' | 'blocks' | 'packages' | 'accessories';
  badge: string;
  badgeColor?: string;
  price: string;
  unit: string;
  image: string;
  description: string;
  specs: ProductSpec[];
  highlight: string;
  beamType?: 'tbeam' | 'flat';
  order?: number;
  createdAt?: any;
  updatedAt?: any;
}

export const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: 't-beam',
    name: 'Prestressed Concrete T-Beam',
    category: 'beams',
    badge: 'Heavy Duty • NO Formwork Needed',
    badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    price: 'KES 1,200',
    unit: 'per linear meter (KES 2,800 – 3,500 / m² slab)',
    image: '/beam-block-system.png',
    description: 'High-strength inverted T-section precast beams engineered with high-tensile prestressed steel tendons. Completely self-supporting with NO formwork or timber shuttering needed.',
    highlight: 'NO formwork needed • Spans up to 6.5m+ with zero deflection',
    beamType: 'tbeam',
    order: 1,
    specs: [
      { label: 'Formwork', value: 'NO Formwork Needed (Self-Supporting)' },
      { label: 'Completed Slab Cost', value: 'KES 2,800 – 3,500 / m²' },
      { label: 'Profile', value: 'Inverted T-Beam (150mm depth)' },
      { label: 'Concrete Grade', value: 'C50/60 High Strength' },
      { label: 'Compatible Blocks', value: 'T-Beam Hollow Blocks (KES 100)' },
    ],
  },
  {
    id: 'flat-beam',
    name: 'Prestressed Concrete Flat Beam',
    category: 'beams',
    badge: 'Residential Best-Seller',
    badgeColor: 'bg-blue-600 text-white font-bold',
    price: 'KES 545',
    unit: 'per linear meter',
    image: '/beam-block-real.jpg',
    description: 'Ultra cost-effective, compact precast flat beams tailored for residential homes, bungalows, and multi-unit developments with spans up to 4.0 meters. Lightweight for easy manual handling.',
    highlight: 'Lightweight & crane-free manual installation on site',
    beamType: 'flat',
    order: 2,
    specs: [
      { label: 'Profile', value: 'Ribbed Flat Beam (120mm depth)' },
      { label: 'Concrete Grade', value: 'C45/50 High Strength' },
      { label: 'Reinforcement', value: 'Prestressed High-Tensile Wire' },
      { label: 'Recommended Spans', value: 'Safe for Spans ≤ 4.0m' },
      { label: 'Compatible Blocks', value: 'Flat Beam Hollow Blocks (KES 90)' },
    ],
  },
  {
    id: 't-block',
    name: 'T-Beam Hollow Infill Block',
    category: 'blocks',
    badge: 'Precision Interlock',
    badgeColor: 'bg-emerald-600 text-white font-bold',
    price: 'KES 100',
    unit: 'per piece',
    image: '/beam-block-finished.jpg',
    description: 'Lightweight hollow concrete blocks specifically rebated to fit securely onto the lower flanges of SI-LATECH T-Beams, delivering exceptional acoustic and thermal insulation.',
    highlight: 'Reduces overall slab dead load by over 45% compared to solid concrete',
    beamType: 'tbeam',
    order: 3,
    specs: [
      { label: 'Dimensions', value: '400mm (L) × 200mm (W) × 150mm (H)' },
      { label: 'Design Weight', value: 'Approx. 12 - 14 kg / piece' },
      { label: 'Cavity Structure', value: 'Double hollow chamber' },
      { label: 'Acoustic Rating', value: 'Superior floor-to-floor sound dampening' },
      { label: 'Compatible Beam', value: 'T-Beam (KES 1,200/m)' },
    ],
  },
  {
    id: 'flat-block',
    name: 'Flat Beam Hollow Infill Block',
    category: 'blocks',
    badge: 'Most Economical',
    badgeColor: 'bg-amber-600 text-white font-bold',
    price: 'KES 90',
    unit: 'per piece',
    image: '/beam-block-real.jpg',
    description: 'Specially engineered infill blocks with shallow seating shoulders designed to nest alongside our 545/m Flat Beams, producing a level, flush soffit ceiling ready for direct plaster.',
    highlight: 'Lowest cost per m² for residential building slabs in Kenya',
    beamType: 'flat',
    order: 4,
    specs: [
      { label: 'Dimensions', value: '400mm (L) × 200mm (W) × 120mm (H)' },
      { label: 'Design Weight', value: 'Approx. 10 - 12 kg / piece' },
      { label: 'Ceiling Finish', value: 'Flush soffit for direct plaster skim' },
      { label: 'Thermal Comfort', value: 'Hollow insulation traps cool air' },
      { label: 'Compatible Beam', value: 'Flat Beam (KES 545/m)' },
    ],
  },
  {
    id: 'full-slab-package',
    name: 'Complete Slab Materials Package',
    category: 'packages',
    badge: 'All-in-One Site Supply',
    badgeColor: 'bg-purple-600 text-white font-bold',
    price: 'Custom Quote',
    unit: 'turnkey delivered to site',
    image: '/beam-block-finished.jpg',
    description: 'Complete material package bundled and delivered together: Precast Beams cut to architectural spans, Hollow Infill Blocks, BRC Mesh A142, Cement bags, Sand & Ballast aggregate.',
    highlight: 'Save up to 30% overall compared to conventional cast-in-situ slabs',
    order: 5,
    specs: [
      { label: 'Included Components', value: 'Beams + Blocks + BRC + Concrete Materials' },
      { label: 'Cut to Length', value: 'Factory cut to your exact plan dimensions' },
      { label: 'Delivery', value: 'Offloaded directly at your construction site' },
      { label: 'Technical Support', value: 'Free layout drawings & installation guide' },
    ],
  },
  {
    id: 'brc-mesh-props',
    name: 'BRC Mesh & Construction Accessories',
    category: 'accessories',
    badge: 'Site Accessories',
    badgeColor: 'bg-slate-700 text-white font-bold',
    price: 'Wholesale Rates',
    unit: 'available on order',
    image: '/beam-block-system.png',
    description: 'High-tensile welded BRC A142 wire fabric for structural slab screeds, telescopic adjustable steel props, and formwork timber battens for temporary propping during casting.',
    highlight: 'High-strength A142 mesh ensures crack-free structural topping concrete',
    order: 6,
    specs: [
      { label: 'BRC Fabric', value: 'A142 Standard (6mm wire @ 200mm mesh)' },
      { label: 'Steel Props', value: 'Telescopic adjustable 2.0m - 3.8m' },
      { label: 'Timber Support', value: '3×2 treated structural battens' },
      { label: 'Availability', value: 'In stock at Ruiru factory yard' },
    ],
  },
];
