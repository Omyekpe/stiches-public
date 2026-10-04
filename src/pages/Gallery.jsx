import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { Heading } from '../components/Reveal'
import { supabase } from '../lib/supabaseClient'

export default function Gallery() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [searchParams] = useSearchParams()
  const highlight = searchParams.get('highlight')?.trim().toLowerCase()

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProducts(data ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!highlight || products.length === 0) return
    const match = products.find((p) => p.name?.trim().toLowerCase() === highlight)
    if (match) {
      document.getElementById(`product-${match.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [highlight, products])

  const categories = useMemo(
    () => ['All', ...new Set(products.map((p) => p.category?.trim()).filter(Boolean))],
    [products],
  )
  const visible =
    category === 'All' ? products : products.filter((p) => p.category?.trim() === category)

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <Heading>The Gallery</Heading>
        <p className="mx-auto mt-4 max-w-xl text-cream-dim">
          Every piece stitched by Liyah, one thread at a time.
        </p>
      </div>

      {categories.length > 2 && (
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`relative rounded-full px-4 py-1.5 text-xs uppercase tracking-widest transition-[color,transform] duration-200 active:scale-[0.97] ${
                category === c ? 'text-oxblood-950' : 'text-cream-dim hover:text-cream'
              }`}
            >
              {category === c && (
                <motion.span
                  layoutId="chip"
                  transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                  className="absolute inset-0 rounded-full bg-thread"
                />
              )}
              <span className="relative">{c}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton aspect-[3/4] rounded-lg border border-oxblood-700" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="mt-12 text-center text-cream-dim">
          No products yet — add some from the admin page.
        </p>
      ) : (
        <motion.div layout className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((product, i) => (
              <motion.div
                layout
                key={product.id}
                id={`product-${product.id}`}
                exit={{ opacity: 0, transform: 'scale(0.96)' }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className={
                  highlight && product.name?.trim().toLowerCase() === highlight
                    ? 'rounded-lg ring-2 ring-thread ring-offset-4 ring-offset-oxblood-950'
                    : undefined
                }
              >
                <ProductCard product={product} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  )
}
