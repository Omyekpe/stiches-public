import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { EASE_OUT } from './Reveal'

export default function ProductCard({ product, index = 0 }) {
  const label = product.name?.trim() || `Item #${product.id.slice(0, 8)}`

  return (
    <motion.article
      className="group h-full overflow-hidden rounded-lg border border-oxblood-700 bg-oxblood-900 shadow-lg shadow-black/20 transition-[transform,border-color] duration-300 [transition-timing-function:var(--ease-out)] hover:-translate-y-1.5 hover:border-thread/50"
      initial={{ opacity: 0, transform: 'translateY(24px)' }}
      whileInView={{ opacity: 1, transform: 'translateY(0px)' }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08, ease: EASE_OUT }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-oxblood-800">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out)] group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-cream-dim/50">
            No image yet
          </div>
        )}
        {/* Seam stitched round the photo on hover */}
        <div className="pointer-events-none absolute inset-3 rounded-sm border-2 border-dashed border-thread-light opacity-0 transition-opacity duration-300 [transition-timing-function:var(--ease-out)] group-hover:opacity-70" />
        {product.price != null && (
          <p className="absolute right-0 top-4 rounded-l-md bg-thread px-3 py-1 font-display text-sm font-semibold text-oxblood-950 shadow-md">
            &#8358;{Number(product.price).toLocaleString()}
          </p>
        )}
      </div>
      <div className="border-t border-dashed border-thread/60 p-5">
        {product.category && (
          <p className="text-xs uppercase tracking-widest text-thread">{product.category}</p>
        )}
        <h3 className="mt-1 font-display text-xl">{label}</h3>
        {product.description && (
          <p className="mt-2 text-sm leading-relaxed text-cream-dim">{product.description}</p>
        )}
        <Link
          to={`/?product=${encodeURIComponent(label)}#contact`}
          className="group/link mt-4 inline-flex items-center gap-1 text-xs uppercase tracking-widest text-thread transition-colors duration-200 hover:text-thread-light"
        >
          Inquire about this
          <span className="transition-transform duration-200 [transition-timing-function:var(--ease-out)] group-hover/link:translate-x-1">
            &rarr;
          </span>
        </Link>
      </div>
    </motion.article>
  )
}
