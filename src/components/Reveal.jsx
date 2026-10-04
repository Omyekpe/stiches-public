import { motion } from 'framer-motion'

export const EASE_OUT = [0.23, 1, 0.32, 1]
export const EASE_IN_OUT = [0.77, 0, 0.175, 1]

// Fade-and-rise when scrolled into view (once). Full transform string stays GPU-accelerated.
export function Reveal({ children, delay = 0, className, as = 'div' }) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, transform: 'translateY(18px)' }}
      whileInView={{ opacity: 1, transform: 'translateY(0px)' }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.5, delay, ease: EASE_OUT }}
    >
      {children}
    </Tag>
  )
}

// Section heading whose dashed seam is stitched in beneath it.
export function Heading({ children, className = '' }) {
  return (
    <Reveal as="h2" className={`font-display text-3xl sm:text-4xl ${className}`}>
      <span className="relative inline-block pb-3">
        {children}
        <motion.span
          aria-hidden
          className="absolute inset-x-0 bottom-0 border-b-2 border-dashed border-thread/70"
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE_IN_OUT }}
        />
      </span>
    </Reveal>
  )
}
