import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Activity, ArrowUpRight, Boxes, Check,
  ChevronDown, ChevronRight, CircleDollarSign, Download, Edit3,
  FileBarChart, Filter, LayoutDashboard, LockKeyhole, LogOut, Menu,
  Minus, Package, PackagePlus, Plus, ReceiptText, Search,
  ShoppingBag, ShoppingCart, Sparkles, Store, Tags, Trash2,
  TrendingUp, UserRound, WalletCards, X,
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { initialProducts, type Order, type Product, type Sale, type StockMovement } from './data'
import { supabase, loadCatalog, hasAdminAccess, loadAdminData,
  loadMyOrders, saveProduct as saveDbProduct, setProductStatus, deleteProduct,
  adjustStock as adjustDbStock, saveCategory, deleteCategory } from './supabase'
import { initializeAdvertisingTracking } from './analytics'

gsap.registerPlugin(ScrollTrigger)

type AdminPage = 'dashboard' | 'products' | 'categories' | 'stock' | 'sales' | 'reports'
type View = 'store' | 'admin' | 'login' | 'orders' | 'privacy'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateTime = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

const nav = [
  { id: 'dashboard' as const, label: 'Visão geral', icon: LayoutDashboard },
  { id: 'products' as const, label: 'Produtos', icon: Package },
  { id: 'categories' as const, label: 'Categorias', icon: Tags },
  { id: 'stock' as const, label: 'Estoque', icon: Boxes },
  { id: 'sales' as const, label: 'Vendas', icon: ShoppingCart },
  { id: 'reports' as const, label: 'Relatórios', icon: FileBarChart },
]

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-lockup ${compact ? 'compact' : ''}`} aria-label="DexterLab Impressão 3D">
      <img className="brand-art" src="/dexterlab-logo.png" alt="" width="1140" height="280" />
    </div>
  )
}

function ProductGlyph({ product, large = false }: { product: Product; large?: boolean }) {
  return (
    <div className={`product-glyph ${large ? 'large' : ''}`} style={{ '--product-color': product.color } as React.CSSProperties} aria-hidden="true">
      <div className="print-layer layer-one" />
      <div className="print-layer layer-two" />
      <div className="print-layer layer-three" />
      <div className="print-core"><Boxes /></div>
    </div>
  )
}

function ScrollMotion({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (!root.current || reduced) return
    const context = gsap.context(() => {
      gsap.fromTo(root.current, { y: 34, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 88%', once: true },
      })
    }, root)
    return () => context.revert()
  }, [reduced])
  return <div ref={root} className={className}>{children}</div>
}

function safeCheckoutUrl(value?: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ['pay.kiwify.com.br', 'kiwify.app'].includes(url.hostname)
      && !url.username && !url.password ? url.href : null
  } catch { return null }
}

function Storefront({ products, isAdmin, isLoggedIn, onAdmin, onOrders, onPrivacy, onCookies }: { products: Product[]; isAdmin: boolean; isLoggedIn: boolean; onAdmin: () => void; onOrders: () => void; onPrivacy: () => void; onCookies: () => void }) {
  const reducedMotion = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const [category, setCategory] = useState('Todos')
  const [query, setQuery] = useState('')
  const categories = ['Todos', ...Array.from(new Set(products.map((p) => p.category)))]
  const visible = products.filter((p) => p.status === 'Ativo' && (category === 'Todos' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="storefront">
      <header className="store-header">
        <a href="#inicio"><Logo compact /></a>
        <nav className={menuOpen ? 'open' : ''} aria-label="Navegação principal">
          <a href="#catalogo" onClick={() => setMenuOpen(false)}>Catálogo</a>
          <a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre</a>
          <button className="text-button mobile-nav-only" onClick={onOrders}>{isLoggedIn ? <ShoppingBag size={15} /> : <UserRound size={15} />}{isLoggedIn ? 'Meus pedidos' : 'Login'}</button>
          {isAdmin ? <button className="text-button" onClick={onAdmin}><LockKeyhole size={15} /> Painel administrativo</button> : null}
        </nav>
        <div className="header-actions">
          <button className="button ghost desktop-only" onClick={onOrders}>{isLoggedIn ? <ShoppingBag size={17} /> : <UserRound size={17} />}{isLoggedIn ? 'Meus pedidos' : 'Login'}</button>
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen((v) => !v)} aria-label="Abrir menu" aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-content">
            <motion.div className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><Sparkles size={14} /> Da ideia para o mundo físico</motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08, duration: .7 }}>Precisão em cada <span>camada.</span></motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .16 }}>Impressão 3D de alta qualidade para protótipos, peças funcionais e projetos que merecem sair do papel.</motion.p>
            <motion.div className="hero-actions" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .24 }}>
              <a className="button primary" href="#catalogo">Explorar catálogo <ChevronRight size={17} /></a>
              <a className="button ghost" href="#sobre">Conheça a DexterLab</a>
            </motion.div>
            <motion.div className="trust-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .45 }}>
              <span><strong>3D</strong> impressão</span><span><strong>Sob medida</strong> projetos</span><span><strong>Kiwify</strong> checkout</span>
            </motion.div>
          </div>
          <motion.div className="hero-visual" initial={{ opacity: 0, scale: .94, rotate: 2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: .9, delay: .12 }}>
            <motion.img className="hero-printer" src="/3d-printer-hero.webp" alt="Render 3D de uma impressora produzindo uma peça azul" width="1200" height="1200" fetchPriority="high" animate={reducedMotion ? undefined : { y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
            <div className="floating-tag tag-one"><span>Produção</span><strong>Camada a camada</strong></div>
            <div className="floating-tag tag-two"><span>Projeto</span><strong>Sob medida</strong></div>
          </motion.div>
        </section>

        <div className="marquee-wrap" aria-label="Prototipagem, peças técnicas, design personalizado, produção sob demanda e acabamento premium"><div className="marquee">{[0, 1].map((copy) => <div className="marquee-group" key={copy} aria-hidden="true">{['PROTOTIPAGEM', 'PEÇAS TÉCNICAS', 'DESIGN PERSONALIZADO', 'PRODUÇÃO SOB DEMANDA', 'ACABAMENTO PREMIUM'].map((item) => <span key={item}>{item}<i /></span>)}</div>)}</div></div>

        <section className="section catalog" id="catalogo">
          <ScrollMotion className="section-heading">
            <div><span className="section-kicker">NOSSA SELEÇÃO</span><h2>Objetos que resolvem.<br />Design que permanece.</h2></div>
            <p>Peças projetadas e produzidas com cuidado, prontas para transformar sua rotina.</p>
          </ScrollMotion>
          <ScrollMotion className="catalog-tools">
            <div className="category-chips">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
            <label className="search-field"><Search size={17} /><span className="sr-only">Buscar produtos</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto" /></label>
          </ScrollMotion>
          <div className="product-grid">
            <AnimatePresence mode="popLayout">
              {visible.map((product, index) => (
                <motion.article layout key={product.id} className="product-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .96 }} transition={{ delay: index * .04 }}>
                  <div className="product-image"><ProductGlyph product={product} /></div>
                  <div className="product-meta"><span>{product.category}</span><h3>{product.name}</h3><p>{product.description}</p><strong>{currency.format(product.price)}</strong>{!product.sobEncomenda && product.stock <= 0 ? <span className="checkout-unavailable">Esgotado</span> : safeCheckoutUrl(product.kiwifyCheckoutUrl) ? <a className="button primary buy-button" href={safeCheckoutUrl(product.kiwifyCheckoutUrl)!} target="_blank" rel="noopener noreferrer">Comprar na Kiwify <ArrowUpRight size={16} /></a> : <span className="checkout-unavailable">Em breve</span>}</div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
          {visible.length === 0 ? <p className="catalog-empty">Nenhum produto disponível no momento.</p> : null}
        </section>

        <section className="section about" id="sobre">
          <ScrollMotion className="about-card"><div className="about-mark"><Logo /></div><div><span className="section-kicker">DEXTERLAB</span><h2>Tecnologia com<br />propósito físico.</h2><p>Unimos engenharia, design e fabricação digital para produzir objetos com função, personalidade e precisão.</p><a className="button primary" href="#catalogo">Explorar produtos <ArrowUpRight size={17} /></a></div></ScrollMotion>
        </section>
      </main>
      <footer><Logo compact /><p>© 2026 DexterLab. Checkout e pagamento realizados na Kiwify.</p><div className="footer-links"><button className="text-button" onClick={onPrivacy}>Privacidade e LGPD</button><button className="text-button" onClick={onCookies}>Preferências de cookies</button>{isAdmin ? <button className="text-button" onClick={onAdmin}>Painel administrativo</button> : null}</div></footer>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, tone = 'blue' }: { title: string; value: string; icon: React.ElementType; tone?: string }) {
  return <motion.article className="stat-card" whileHover={{ y: -3 }} transition={{ duration: .2 }}><div className={`stat-icon ${tone}`}><Icon /></div><div className="stat-copy"><span>{title}</span><strong>{value}</strong></div></motion.article>
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><strong>{label}</strong>{payload.map((item) => <span key={item.name}><i style={{ background: item.color }} />{item.name}: {currency.format(item.value)}</span>)}</div>
}

function Dashboard({ products, sales, orders, period, setPeriod }: { products: Product[]; sales: Sale[]; orders: Order[]; period: string; setPeriod: (v: string) => void }) {
  const now = new Date()
  const cutoff = new Date(now)
  if (period === 'Hoje') cutoff.setHours(0, 0, 0, 0)
  else if (period === 'Este ano') { cutoff.setMonth(0, 1); cutoff.setHours(0, 0, 0, 0) }
  else { cutoff.setDate(cutoff.getDate() - (period === '30 dias' ? 29 : 6)); cutoff.setHours(0, 0, 0, 0) }
  const paid = sales.filter((s) => s.status === 'Pago' && new Date(s.date) >= cutoff)
  const revenue = paid.reduce((total, sale) => total + sale.items.reduce((sum, item) => sum + item.price * item.qty, 0), 0)
  const cost = paid.reduce((total, sale) => total + sale.items.reduce((sum, item) => sum + item.cost * item.qty, 0), 0)
  const ticket = revenue / Math.max(paid.length, 1)
  const points = period === 'Hoje' ? 24 : period === '7 dias' ? 7 : period === '30 dias' ? 30 : 12
  const trendData = Array.from({ length: points }, (_, index) => {
    const date = new Date(now)
    if (period === 'Hoje') date.setHours(index, 0, 0, 0)
    else if (period === 'Este ano') { date.setMonth(index, 1); date.setHours(0, 0, 0, 0) }
    else { date.setDate(date.getDate() - points + index + 1); date.setHours(0, 0, 0, 0) }
    const matching = paid.filter((sale) => period === 'Este ano'
      ? new Date(sale.date).getMonth() === index
      : period === 'Hoje' ? new Date(sale.date).getHours() === index
        : new Date(sale.date).toDateString() === date.toDateString())
    return { day: period === 'Este ano' ? new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date)
      : period === 'Hoje' ? `${index}h` : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date),
    revenue: matching.reduce((sum, sale) => sum + sale.items.reduce((n, item) => n + item.qty * item.price, 0), 0),
    cost: matching.reduce((sum, sale) => sum + sale.items.reduce((n, item) => n + item.qty * item.cost, 0), 0) }
  })
  const ranking = products.map((p) => ({ ...p, sold: paid.reduce((total, sale) => total + sale.items.filter((i) => i.productId === p.id).reduce((sum, i) => sum + i.qty, 0), 0) })).sort((a, b) => b.sold - a.sold).slice(0, 5)
  const categoryData = Array.from(new Set(products.map((p) => p.category))).map((name) => ({ name, value: products.filter((p) => p.category === name).reduce((sum, p) => sum + p.stock, 0) }))
  const colors = ['#1688ff', '#4aa4ff', '#316dd9', '#00a9c6', '#6a5cff']
  return <div className="page-stack">
    <PageHeader eyebrow="PAINEL ADMINISTRATIVO" title="Bom dia, Dexter." description="Aqui está o pulso da sua operação hoje." action={<PeriodSelect value={period} onChange={setPeriod} />} />
    <div className="stats-grid"><StatCard title="Faturamento" value={currency.format(revenue)} icon={CircleDollarSign} /><StatCard title="Custo" value={currency.format(cost)} icon={WalletCards} tone="violet" /><StatCard title="Lucro bruto" value={currency.format(revenue - cost)} icon={TrendingUp} tone="cyan" /><StatCard title="Ticket médio" value={currency.format(ticket)} icon={ReceiptText} tone="green" /></div>
    <div className="dashboard-grid">
      <Panel className="revenue-chart" title="Faturamento e custo" subtitle={`Desempenho: ${period.toLowerCase()}`}>
        <div className="chart-legend"><span><i className="dot revenue" />Faturamento</span><span><i className="dot cost" />Custo</span></div>
        <ResponsiveContainer width="100%" height={275}><AreaChart data={trendData} margin={{ top: 16, right: 6, left: -20, bottom: 0 }}><CartesianGrid stroke="#202938" vertical={false} strokeDasharray="4 4" /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#8791a2', fontSize: 12 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#8791a2', fontSize: 11 }} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="revenue" name="Faturamento" stroke="#1688ff" strokeWidth={3} fill="#1688ff" fillOpacity={0.14} /><Area type="monotone" dataKey="cost" name="Custo" stroke="#6a5cff" strokeWidth={2} fill="#6a5cff" fillOpacity={0.07} /></AreaChart></ResponsiveContainer>
      </Panel>
      <Panel title="Estoque por categoria" subtitle="Distribuição das unidades">
        <div className="donut-wrap"><ResponsiveContainer width="100%" height={210}><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86} paddingAngle={4}>{categoryData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{products.reduce((s, p) => s + p.stock, 0)}</strong><span>unidades</span></div></div>
        <div className="mini-legend">{categoryData.slice(0, 4).map((item, i) => <span key={item.name}><i style={{ background: colors[i] }} />{item.name}<strong>{item.value}</strong></span>)}</div>
      </Panel>
      <Panel className="top-products" title="Produtos mais vendidos" subtitle="Ranking por unidades"><div className="ranking-list">{ranking.map((product, i) => <div key={product.id}><b>{String(i + 1).padStart(2, '0')}</b><ProductGlyph product={product} /><span><strong>{product.name}</strong><small>{product.category}</small></span><em>{product.sold} un.</em></div>)}</div></Panel>
      <Panel className="recent-sales" title="Pedidos recentes" subtitle="Status recebidos da Kiwify"><OrdersTable orders={orders.slice(0, 5)} /></Panel>
      <Panel className="alerts" title="Atenção necessária" subtitle="Produtos com estoque baixo"><div className="alert-list">{products.filter((p) => p.stock <= p.minStock).map((p) => <div key={p.id}><span className="alert-icon"><Activity /></span><span><strong>{p.name}</strong><small>{p.stock} em estoque · mínimo {p.minStock}</small></span><button className="button tiny">Repor</button></div>)}</div></Panel>
    </div>
  </div>
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <motion.header className="page-header" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}><div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action ? <div className="page-actions">{action}</div> : null}</motion.header>
}

function Panel({ title, subtitle, action, className = '', children }: { title: string; subtitle?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return <motion.section className={`panel ${className}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}><header><div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>{action}</header>{children}</motion.section>
}

function PeriodSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <label className="select-control"><Filter /><span className="sr-only">Período</span><select value={value} onChange={(e) => onChange(e.target.value)}><option>Hoje</option><option>7 dias</option><option>30 dias</option><option>Este ano</option></select><ChevronDown /></label>
}

function ProductsPage({ products, onEdit, onNew, onToggle, onDelete }: { products: Product[]; onEdit: (p: Product) => void; onNew: () => void; onToggle: (id: number) => void; onDelete: (id: number) => void }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todos')
  const visible = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) && (status === 'Todos' || p.status === status))
  return <div className="page-stack"><PageHeader eyebrow="CATÁLOGO" title="Produtos" description={`${products.length} itens cadastrados no catálogo.`} action={<button className="button primary" onClick={onNew}><PackagePlus /> Novo produto</button>} />
    <Panel title="Catálogo de produtos" subtitle="Cadastre, edite e controle a disponibilidade dos itens." action={<div className="table-tools"><label className="search-field"><Search /><input aria-label="Buscar produtos" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome" /></label><select value={status} onChange={(e) => setStatus(e.target.value)}><option>Todos</option><option>Ativo</option><option>Inativo</option></select></div>}>
      <div className="table-wrap"><table><thead><tr><th>Produto</th><th>SKU</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Status</th><th aria-label="Ações" /></tr></thead><tbody>{visible.map((product) => <tr key={product.id}><td><div className="product-cell"><ProductGlyph product={product} /><span><strong>{product.name}</strong><small>{product.description}</small></span></div></td><td><code>{product.sku}</code></td><td>{product.category}</td><td><strong>{currency.format(product.price)}</strong></td><td><span className={product.stock <= product.minStock ? 'stock-low' : ''}>{product.stock} un.</span></td><td><button className={`status ${product.status.toLowerCase()}`} onClick={() => onToggle(product.id)}><i />{product.status}</button></td><td><div className="row-actions"><button onClick={() => onEdit(product)} aria-label={`Editar ${product.name}`}><Edit3 /></button><button onClick={() => onDelete(product.id)} aria-label={`Excluir ${product.name}`}><Trash2 /></button></div></td></tr>)}</tbody></table></div>
    </Panel></div>
}

function CategoriesPage({ categories, products, onNew, onEdit, onDelete }: { categories: string[]; products: Product[]; onNew: () => void; onEdit: (name: string) => void; onDelete: (name: string) => void }) {
  const summary = categories.map((name) => ({ name, products: products.filter((p) => p.category === name).length, stock: products.filter((p) => p.category === name).reduce((s, p) => s + p.stock, 0) }))
  return <div className="page-stack"><PageHeader eyebrow="ORGANIZAÇÃO" title="Categorias" description="Estruture seu catálogo para encontrar tudo com rapidez." action={<button className="button primary" onClick={onNew}><Plus /> Nova categoria</button>} /><div className="category-admin-grid">{summary.map((c, i) => <motion.article className="category-admin-card" key={c.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }}><div className="category-icon"><Tags /></div><div><h3>{c.name}</h3><p>{c.products} produtos · {c.stock} unidades</p></div><div className="row-actions"><button className="icon-button" onClick={() => onEdit(c.name)} aria-label={`Editar ${c.name}`}><Edit3 /></button><button className="icon-button" onClick={() => onDelete(c.name)} disabled={c.products > 0} aria-label={`Excluir ${c.name}`} title={c.products > 0 ? 'Remova os produtos desta categoria antes de excluir' : undefined}><Trash2 /></button></div></motion.article>)}</div></div>
}

function StockPage({ products, movements, onAdjust }: { products: Product[]; movements: StockMovement[]; onAdjust: (p: Product) => void }) {
  return <div className="page-stack"><PageHeader eyebrow="OPERAÇÃO" title="Controle de estoque" description="Acompanhe saldos, mínimos e toda movimentação." /><div className="stock-summary"><div><Boxes /><span><small>Unidades em estoque</small><strong>{products.reduce((s, p) => s + p.stock, 0)}</strong></span></div><div><Activity /><span><small>Abaixo do mínimo</small><strong>{products.filter((p) => p.stock <= p.minStock).length}</strong></span></div><div><CircleDollarSign /><span><small>Valor em estoque</small><strong>{currency.format(products.reduce((s, p) => s + p.cost * p.stock, 0))}</strong></span></div></div>
    <div className="two-column"><Panel title="Posição atual" subtitle="Saldo disponível por produto"><div className="inventory-list">{products.map((p) => <div key={p.id}><ProductGlyph product={p} /><span><strong>{p.name}</strong><small>Mínimo {p.minStock} un.</small></span><div className="stock-bar"><i style={{ width: `${Math.min(100, (p.stock / Math.max(p.minStock * 3, 1)) * 100)}%` }} /></div><b className={p.stock <= p.minStock ? 'stock-low' : ''}>{p.stock}</b><button className="button tiny" onClick={() => onAdjust(p)}>Ajustar</button></div>)}</div></Panel><Panel title="Histórico de estoque" subtitle="Últimas entradas e saídas"><div className="movement-list">{movements.map((m) => <div key={m.id}><span className={`movement-icon ${m.type.toLowerCase()}`}>{m.quantity > 0 ? <Plus /> : <Minus />}</span><span><strong>{m.product}</strong><small>{m.reason} · {dateTime.format(new Date(m.date))}</small></span><b className={m.quantity > 0 ? 'positive' : 'negative'}>{m.quantity > 0 ? '+' : ''}{m.quantity}</b></div>)}</div></Panel></div>
  </div>
}

function OrdersTable({ orders, showBuyer = true }: { orders: Order[]; showBuyer?: boolean }) {
  return <div className="table-wrap"><table><thead><tr><th>Pedido Kiwify</th><th>Produto</th>{showBuyer ? <th>Comprador</th> : null}<th>Data</th><th>Valor</th><th>Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><code>{order.kiwifyOrderId.slice(0, 16)}</code></td><td><strong>{order.productName}</strong></td>{showBuyer ? <td>{order.email}</td> : null}<td>{dateTime.format(new Date(order.createdAt))}</td><td><strong>{currency.format(order.value)}</strong></td><td><span className={`status order-${order.status}`}><i />{order.status}</span></td></tr>)}</tbody></table>{orders.length === 0 ? <p className="table-empty">Nenhum pedido encontrado.</p> : null}</div>
}

function SalesPage({ orders }: { orders: Order[] }) {
  const approved = orders.filter((order) => order.status === 'aprovado')
  const total = approved.reduce((sum, order) => sum + order.value, 0)
  return <div className="page-stack"><PageHeader eyebrow="COMERCIAL" title="Pedidos Kiwify" description="Pagamentos são processados exclusivamente na Kiwify." /><div className="stats-grid mini"><StatCard title="Pedidos aprovados" value={String(approved.length)} icon={ShoppingCart} /><StatCard title="Faturamento" value={currency.format(total)} icon={CircleDollarSign} /><StatCard title="Unidades vendidas" value={String(approved.reduce((sum, order) => sum + order.quantity, 0))} icon={Package} /></div><Panel title="Histórico de pedidos" subtitle="Status sincronizados pelo webhook da Kiwify"><OrdersTable orders={orders} /></Panel></div>
}

function ReportsPage({ sales }: { sales: Sale[] }) {
  const now = new Date()
  const paid = sales.filter((sale) => sale.status === 'Pago')
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), index, 1)
    const matching = paid.filter((sale) => { const when = new Date(sale.date); return when.getFullYear() === date.getFullYear() && when.getMonth() === index })
    const revenue = matching.reduce((sum, sale) => sum + sale.items.reduce((n, item) => n + item.price * item.qty, 0), 0)
    const cost = matching.reduce((sum, sale) => sum + sale.items.reduce((n, item) => n + item.cost * item.qty, 0), 0)
    return { month: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date), revenue, profit: revenue - cost }
  })
  const sumSince = (start: Date) => paid.filter((sale) => new Date(sale.date) >= start)
    .reduce((sum, sale) => sum + sale.items.reduce((n, item) => n + item.price * item.qty, 0), 0)
  const day = new Date(now); day.setHours(0, 0, 0, 0)
  const week = new Date(day); week.setDate(day.getDate() - (day.getDay() + 6) % 7)
  const month = new Date(now.getFullYear(), now.getMonth(), 1)
  const year = new Date(now.getFullYear(), 0, 1)
  const exportCsv = () => {
    const cell = (value: string) => {
      const safe = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value
      return `"${safe.replaceAll('"', '""')}"`
    }
    const rows = [['Pedido', 'Cliente', 'Data', 'Total'], ...sales.map((s) => [s.id, s.customer, s.date, String(s.items.reduce((t, i) => t + i.price * i.qty, 0))])]
    const blob = new Blob(['\uFEFF', rows.map((r) => r.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'dexterlab-vendas.csv'; a.click(); URL.revokeObjectURL(url)
  }
  return <div className="page-stack"><PageHeader eyebrow="INTELIGÊNCIA" title="Relatórios" description="Dados financeiros e operacionais prontos para decisão." action={<button className="button ghost" onClick={exportCsv}><Download /> Exportar CSV</button>} /><Panel title="Evolução financeira" subtitle={`Faturamento e lucro bruto em ${now.getFullYear()}`}><ResponsiveContainer width="100%" height={330}><BarChart data={monthly} margin={{ top: 20, right: 6, left: -10, bottom: 0 }}><CartesianGrid stroke="#202938" vertical={false} strokeDasharray="4 4" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#8791a2' }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#8791a2' }} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="revenue" name="Faturamento" fill="#1688ff" radius={[6, 6, 0, 0]} /><Bar dataKey="profit" name="Lucro" fill="#00a9c6" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></Panel><div className="report-kpis"><div><span>Faturamento diário</span><strong>{currency.format(sumSince(day))}</strong></div><div><span>Faturamento semanal</span><strong>{currency.format(sumSince(week))}</strong></div><div><span>Faturamento mensal</span><strong>{currency.format(sumSince(month))}</strong></div><div><span>Faturamento anual</span><strong>{currency.format(sumSince(year))}</strong></div></div></div>
}

function ProductModal({ product, categories, onClose, onSave }: { product: Product | null | undefined; categories: string[]; onClose: () => void; onSave: (p: Product, isNew: boolean) => void }) {
  const isNew = product === undefined
  const [form, setForm] = useState<Product>(product ?? { id: 0, name: '', category: categories[0] ?? '', sku: '', price: 0, cost: 0, stock: 0, minStock: 2, status: 'Ativo', color: '#1688ff', description: '', kiwifyProductId: '', kiwifyCheckoutUrl: '', sobEncomenda: false })
  const set = (key: keyof Product, value: string | number | boolean) => setForm((p) => ({ ...p, [key]: value }))
  const invalidCheckout = Boolean(form.kiwifyCheckoutUrl && !safeCheckoutUrl(form.kiwifyCheckoutUrl))
  return <Modal title={isNew ? 'Cadastrar produto' : 'Editar produto'} description="Cadastre os dados oficiais e o checkout da Kiwify." onClose={onClose}>
    <form className="form-grid" onSubmit={(e) => { e.preventDefault(); if (!invalidCheckout) onSave(form, isNew) }}>
      <label className="span-2"><span>Nome do produto</span><input required maxLength={80} value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
      <label><span>Categoria</span><select required value={form.category} onChange={(e) => set('category', e.target.value)}><option value="" disabled>Selecione</option>{categories.map((name) => <option key={name}>{name}</option>)}</select></label>
      <label><span>SKU</span><input required pattern="[A-Za-z0-9-]{3,24}" value={form.sku} onChange={(e) => set('sku', e.target.value.toUpperCase())} /></label>
      <label><span>Preço</span><input required min="0" step="0.01" type="number" value={form.price} onChange={(e) => set('price', Number(e.target.value))} /></label>
      <label><span>Custo</span><input required min="0" step="0.01" type="number" value={form.cost} onChange={(e) => set('cost', Number(e.target.value))} /></label>
      <label><span>Estoque</span><input required min="0" type="number" value={form.stock} onChange={(e) => set('stock', Number(e.target.value))} /></label>
      <label><span>Estoque mínimo</span><input required min="0" type="number" value={form.minStock} onChange={(e) => set('minStock', Number(e.target.value))} /></label>
      <label className="span-2"><span>Descrição</span><textarea required maxLength={220} value={form.description} onChange={(e) => set('description', e.target.value)} /></label>
      <label><span>ID do produto na Kiwify</span><input maxLength={120} value={form.kiwifyProductId ?? ''} onChange={(e) => set('kiwifyProductId', e.target.value)} /></label>
      <label><span>Link de checkout da Kiwify</span><input type="url" value={form.kiwifyCheckoutUrl ?? ''} onChange={(e) => set('kiwifyCheckoutUrl', e.target.value)} placeholder="https://pay.kiwify.com.br/..." /></label>
      {invalidCheckout ? <p role="alert" className="form-error span-2">Use um link HTTPS de pay.kiwify.com.br ou kiwify.app.</p> : null}
      <label className="checkbox-field span-2"><input type="checkbox" checked={Boolean(form.sobEncomenda)} onChange={(e) => set('sobEncomenda', e.target.checked)} /><span>Produto sob encomenda — sem baixa automática de estoque</span></label>
      <div className="form-actions span-2"><button type="button" className="button ghost" onClick={onClose}>Cancelar</button><button className="button primary" disabled={!form.category || invalidCheckout || Boolean(form.kiwifyProductId) !== Boolean(form.kiwifyCheckoutUrl)}><Check /> Salvar produto</button></div>
    </form>
  </Modal>
}

function CategoryModal({ previousName, onClose, onSave }: { previousName: string | null; onClose: () => void; onSave: (name: string, previousName?: string) => void }) {
  const [name, setName] = useState(previousName ?? '')
  return <Modal title={previousName ? 'Editar categoria' : 'Nova categoria'} description="Organize os produtos oficiais do catálogo." onClose={onClose}><form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave(name.trim(), previousName ?? undefined) }}><label className="span-2"><span>Nome da categoria</span><input autoFocus required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} /></label><div className="form-actions span-2"><button type="button" className="button ghost" onClick={onClose}>Cancelar</button><button className="button primary" disabled={!name.trim()}><Check /> Salvar categoria</button></div></form></Modal>
}

function StockModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (qty: number, reason: string) => void }) {
  const [qty, setQty] = useState(0); const [reason, setReason] = useState('Produção concluída')
  return <Modal title="Ajustar estoque" description={`${product.name} · saldo atual ${product.stock}`} onClose={onClose}><form className="form-grid" onSubmit={(e) => { e.preventDefault(); if (qty !== 0) onSave(qty, reason) }}><label><span>Quantidade (+ entrada / − saída)</span><input autoFocus required type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} /></label><label><span>Motivo</span><input required maxLength={80} value={reason} onChange={(e) => setReason(e.target.value)} /></label><div className="form-actions span-2"><button type="button" className="button ghost" onClick={onClose}>Cancelar</button><button className="button primary">Confirmar ajuste</button></div></form></Modal>
}

function Modal({ title, description, children, onClose }: { title: string; description: string; children: React.ReactNode; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { closeRef.current?.focus(); const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key) }, [onClose])
  return <motion.div className="modal-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.currentTarget === e.target) onClose() }}><motion.section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="modal" initial={{ opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }}><header><div><h2 id="modal-title">{title}</h2><p>{description}</p></div><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Fechar"><X /></button></header>{children}</motion.section></motion.div>
}

function AdminShell({ categories, products, sales, orders, movements, refresh, onStore, onSignOut }: { categories: string[]; products: Product[]; sales: Sale[]; orders: Order[]; movements: StockMovement[]; refresh: () => Promise<void>; onStore: () => void; onSignOut: () => void }) {
  const [page, setPage] = useState<AdminPage>('dashboard'); const [period, setPeriod] = useState('7 dias'); const [sidebar, setSidebar] = useState(false)
  const [productModal, setProductModal] = useState<Product | null | undefined>(null); const [stockModal, setStockModal] = useState<Product | null>(null); const [categoryModal, setCategoryModal] = useState<string | null | undefined>(undefined); const [toast, setToast] = useState('')
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2800) }
  const run = async (action: () => Promise<void>, message: string, close?: () => void) => {
    try { await action(); await refresh(); close?.(); notify(message) }
    catch (error) { notify(error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.') }
  }
  const saveProduct = (product: Product, isNew: boolean) => { void run(() => saveDbProduct(product, isNew), 'Produto salvo com sucesso.', () => setProductModal(null)) }
  const removeProduct = (id: number) => { if (window.confirm('Excluir este produto? Produtos com vendas devem ser inativados.')) void run(() => deleteProduct(id), 'Produto excluído.') }
  const adjustStock = (qty: number, reason: string) => { if (stockModal) void run(() => adjustDbStock(stockModal.id, qty, reason), 'Estoque atualizado.', () => setStockModal(null)) }
  const toggleProduct = (id: number) => { const product = products.find((p) => p.id === id); if (product) void run(() => setProductStatus(id, product.status === 'Ativo' ? 'Inativo' : 'Ativo'), 'Status atualizado.') }
  const removeCategory = (name: string) => { if (window.confirm(`Excluir a categoria ${name}?`)) void run(() => deleteCategory(name), 'Categoria excluída.') }
  const pageNode = page === 'dashboard' ? <Dashboard products={products} sales={sales} orders={orders} period={period} setPeriod={setPeriod} /> : page === 'products' ? <ProductsPage products={products} onEdit={(p) => setProductModal(p)} onNew={() => setProductModal(undefined)} onToggle={toggleProduct} onDelete={removeProduct} /> : page === 'categories' ? <CategoriesPage categories={categories} products={products} onNew={() => setCategoryModal(null)} onEdit={setCategoryModal} onDelete={removeCategory} /> : page === 'stock' ? <StockPage products={products} movements={movements} onAdjust={setStockModal} /> : page === 'sales' ? <SalesPage orders={orders} /> : <ReportsPage sales={sales} />
  return <div className="admin-shell">
    <aside className={sidebar ? 'open' : ''}><div className="sidebar-brand"><Logo compact /><button className="icon-button mobile-only" onClick={() => setSidebar(false)}><X /></button></div><div className="workspace-pill"><div>DL</div><span><strong>DexterLab</strong><small>Workspace principal</small></span><ChevronDown /></div><nav aria-label="Administração">{nav.map((item) => <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => { setPage(item.id); setSidebar(false) }}><item.icon /><span>{item.label}</span>{item.id === 'stock' && products.some((p) => p.stock <= p.minStock) ? <b>{products.filter((p) => p.stock <= p.minStock).length}</b> : null}</button>)}</nav><div className="sidebar-bottom"><button onClick={onStore}><Store /><span>Ver loja</span><ArrowUpRight /></button><div className="user-pill"><div>DL</div><span><strong>DexterLab</strong><small>Administrador</small></span><button onClick={onSignOut} aria-label="Sair"><LogOut /></button></div></div></aside>
    {sidebar ? <button className="sidebar-overlay" aria-label="Fechar menu" onClick={() => setSidebar(false)} /> : null}
    <div className="admin-main"><div className="mobile-admin-bar"><button className="icon-button" onClick={() => setSidebar(true)}><Menu /></button><Logo compact /><button className="icon-button"><UserRound /></button></div><main><AnimatePresence mode="wait"><motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{pageNode}</motion.div></AnimatePresence></main></div>
    <AnimatePresence>{productModal !== null ? <ProductModal product={productModal} categories={categories} onClose={() => setProductModal(null)} onSave={saveProduct} /> : null}{categoryModal !== undefined ? <CategoryModal previousName={categoryModal} onClose={() => setCategoryModal(undefined)} onSave={(name, previous) => { void run(() => saveCategory(name, previous), 'Categoria salva.', () => setCategoryModal(undefined)) }} /> : null}{stockModal ? <StockModal product={stockModal} onClose={() => setStockModal(null)} onSave={adjustStock} /> : null}{toast ? <motion.div role="status" className="toast" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Check />{toast}</motion.div> : null}</AnimatePresence>
  </div>
}

function LoginPage({ onSendCode, onVerifyCode, onStore }: { onSendCode: (email: string) => Promise<void>; onVerifyCode: (email: string, code: string) => Promise<void>; onStore: () => void }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('')
    try { if (step === 'email') { await onSendCode(email); setStep('code') } else await onVerifyCode(email, code) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao entrar. Tente novamente.') }
    finally { setBusy(false) }
  }
  return <div className="login-page"><button className="text-button login-back" onClick={onStore}>← Voltar à loja</button><motion.main className="login-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}><Logo compact /><div className="login-icon"><LockKeyhole /></div><span className="section-kicker">ACESSO POR E-MAIL</span><h1>Entre na DexterLab</h1><p>{step === 'email' ? 'Enviaremos um código de verificação para o seu e-mail.' : `Digite o código enviado para ${email}.`}</p>{supabase ? <form onSubmit={submit}>{step === 'email' ? <label><span>E-mail</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label> : <label><span>Código de 8 dígitos</span><input type="text" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{8}" maxLength={8} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} /></label>}{error ? <p role="alert" className="login-error">{error}</p> : null}<button className="button primary" disabled={busy}>{busy ? 'Aguarde...' : step === 'email' ? 'Enviar código' : 'Confirmar código'}</button>{step === 'code' ? <button type="button" className="text-button" onClick={() => { setStep('email'); setCode(''); setError('') }}>Usar outro e-mail</button> : null}</form> : <p role="alert" className="login-error">O Supabase ainda não foi configurado. O acesso permanece bloqueado.</p>}</motion.main></div>
}

function MyOrders({ orders, onStore, onSignOut }: { orders: Order[]; onStore: () => void; onSignOut: () => void }) {
  return <div className="orders-page"><header><button className="text-button" onClick={onStore}>← Voltar à loja</button><Logo compact /><button className="text-button" onClick={onSignOut}>Sair</button></header><main><span className="section-kicker">MINHA CONTA</span><h1>Meus pedidos</h1><p>Acompanhe o status das compras feitas na Kiwify com este e-mail.</p><Panel title="Histórico de pedidos" subtitle="Atualizado a partir dos eventos da Kiwify"><OrdersTable orders={orders} showBuyer={false} /></Panel></main></div>
}

type CookieChoice = 'necessary' | 'all'
const CONSENT_KEY = 'dexterlab-cookie-consent-v1'
function readConsent(): CookieChoice | null {
  try { const saved = localStorage.getItem(CONSENT_KEY); return saved === 'necessary' || saved === 'all' ? saved : null }
  catch { return null }
}

function PrivacyPage({ onStore, onCookies }: { onStore: () => void; onCookies: () => void }) {
  return <div className="privacy-page"><header><button className="text-button" onClick={onStore}>← Voltar à loja</button><Logo compact /></header><main><span className="section-kicker">LGPD · TRANSPARÊNCIA</span><h1>Política de Privacidade</h1><p className="privacy-updated">Atualizada em 22 de setembro de 2026.</p><p>A DexterLab usa os dados necessários para operar a loja, autenticar sua conta por código de e-mail e apresentar seus pedidos. O checkout e o pagamento são feitos na Kiwify; a DexterLab não recebe dados completos de cartão.</p><h2>Dados e finalidades</h2><p>Tratamos seu e-mail para enviar o código de acesso. Para mostrar o histórico de compras, recebemos da Kiwify o identificador, status, produto, valor e e-mail associado ao pedido. Dados técnicos de segurança e funcionamento podem ser processados pela hospedagem e pelos provedores de autenticação.</p><h2>Compartilhamento</h2><p>Usamos Supabase para autenticação e banco de dados, Resend para entrega dos e-mails de acesso, Vercel para hospedar o site e Kiwify para o checkout. Cada serviço trata os dados necessários à sua função, sujeito às respectivas políticas.</p><h2>Cookies e armazenamento local</h2><p>Usamos o armazenamento local do navegador para manter sua sessão e sua escolha de cookies. Cookies estritamente necessários não dependem de consentimento. Publicidade e métricas opcionais permanecem desligadas até você consentir e até haver integrações configuradas.</p><h2>Seus direitos e contato</h2><p>Você pode solicitar confirmação de tratamento, acesso, correção, exclusão quando aplicável, portabilidade e informações sobre compartilhamento. Os dados de pedidos podem precisar ser mantidos pelo período exigido por obrigações legais e defesa de direitos. Para exercer seus direitos ou tirar dúvidas sobre o tratamento de dados pela DexterLab, escreva para <a href="mailto:lucas.kawamoto2025@outlook.com.br">lucas.kawamoto2025@outlook.com.br</a>.</p><h2>Segurança e alterações</h2><p>O acesso à área administrativa é restrito a contas autorizadas e os pedidos são protegidos por regras de acesso no banco de dados. Esta política pode ser atualizada; a data acima indicará a versão vigente.</p><button className="button ghost" onClick={onCookies}>Gerenciar cookies</button></main></div>
}

function CookieBanner({ choice, onChoose, onPrivacy }: { choice: CookieChoice | null; onChoose: (value: CookieChoice) => void; onPrivacy: () => void }) {
  if (choice) return null
  return <section className="cookie-banner" role="dialog" aria-label="Preferências de cookies"><div><strong>Privacidade na DexterLab</strong><p>Usamos recursos necessários para a loja e sua conta. Publicidade e métricas opcionais só serão ativadas com sua escolha.</p><button className="text-button" onClick={onPrivacy}>Ler Política de Privacidade</button></div><div className="cookie-actions"><button className="button ghost" onClick={() => onChoose('necessary')}>Somente necessários</button><button className="button primary" onClick={() => onChoose('all')}>Aceitar opcionais</button></div></section>
}

export default function App() {
  const [view, setView] = useState<View>(window.location.pathname === '/privacidade' ? 'privacy' : 'store')
  const [catalog, setCatalog] = useState<Product[]>(supabase ? [] : initialProducts)
  const [categories, setCategories] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [catalogError, setCatalogError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [consent, setConsent] = useState<CookieChoice | null>(readConsent)
  useEffect(() => {
    if (!supabase) return
    let active = true
    void loadCatalog().then((items) => { if (active) setCatalog(items) }).catch(() => { if (active) setCatalogError('O catálogo está temporariamente indisponível.') })
    void supabase.auth.getSession().then(async ({ data: { session } }) => { if (active) setIsLoggedIn(Boolean(session)); if (session && active) { try { setIsAdmin(await hasAdminAccess()) } catch { setIsAdmin(false) } } })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => { setIsLoggedIn(Boolean(session)); if (!session) { setIsAdmin(false); if (event === 'SIGNED_OUT') setView('store') } else window.setTimeout(() => { void hasAdminAccess().then(setIsAdmin).catch(() => setIsAdmin(false)) }, 0) })
    return () => { active = false; subscription.unsubscribe() }
  }, [])
  useEffect(() => { initializeAdvertisingTracking(consent === 'all' ? 'granted' : 'denied') }, [consent])
  useEffect(() => { const onPopState = () => setView(window.location.pathname === '/privacidade' ? 'privacy' : 'store'); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState) }, [])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); document.title = view === 'store' ? 'DexterLab — Impressão 3D' : view === 'privacy' ? 'Política de Privacidade — DexterLab' : view === 'admin' ? 'DexterLab Admin' : 'DexterLab — Minha conta'; document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://www.dexterlabs.com.br${view === 'privacy' ? '/privacidade' : '/'}`) }, [view])
  const refreshAdmin = async () => {
    const data = await loadAdminData()
    setCategories(data.categories); setProducts(data.products); setSales(data.sales); setOrders(data.orders); setMovements(data.movements)
    setCatalog(data.products.filter((p) => p.status === 'Ativo'))
  }
  const openAdmin = async () => {
    if (!supabase) { setView('login'); return }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setView('login'); return }
    try { if (await hasAdminAccess()) { setIsAdmin(true); await refreshAdmin(); setView('admin') } else { setIsAdmin(false); setView('store') } }
    catch { setIsAdmin(false); setView('store') }
  }
  const openOrders = async () => {
    if (!supabase) { setView('login'); return }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setView('login'); return }
    try { setMyOrders(await loadMyOrders()); setView('orders') } catch { setView('login') }
  }
  const sendCode = async (email: string) => {
    if (!supabase) throw new Error('Supabase não configurado.')
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } })
    if (error) throw new Error('Não foi possível enviar o código. Aguarde e tente novamente.')
  }
  const verifyCode = async (email: string, code: string) => {
    if (!supabase) throw new Error('Supabase não configurado.')
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code, type: 'email' })
    if (error) throw new Error('Código inválido ou expirado. Solicite um novo código.')
    setIsLoggedIn(true)
    if (await hasAdminAccess()) { setIsAdmin(true); await refreshAdmin(); setView('admin') }
    else { setIsAdmin(false); setMyOrders(await loadMyOrders()); setView('orders') }
  }
  const signOut = async () => { await supabase?.auth.signOut(); setIsLoggedIn(false); setIsAdmin(false); setCategories([]); setProducts([]); setSales([]); setOrders([]); setMyOrders([]); setMovements([]); setView('store') }
  const openPrivacy = () => { window.history.pushState({}, '', '/privacidade'); setView('privacy') }
  const openStore = () => { if (window.location.pathname !== '/') window.history.pushState({}, '', '/'); setView('store') }
  const chooseConsent = (value: CookieChoice) => { try { localStorage.setItem(CONSENT_KEY, value) } catch { /* Browsers may block storage. */ } setConsent(value) }
  return <><div role="status" className="integration-banner">{!supabase ? 'Prévia demonstrativa: conecte o Supabase para usar dados reais.' : catalogError}</div>{view === 'store' ? <Storefront products={catalog} isAdmin={isAdmin} isLoggedIn={isLoggedIn} onAdmin={() => { void openAdmin() }} onOrders={() => { void openOrders() }} onPrivacy={openPrivacy} onCookies={() => setConsent(null)} /> : view === 'privacy' ? <PrivacyPage onStore={openStore} onCookies={() => setConsent(null)} /> : view === 'login' ? <LoginPage onSendCode={sendCode} onVerifyCode={verifyCode} onStore={openStore} /> : view === 'orders' ? <MyOrders orders={myOrders} onStore={openStore} onSignOut={() => { void signOut() }} /> : isAdmin ? <AdminShell categories={categories} products={products} sales={sales} orders={orders} movements={movements} refresh={refreshAdmin} onStore={openStore} onSignOut={() => { void signOut() }} /> : null}<CookieBanner choice={consent} onChoose={chooseConsent} onPrivacy={openPrivacy} /></>
}
