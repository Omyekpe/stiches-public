import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import ContactForm from '../components/ContactForm'
import NeedleThread from '../components/NeedleThread'
import ProductCard from '../components/ProductCard'
import { EASE_IN_OUT, EASE_OUT, Heading, Reveal } from '../components/Reveal'
import { useContact } from '../lib/useContact'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [featured, setFeatured] = useState([])
  const location = useLocation()
  const CONTACT = useContact()

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setFeatured(data ?? []))
  }, [])

  useEffect(() => {
    if (location.hash === '#contact') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location])

  return (
    <div>
      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-28 text-center sm:py-36">
        {/* Dashed seam frame, stitched in once on load */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 inset-y-8 rounded-sm border-2 border-dashed border-thread/30"
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 1.2, delay: 0.3, ease: EASE_IN_OUT }}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-[0.4em] text-thread"
        >
          Bespoke tailoring
        </motion.p>
        <h1 className="mt-5 text-5xl sm:text-7xl" aria-label="Stitches by Liyah">
          {['Stitches', 'by', 'Liyah'].map((word, i) => (
            <span key={word} aria-hidden className="mr-[0.25em] inline-block overflow-hidden pb-2 align-bottom last:mr-0">
              <motion.span
                className={`inline-block ${i === 2 ? 'text-thread-light italic' : ''}`}
                initial={{ transform: 'translateY(110%)' }}
                animate={{ transform: 'translateY(0%)' }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.1, ease: EASE_OUT }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p
          initial={{ opacity: 0, transform: 'translateY(12px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={{ duration: 0.6, delay: 0.55, ease: EASE_OUT }}
          className="mt-6 max-w-xl text-lg leading-relaxed text-cream-dim"
        >
          Bespoke tailoring stitched with precision and thread. Every piece cut, sewn,
          and finished by hand.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, transform: 'translateY(12px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={{ duration: 0.6, delay: 0.7, ease: EASE_OUT }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Link to="/gallery" className="btn-thread">
            View the gallery
          </Link>
          <a
            href="#contact"
            className="px-6 py-3 font-display text-cream-dim transition-colors duration-200 hover:text-cream"
          >
            Get in touch &darr;
          </a>
        </motion.div>
      </section>

      <NeedleThread className="mx-auto max-w-4xl" />

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <Heading>Featured pieces</Heading>
        </div>
        {featured.length === 0 ? (
          <p className="text-center text-cream-dim">
            Featured products will appear here once added from the admin page.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
        <Reveal className="mt-12 text-center">
          <Link
            to="/gallery"
            className="text-sm uppercase tracking-widest text-thread transition-colors duration-200 hover:text-thread-light"
          >
            See every piece &rarr;
          </Link>
        </Reveal>
      </section>

      <NeedleThread className="mx-auto max-w-4xl" />

      <section id="contact" className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:grid-cols-2">
        <Reveal>
          <Heading>Get in touch</Heading>
          <p className="mt-4 text-cream-dim">
            Have a design in mind, or need alterations? Send a message and Liyah will
            reply directly.
          </p>
          <ul className="mt-8 space-y-4 text-cream-dim">
            {[
              [MapPin, CONTACT.address],
              [Mail, CONTACT.email],
              [Phone, CONTACT.phone],
            ].map(([Icon, text]) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-thread/70 text-thread">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </section>
    </div>
  )
}
