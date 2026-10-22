import { createClient } from '@supabase/supabase-js'
import type { Order, Product, Sale, StockMovement } from './data'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = url && key && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)
  ? createClient(url, key)
  : null

type ProductRow = {
  id: number; name: string; category: string; sku: string; price: number; cost?: number
  stock: number; min_stock?: number; status: Product['status']; color: string; description: string
  kiwify_product_id?: string | null; kiwify_checkout_url?: string | null; sob_encomenda?: boolean
}
type OrderRow = {
  id: string; kiwify_order_id: string; email_comprador: string; produto_id: number
  produto_nome: string; quantidade: number; valor: number; custo_unitario: number
  status: Order['status']; criado_em: string
}
type MovementRow = {
  id: number; created_at: string; product_id: number; product_name: string
  quantity: number; reason: string
}

const fail = (message: string): never => { throw new Error(message) }
const client = () => supabase ?? fail('Supabase não configurado.')
const checked = <T,>(data: T | null, error: { message: string } | null): T => {
  if (error) throw new Error(error.message)
  return data ?? fail('Resposta vazia do banco de dados.')
}
const allRows = async <T,>(table: 'categories' | 'products' | 'pedidos' | 'stock_movements', orderBy: string, ascending = false): Promise<T[]> => {
  const rows: T[] = []
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client().from(table).select('*').order(orderBy, { ascending }).range(offset, offset + pageSize - 1)
    const page = checked(data as T[] | null, error)
    rows.push(...page)
    if (page.length < pageSize) return rows
  }
}
const productFromRow = (row: ProductRow): Product => ({
  id: row.id, name: row.name, category: row.category, sku: row.sku,
  price: Number(row.price), cost: Number(row.cost ?? 0), stock: row.stock,
  minStock: row.min_stock ?? 0, status: row.status, color: row.color,
  description: row.description, kiwifyProductId: row.kiwify_product_id ?? null,
  kiwifyCheckoutUrl: row.kiwify_checkout_url ?? null, sobEncomenda: row.sob_encomenda ?? false,
})

const orderFromRow = (row: OrderRow): Order => ({
  id: row.id, kiwifyOrderId: row.kiwify_order_id, email: row.email_comprador,
  productId: row.produto_id, productName: row.produto_nome, quantity: row.quantidade,
  status: row.status, value: Number(row.valor), cost: Number(row.custo_unitario),
  createdAt: row.criado_em,
})

const orderToSale = (order: Order): Sale => ({
  id: order.kiwifyOrderId, customer: order.email, date: order.createdAt, channel: 'Kiwify',
  status: order.status === 'aprovado' ? 'Pago' : order.status === 'reembolsado'
    ? 'Reembolsado' : order.status === 'cancelado' ? 'Cancelado' : 'Pendente',
  items: [{ productId: order.productId, name: order.productName,
    qty: order.quantity, price: order.value / order.quantity, cost: order.cost }],
})

export async function loadCatalog(): Promise<Product[]> {
  const { data, error } = await client().rpc('get_catalog_products')
  return checked(data as ProductRow[] | null, error).map(productFromRow)
}

export async function hasAdminAccess(): Promise<boolean> {
  const { data, error } = await client().from('admin_users').select('email').limit(1)
  return checked(data, error).length > 0
}

export async function loadMyOrders(): Promise<Order[]> {
  return (await allRows<OrderRow>('pedidos', 'criado_em')).map(orderFromRow)
}

export async function loadAdminData() {
  const [categoryRows, productRows, orderRows, movementRows] = await Promise.all([
    allRows<{ name: string }>('categories', 'name', true),
    allRows<ProductRow>('products', 'id'),
    allRows<OrderRow>('pedidos', 'criado_em'),
    allRows<MovementRow>('stock_movements', 'created_at'),
  ])
  const products = productRows.map(productFromRow)
  const orders = orderRows.map(orderFromRow)
  const sales = orders.map(orderToSale)
  const movements: StockMovement[] = movementRows.map((row) => ({
    id: String(row.id), date: row.created_at, productId: row.product_id,
    product: row.product_name, quantity: row.quantity, reason: row.reason,
    type: row.quantity > 0 ? 'Entrada' : 'Saída',
  }))
  return { categories: categoryRows.map((row) => row.name), products, sales, orders, movements }
}

export async function saveCategory(name: string, previousName?: string) {
  const value = name.trim()
  if (!value || value.length > 60) throw new Error('Nome da categoria inválido.')
  const result = previousName
    ? await client().from('categories').update({ name: value }).eq('name', previousName)
    : await client().from('categories').insert({ name: value })
  checked(true, result.error)
}

export async function deleteCategory(name: string) {
  const { error } = await client().from('categories').delete().eq('name', name)
  checked(true, error)
}

export async function saveProduct(product: Product, isNew: boolean) {
  const values = { name: product.name.trim(), category: product.category.trim(), sku: product.sku.trim(),
    price: product.price, cost: product.cost, stock: product.stock, min_stock: product.minStock,
    status: product.status, color: product.color, description: product.description.trim(),
    kiwify_product_id: product.kiwifyProductId?.trim() || null,
    kiwify_checkout_url: product.kiwifyCheckoutUrl?.trim() || null,
    sob_encomenda: Boolean(product.sobEncomenda) }
  const result = isNew
    ? await client().from('products').insert(values)
    : await client().from('products').update(values).eq('id', product.id)
  checked(result.data ?? true, result.error)
}

export async function setProductStatus(id: number, status: Product['status']) {
  const { error } = await client().from('products').update({ status }).eq('id', id)
  checked(true, error)
}

export async function deleteProduct(id: number) {
  const { error } = await client().from('products').delete().eq('id', id)
  checked(true, error)
}

export async function adjustStock(productId: number, quantity: number, reason: string) {
  const { error } = await client().rpc('adjust_stock', { p_product_id: productId, p_quantity: quantity, p_reason: reason })
  checked(true, error)
}
