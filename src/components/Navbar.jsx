import { motion, useScroll, useTransform } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import Logo from './Logo'

const links = [
  { to: '/', label: 'Home' },
  { to: '/gallery', label: 'Gallery' },
]

export default function Navbar() {
  // Reading progress is "thread sewn so far" along the header's bottom edge.
  const { scrollYProgress } = useScroll()
  const sewn = useTransform(scrollYProgress, (v) => `inset(0 ${100 - v * 100}% 0 0)`)

  return (
    <header className="sticky top-0 z-40 border-b border-oxblood-700/80 bg-oxblood-950/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <NavLink
          to="/"
          className="group flex items-center gap-2 font-display text-xl tracking-wide transition-transform duration-150 active:scale-[0.97]"
        >
          <Logo className="h-10 w-auto" />
          Stitches by Liyah
        </NavLink>
        <div className="flex items-center gap-8">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative py-1 text-sm uppercase tracking-widest transition-colors duration-200 ${
                  isActive ? 'text-thread-light' : 'text-cream-dim hover:text-cream'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-stitch"
                      transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                      className="absolute -bottom-0.5 left-0 right-0 border-b-2 border-dashed border-thread"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
      <motion.div
        aria-hidden
        style={{ clipPath: sewn }}
        className="absolute inset-x-0 -bottom-px border-b-2 border-dashed border-thread-light"
      />
    </header>
  )
}
