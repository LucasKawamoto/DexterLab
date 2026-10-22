export type Product = {
  id: number
  name: string
  category: string
  sku: string
  price: number
  cost: number
  stock: number
  minStock: number
  status: 'Ativo' | 'Inativo'
  color: string
  description: string
  kiwifyProductId?: string | null
  kiwifyCheckoutUrl?: string | null
  sobEncomenda?: boolean
}

export type Sale = {
  id: string
  customer: string
  date: string
  channel: string
  items: { productId: number; name: string; qty: number; price: number; cost: number }[]
  status: 'Pago' | 'Pendente' | 'Reembolsado' | 'Cancelado'
}

export type Order = {
  id: string
  kiwifyOrderId: string
  email: string
  productId: number
  productName: string
  status: 'aprovado' | 'recusado' | 'reembolsado' | 'cancelado'
  value: number
  cost: number
  quantity: number
  createdAt: string
}

export type StockMovement = {
  id: string
  date: string
  productId: number
  product: string
  type: 'Entrada' | 'Saída' | 'Ajuste'
  quantity: number
  reason: string
}

export const initialProducts: Product[] = [
  { id: 1, name: 'Suporte Headset Hex', category: 'Organização', sku: 'DEX-ORG-001', price: 89.9, cost: 27.4, stock: 14, minStock: 5, status: 'Ativo', color: '#1688ff', description: 'Suporte geométrico para headset com base antiderrapante.' },
  { id: 2, name: 'Dragão Articulado', category: 'Colecionáveis', sku: 'DEX-COL-014', price: 64.9, cost: 18.2, stock: 23, minStock: 8, status: 'Ativo', color: '#6a5cff', description: 'Miniatura articulada impressa em PLA premium.' },
  { id: 3, name: 'Vaso Voronoi', category: 'Decoração', sku: 'DEX-DEC-008', price: 119.9, cost: 36.8, stock: 7, minStock: 4, status: 'Ativo', color: '#00a9c6', description: 'Vaso de design paramétrico com acabamento fosco.' },
  { id: 4, name: 'Organizador Modular', category: 'Organização', sku: 'DEX-ORG-021', price: 74.9, cost: 22.1, stock: 4, minStock: 6, status: 'Ativo', color: '#2473d6', description: 'Módulos empilháveis para bancada e home office.' },
  { id: 5, name: 'Chaveiro Personalizado', category: 'Personalizados', sku: 'DEX-PER-003', price: 24.9, cost: 6.3, stock: 38, minStock: 15, status: 'Ativo', color: '#0582ca', description: 'Chaveiro com nome, marca ou símbolo sob encomenda.' },
  { id: 6, name: 'Engrenagem Técnica', category: 'Peças técnicas', sku: 'DEX-TEC-011', price: 48.9, cost: 14.9, stock: 2, minStock: 5, status: 'Ativo', color: '#3c5ed6', description: 'Reposição técnica em PETG com alta resistência.' },
  { id: 7, name: 'Luminária Lunar', category: 'Decoração', sku: 'DEX-DEC-017', price: 159.9, cost: 57.5, stock: 9, minStock: 3, status: 'Ativo', color: '#2868b8', description: 'Luminária texturizada com iluminação LED quente.' },
  { id: 8, name: 'Protótipo Funcional', category: 'Peças técnicas', sku: 'DEX-TEC-024', price: 249.9, cost: 92, stock: 6, minStock: 2, status: 'Ativo', color: '#0866c6', description: 'Produção rápida a partir do arquivo 3D do cliente.' },
]

const saleSeed = [
  ['#1048', 'Marina Alves', '2026-09-20T14:30:00', 'Instagram', [[2, 2], [5, 1]]],
  ['#1047', 'TechFlow Ltda.', '2026-09-20T11:10:00', 'Site', [[8, 2]]],
  ['#1046', 'Carlos Mendes', '2026-09-19T16:45:00', 'WhatsApp', [[1, 1], [4, 2]]],
  ['#1045', 'Ana Luiza', '2026-09-18T10:20:00', 'Site', [[7, 1], [3, 1]]],
  ['#1044', 'Studio Norte', '2026-09-17T09:12:00', 'Indicação', [[6, 5], [8, 1]]],
  ['#1043', 'Rafael Lima', '2026-09-16T17:03:00', 'Site', [[2, 3], [5, 4]]],
  ['#1042', 'Mobi Office', '2026-09-15T13:26:00', 'WhatsApp', [[1, 3], [4, 6]]],
] as const

export const initialSales: Sale[] = saleSeed.map(([id, customer, date, channel, rawItems], index) => ({
  id,
  customer,
  date,
  channel,
  status: index === 4 ? 'Pendente' : 'Pago',
  items: rawItems.map(([productId, qty]) => {
    const p = initialProducts.find((item) => item.id === productId)!
    return { productId, name: p.name, qty, price: p.price, cost: p.cost }
  }),
}))

export const initialMovements: StockMovement[] = [
  { id: 'm1', date: '2026-09-20T14:31:00', productId: 2, product: 'Dragão Articulado', type: 'Saída', quantity: -2, reason: 'Venda #1048' },
  { id: 'm2', date: '2026-09-20T09:20:00', productId: 5, product: 'Chaveiro Personalizado', type: 'Entrada', quantity: 20, reason: 'Produção concluída' },
  { id: 'm3', date: '2026-09-19T16:46:00', productId: 4, product: 'Organizador Modular', type: 'Saída', quantity: -2, reason: 'Venda #1046' },
  { id: 'm4', date: '2026-09-18T15:10:00', productId: 6, product: 'Engrenagem Técnica', type: 'Ajuste', quantity: -1, reason: 'Controle de qualidade' },
  { id: 'm5', date: '2026-09-17T08:45:00', productId: 1, product: 'Suporte Headset Hex', type: 'Entrada', quantity: 8, reason: 'Produção concluída' },
]

export const trendData = [
  { day: 'Seg', revenue: 1850, cost: 650 },
  { day: 'Ter', revenue: 2420, cost: 830 },
  { day: 'Qua', revenue: 2160, cost: 760 },
  { day: 'Qui', revenue: 3280, cost: 1120 },
  { day: 'Sex', revenue: 3890, cost: 1310 },
  { day: 'Sáb', revenue: 4520, cost: 1530 },
  { day: 'Dom', revenue: 3160, cost: 1080 },
]
