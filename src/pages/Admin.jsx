import { motion } from 'framer-motion'
import { LogOut, Scissors, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { DEFAULT_CONTACT, useContact } from '../lib/useContact'

export default function Admin() {
  const [session, setSession] = useState(undefined) // undefined = checking, null = logged out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <p className="mx-auto max-w-6xl px-6 py-16 text-center text-cream-dim">Loading…</p>
  }

  return session ? <Dashboard /> : <LoginForm />
}

// Root admins must type their password on every visit: a saved session from an
// earlier visit (no flag in this tab's sessionStorage) is signed out.
const FRESH_LOGIN = 'fresh-login'

function signOut() {
  sessionStorage.removeItem(FRESH_LOGIN)
  return supabase.auth.signOut()
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      return
    }
    sessionStorage.setItem(FRESH_LOGIN, '1')
  }

  return (
    <section className="mx-auto max-w-sm px-6 py-24">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, transform: 'translateY(12px)' }}
        animate={{ opacity: 1, transform: 'translateY(0px)' }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="card flex flex-col gap-4 border-dashed p-8"
      >
        <Scissors className="mx-auto h-8 w-8 text-thread" />
        <h1 className="text-center text-3xl">Admin sign in</h1>
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
        <button
          type="submit"
          className="btn-thread"
        >
          Sign in
        </button>
        {error && <p role="alert" className="text-sm text-oxblood-400">{error}</p>}
      </motion.form>
    </section>
  )
}

const emptyProduct = { name: '', price: '', description: '', category: '', featured: false }

const AREAS = ['products', 'inquiries', 'orders', 'ledger', 'contact']

function Dashboard() {
  const [profile, setProfile] = useState(undefined) // undefined = loading, null = no access
  const [tab, setTab] = useState(null)

  useEffect(() => {
    supabase
      .from('admin_profiles')
      .select('role, permissions')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.role === 'root' && !sessionStorage.getItem(FRESH_LOGIN)) {
          signOut()
          return
        }
        setProfile(data ?? null)
      })
  }, [])

  if (profile === undefined) {
    return <p className="mx-auto max-w-6xl px-6 py-16 text-center text-cream-dim">Loading…</p>
  }

  const isRoot = profile?.role === 'root'
  const tabs = [
    ...AREAS.filter((a) => isRoot || profile?.permissions.includes(a)),
    ...(isRoot ? ['admins'] : []),
  ]
  const current = tab && tabs.includes(tab) ? tab : tabs[0]

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl">Admin <span className="text-thread-light italic">desk</span></h1>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-sm text-cream-dim transition-colors duration-150 hover:text-thread"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      {tabs.length === 0 && (
        <p className="text-cream-dim">
          Your account doesn't have access to anything yet. Ask the root admin to give you
          access.
        </p>
      )}

      <div className="mb-8 flex gap-2 overflow-x-auto border-b border-oxblood-700">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-2 capitalize transition-colors duration-150 ${
              current === t ? 'text-thread-light' : 'text-cream-dim hover:text-cream'
            }`}
          >
            {t}
            {current === t && (
              <motion.span
                layoutId="admin-tab"
                transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
                className="absolute inset-x-0 -bottom-px border-b-2 border-dashed border-thread"
              />
            )}
          </button>
        ))}
      </div>

      <motion.div
        key={current}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {current === 'products' && <ProductsPanel />}
        {current === 'inquiries' && <InquiriesPanel />}
        {current === 'orders' && <OrdersPanel />}
        {current === 'ledger' && <LedgerPanel />}
        {current === 'contact' && <ContactPanel />}
        {current === 'admins' && <AdminsPanel />}
      </motion.div>
    </section>
  )
}

function ProductsPanel() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyProduct)
  const [file, setFile] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    setProducts(data ?? [])
  }

  useEffect(() => {
    loadProducts()
  }, [])

  function startEdit(product) {
    setEditingId(product.id)
    setForm({
      name: product.name ?? '',
      price: product.price ?? '',
      description: product.description ?? '',
      category: product.category ?? '',
      featured: product.featured ?? false,
    })
    setFile(null)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyProduct)
    setFile(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    let image_url
    if (file) {
      const safeName = file.name
        .normalize('NFKD')
        .replace(/[^\w.-]+/g, '-')
      const path = `${Date.now()}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(path, file)
      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }
      image_url = supabase.storage.from('products').getPublicUrl(path).data.publicUrl
    }

    const payload = {
      ...form,
      price: form.price === '' ? null : Number(form.price),
      ...(image_url ? { image_url } : {}),
    }

    const { error: saveError } = editingId
      ? await supabase.from('products').update(payload).eq('id', editingId)
      : await supabase.from('products').insert([payload])

    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    resetForm()
    loadProducts()
  }

  async function handleDelete(id) {
    await supabase.from('products').delete().eq('id', id)
    loadProducts()
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 card p-6"
      >
        <h2 className="font-display text-xl">{editingId ? 'Edit product' : 'Add a product'}</h2>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="input"
        />
        <input
          placeholder="Category (e.g. Agbada, Suit)"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="input"
        />
        <textarea
          rows={3}
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-cream-dim"
        />
        <label className="flex items-center gap-2 text-sm text-cream-dim">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          />
          Feature on homepage
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-thread"
          >
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add product'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm text-cream-dim">
              Cancel
            </button>
          )}
        </div>
        {error && <p className="text-sm text-oxblood-400">{error}</p>}
      </form>

      <div className="flex flex-col gap-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between gap-4 row p-4"
          >
            <div className="flex items-center gap-4">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-14 w-14 rounded object-cover"
                />
              )}
              <div>
                <p className="font-display">{product.name}</p>
                <p className="text-xs text-cream-dim">
                  {product.category} {product.featured && '· Featured'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => startEdit(product)}
                className="text-sm text-thread transition-colors duration-150 hover:text-thread-light"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="text-oxblood-400 transition-colors duration-150 hover:text-oxblood-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="text-cream-dim">No products yet — add your first one.</p>
        )}
      </div>
    </div>
  )
}

function InquiriesPanel() {
  const [inquiries, setInquiries] = useState([])
  const [blocked, setBlocked] = useState([])
  const [newBlockEmail, setNewBlockEmail] = useState('')

  async function load() {
    const [{ data: inquiryData }, { data: blockedData }] = await Promise.all([
      supabase.from('inquiries').select('*').order('created_at', { ascending: false }),
      supabase.from('blocked_emails').select('*').order('created_at', { ascending: false }),
    ])
    setInquiries(inquiryData ?? [])
    setBlocked(blockedData ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete(id) {
    await supabase.from('inquiries').delete().eq('id', id)
    load()
  }

  async function blockEmail(email) {
    await supabase.from('blocked_emails').insert([{ email: email.toLowerCase() }])
    load()
  }

  async function unblockEmail(id) {
    await supabase.from('blocked_emails').delete().eq('id', id)
    load()
  }

  const blockedSet = new Set(blocked.map((b) => b.email.toLowerCase()))

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="font-display text-xl">Blocked emails</h2>
        <p className="mt-1 text-sm text-cream-dim">
          Anyone sending from a blocked email can no longer submit the contact form.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!newBlockEmail) return
            blockEmail(newBlockEmail)
            setNewBlockEmail('')
          }}
          className="mt-4 flex gap-3"
        >
          <input
            type="email"
            placeholder="spammer@example.com"
            value={newBlockEmail}
            onChange={(e) => setNewBlockEmail(e.target.value)}
            className="input flex-1"
          />
          <button
            type="submit"
            className="btn-thread"
          >
            Block
          </button>
        </form>
        <div className="mt-4 flex flex-col gap-2">
          {blocked.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between row px-4 py-2"
            >
              <span className="text-sm">{b.email}</span>
              <button
                onClick={() => unblockEmail(b.id)}
                className="text-xs uppercase tracking-widest text-thread transition-colors duration-150 hover:text-thread-light"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-display text-xl">Inquiries</h2>
        <div className="flex flex-col gap-3">
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="row p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display">
                    {inquiry.name}{' '}
                    <span className="text-xs text-cream-dim">({inquiry.email})</span>
                  </p>
                  {inquiry.product_name && (
                    <Link
                      to={`/gallery?highlight=${encodeURIComponent(inquiry.product_name)}`}
                      target="_blank"
                      className="text-xs text-thread underline transition-colors duration-150 hover:text-thread-light"
                    >
                      Re: {inquiry.product_name}
                    </Link>
                  )}
                  <p className="mt-1 text-sm text-cream-dim">{inquiry.message}</p>
                  <p className="mt-2 text-xs text-thread">
                    {new Date(inquiry.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {!blockedSet.has(inquiry.email.toLowerCase()) && (
                    <button
                      onClick={() => blockEmail(inquiry.email)}
                      className="text-xs uppercase tracking-widest text-oxblood-400 transition-colors duration-150 hover:text-oxblood-500"
                    >
                      Block sender
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(inquiry.id)}
                    className="text-oxblood-400 transition-colors duration-150 hover:text-oxblood-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {inquiries.length === 0 && <p className="text-cream-dim">No inquiries yet.</p>}
        </div>
      </div>
    </div>
  )
}

const emptyOrder = { customer: '', item: '', amount: '', paid: false }

function OrdersPanel() {
  const [orders, setOrders] = useState([])
  const [form, setForm] = useState(emptyOrder)
  const [search, setSearch] = useState('')
  const [paidFilter, setPaidFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  async function load() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    setOrders(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    await supabase.from('orders').insert([{ ...form, amount: Number(form.amount) }])
    setForm(emptyOrder)
    load()
  }

  async function togglePaid(order) {
    await supabase.from('orders').update({ paid: !order.paid }).eq('id', order.id)
    load()
  }

  async function handleDelete(id) {
    await supabase.from('orders').delete().eq('id', id)
    load()
  }

  const filtered = orders.filter((o) => {
    if (paidFilter === 'paid' && !o.paid) return false
    if (paidFilter === 'unpaid' && o.paid) return false
    const day = o.created_at.slice(0, 10)
    if (dateFrom && day < dateFrom) return false
    if (dateTo && day > dateTo) return false
    if (search) {
      const q = search.toLowerCase()
      if (!o.customer.toLowerCase().includes(q) && !o.item.toLowerCase().includes(q)) return false
    }
    return true
  })

  const owed = orders.filter((o) => !o.paid).reduce((sum, o) => sum + Number(o.amount), 0)

  return (
    <div>
      <h2 className="font-display text-xl">Orders</h2>
      <p className="mt-1 text-sm text-cream-dim">
        Outstanding: <span className="text-thread-light">&#8358;{owed.toLocaleString()}</span>
      </p>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 card p-6"
        >
          <input
            required
            placeholder="Customer name"
            value={form.customer}
            onChange={(e) => setForm({ ...form, customer: e.target.value })}
            className="input"
          />
          <input
            required
            placeholder="Item / order description"
            value={form.item}
            onChange={(e) => setForm({ ...form, item: e.target.value })}
            className="input"
          />
          <input
            required
            type="number"
            step="0.01"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="input"
          />
          <label className="flex items-center gap-2 text-sm text-cream-dim">
            <input
              type="checkbox"
              checked={form.paid}
              onChange={(e) => setForm({ ...form, paid: e.target.checked })}
            />
            Already paid
          </label>
          <button
            type="submit"
            className="btn-thread"
          >
            Add order
          </button>
        </form>

        <div>
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              placeholder="Search customer or item…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input flex-1 text-sm"
            />
            <select
              value={paidFilter}
              onChange={(e) => setPaidFilter(e.target.value)}
              className="input text-sm"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input text-sm"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input text-sm"
            />
          </div>

          <div className="flex flex-col gap-3">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-4 row p-4"
              >
                <div>
                  <p className="font-display">
                    {order.customer} <span className="text-xs text-cream-dim">— {order.item}</span>
                  </p>
                  <p className="text-xs text-thread">
                    &#8358;{Number(order.amount).toLocaleString()} ·{' '}
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePaid(order)}
                    className={`text-xs uppercase tracking-widest ${
                      order.paid ? 'text-thread-light' : 'text-oxblood-400'
                    }`}
                  >
                    {order.paid ? 'Paid' : 'Unpaid'}
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="text-oxblood-400 transition-colors duration-150 hover:text-oxblood-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-cream-dim">
                {orders.length === 0 ? 'No orders yet.' : 'No orders match your search.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const emptyLedgerEntry = {
  entry_date: new Date().toISOString().slice(0, 10),
  description: '',
  amount: '',
  type: 'income',
}

function monthKeyOf(dateStr) {
  return dateStr.slice(0, 7)
}

function monthLabel(key) {
  return new Date(`${key}-01T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function netOf(list) {
  return list.reduce((sum, e) => sum + (e.type === 'income' ? Number(e.amount) : -Number(e.amount)), 0)
}

function LedgerPanel() {
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState(emptyLedgerEntry)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  async function load() {
    const { data } = await supabase
      .from('ledger_entries')
      .select('*')
      .order('entry_date', { ascending: false })
    setEntries(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    await supabase.from('ledger_entries').insert([{ ...form, amount: Number(form.amount) }])
    setForm(emptyLedgerEntry)
    load()
  }

  async function handleDelete(id) {
    await supabase.from('ledger_entries').delete().eq('id', id)
    load()
  }

  const filtered = entries.filter((e) => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false
    if (dateFrom && e.entry_date < dateFrom) return false
    if (dateTo && e.entry_date > dateTo) return false
    if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const currentMonthKey = new Date().toISOString().slice(0, 7)
  const groups = {}
  for (const e of filtered) {
    const key = monthKeyOf(e.entry_date)
    ;(groups[key] ??= []).push(e)
  }
  if (!groups[currentMonthKey]) groups[currentMonthKey] = []
  const monthKeys = Object.keys(groups).sort().reverse()

  const balance = netOf(entries)

  return (
    <div>
      <h2 className="font-display text-xl">Ledger</h2>
      <p className="mt-1 text-sm text-cream-dim">
        Net balance (all time):{' '}
        <span className={balance >= 0 ? 'text-thread-light' : 'text-oxblood-400'}>
          &#8358;{balance.toLocaleString()}
        </span>
      </p>

      <div className="mt-4 mb-6 flex flex-wrap gap-3">
        <input
          placeholder="Search description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1 text-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input text-sm"
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="input text-sm"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="input text-sm"
        />
      </div>

      <div className="flex flex-col gap-6">
        {monthKeys.map((key) =>
          key === currentMonthKey ? (
            <div key={key}>
              <h3 className="mb-3 font-display text-lg text-thread-light">
                {monthLabel(key)} <span className="text-sm text-cream-dim">(current)</span>
              </h3>
              <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4 card p-6"
                >
                  <input
                    required
                    type="date"
                    value={form.entry_date}
                    onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                    className="input"
                  />
                  <input
                    required
                    placeholder="Description (e.g. fabric, thread, sale)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input"
                  />
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input"
                  />
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="input"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  <button
                    type="submit"
                    className="btn-thread"
                  >
                    Add entry
                  </button>
                </form>

                <LedgerEntryList entries={groups[key]} onDelete={handleDelete} emptyText="No entries yet this month." />
              </div>
            </div>
          ) : (
            <details key={key} className="card">
              <summary className="cursor-pointer select-none px-6 py-4 font-display text-lg">
                {monthLabel(key)}{' '}
                <span className="text-sm text-cream-dim">
                  — {groups[key].length} entr{groups[key].length === 1 ? 'y' : 'ies'} · net{' '}
                  <span className={netOf(groups[key]) >= 0 ? 'text-thread-light' : 'text-oxblood-400'}>
                    &#8358;{netOf(groups[key]).toLocaleString()}
                  </span>
                </span>
              </summary>
              <div className="border-t border-dashed border-thread/40 p-6">
                <LedgerEntryList entries={groups[key]} onDelete={handleDelete} />
              </div>
            </details>
          )
        )}
      </div>
    </div>
  )
}

function LedgerEntryList({ entries, onDelete, emptyText }) {
  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between gap-4 row p-4"
        >
          <div>
            <p className="font-display">{entry.description}</p>
            <p className="text-xs text-cream-dim">{entry.entry_date}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={entry.type === 'income' ? 'text-thread-light' : 'text-oxblood-400'}>
              {entry.type === 'income' ? '+' : '-'}&#8358;{Number(entry.amount).toLocaleString()}
            </span>
            <button onClick={() => onDelete(entry.id)} className="text-oxblood-400 transition-colors duration-150 hover:text-oxblood-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      {entries.length === 0 && emptyText && <p className="text-cream-dim">{emptyText}</p>}
    </div>
  )
}

function ContactPanel() {
  const saved = useContact()
  // Edits overlay the saved values, so the form fills in once they load.
  const [edits, setEdits] = useState({})
  const [status, setStatus] = useState('idle') // idle | saving | saved | error
  const [error, setError] = useState('')
  const form = { ...saved, ...edits }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('saving')
    const { error } = await supabase.from('site_settings').upsert({ id: 1, ...form })
    if (error) {
      setError(error.message)
      setStatus('error')
      return
    }
    setStatus('saved')
  }

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-xl">Contact information</h2>
      <p className="mt-1 text-sm text-cream-dim">
        Shown on the homepage and in the footer of every page.
      </p>
      <form onSubmit={handleSubmit} className="card mt-4 flex flex-col gap-4 p-6">
        {[
          ['address', 'Address'],
          ['email', 'Email'],
          ['phone', 'Phone'],
        ].map(([key, label]) => (
          <label key={key} className="flex flex-col gap-1 text-sm text-cream-dim">
            {label}
            <input
              required
              type={key === 'email' ? 'email' : 'text'}
              placeholder={DEFAULT_CONTACT[key]}
              value={form[key]}
              onChange={(e) => {
                setEdits({ ...edits, [key]: e.target.value })
                setStatus('idle')
              }}
              className="input"
            />
          </label>
        ))}
        <button type="submit" disabled={status === 'saving'} className="btn-thread">
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save contact info'}
        </button>
        {status === 'error' && (
          <p role="alert" className="text-sm text-oxblood-400">
            {error} — if this mentions "site_settings", run the new block at the bottom of
            supabase.sql in the Supabase SQL editor.
          </p>
        )}
      </form>
    </div>
  )
}

// Calls the manage-admins Edge Function (it holds the service-role key).
async function callAdmins(payload) {
  const { data, error } = await supabase.functions.invoke('manage-admins', { body: payload })
  if (error) {
    const detail = await error.context?.json?.().catch(() => null)
    throw new Error(detail?.error || error.message)
  }
  return data
}

const AREA_LABELS = {
  products: 'Products',
  inquiries: 'Inquiries',
  orders: 'Orders',
  ledger: 'Ledger',
  contact: 'Contact',
}

function PermissionChecks({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {AREAS.map((area) => (
        <label key={area} className="flex items-center gap-2 text-sm text-cream-dim">
          <input
            type="checkbox"
            checked={value.includes(area)}
            onChange={(e) =>
              onChange(e.target.checked ? [...value, area] : value.filter((a) => a !== area))
            }
            className="accent-[#c9a227]"
          />
          {AREA_LABELS[area]}
        </label>
      ))}
    </div>
  )
}

function AdminsPanel() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPerms, setNewPerms] = useState([])
  const [newIsRoot, setNewIsRoot] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      const data = await callAdmins({ action: 'list' })
      setAdmins(data.admins)
      setError('')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await callAdmins({
        action: 'create',
        email,
        password,
        permissions: newPerms,
        role: newIsRoot ? 'root' : 'admin',
      })
      setEmail('')
      setPassword('')
      setNewPerms([])
      setNewIsRoot(false)
      await load()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  async function setPermissions(admin, permissions) {
    const previous = admins
    setAdmins(admins.map((a) => (a.id === admin.id ? { ...a, permissions } : a)))
    try {
      await callAdmins({ action: 'setPermissions', id: admin.id, permissions })
      setError('')
    } catch (err) {
      setAdmins(previous)
      setError(err.message)
    }
  }

  async function setRole(admin, role) {
    const message =
      role === 'root'
        ? `Make ${admin.email} a root admin? They will have full access and can add or remove other admins, including you.`
        : `Make ${admin.email} a regular admin? They will lose root access.`
    if (!window.confirm(message)) return
    try {
      await callAdmins({ action: 'setRole', id: admin.id, role })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(admin) {
    if (!window.confirm(`Remove ${admin.email}? They will no longer be able to sign in.`)) return
    try {
      await callAdmins({ action: 'delete', id: admin.id })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-xl">Admins</h2>
      <p className="mt-1 text-sm text-cream-dim">
        Only root admins can see this tab. Tick which parts of the admin page each
        person can use. Changes save as you tick.
      </p>

      <form onSubmit={handleSubmit} className="card mt-4 flex flex-col gap-4 p-6">
        <input
          required
          type="email"
          placeholder="New admin's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          required
          minLength={8}
          type="text"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
        <label className="flex items-center gap-2 text-sm text-cream-dim">
          <input
            type="checkbox"
            checked={newIsRoot}
            onChange={(e) => setNewIsRoot(e.target.checked)}
            className="accent-[#c9a227]"
          />
          Make root admin (full access, can manage other admins)
        </label>
        {!newIsRoot && <PermissionChecks value={newPerms} onChange={setNewPerms} />}
        <button type="submit" disabled={saving} className="btn-thread">
          {saving ? 'Adding…' : 'Add admin'}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-oxblood-400">
          {error}
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-2">
        {loading && <li className="text-sm text-cream-dim">Loading…</li>}
        {admins.map((a) => (
          <li key={a.id} className="card flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate">
                {a.email}
                {a.role === 'root' && (
                  <span className="ml-2 text-xs text-thread-light">(root admin)</span>
                )}
                {a.isMe && a.role !== 'root' && (
                  <span className="ml-2 text-xs text-thread-light">(you)</span>
                )}
              </span>
              {!a.isMe && (
                <div className="flex shrink-0 items-center gap-4">
                  <button
                    onClick={() => setRole(a, a.role === 'root' ? 'admin' : 'root')}
                    className="text-xs text-cream-dim transition-colors duration-150 hover:text-thread"
                  >
                    {a.role === 'root' ? 'Make regular admin' : 'Make root'}
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    aria-label={`Remove ${a.email}`}
                    className="text-cream-dim transition-colors duration-150 hover:text-thread"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            {a.role === 'root' ? (
              <p className="text-sm text-cream-dim">Full access to everything.</p>
            ) : (
              <PermissionChecks
                value={a.permissions}
                onChange={(perms) => setPermissions(a, perms)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
