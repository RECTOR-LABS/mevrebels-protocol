'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function FloatingActionButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button after scrolling down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsExpanded(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-8 right-8 z-50"
          initial={{ opacity: 0, scale: 0, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 100 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
        >
          <div
            className="relative"
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
          >
            {/* Expanded Label */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  className="absolute right-20 top-1/2 -translate-y-1/2 whitespace-nowrap"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-midnight-black border-2 border-rebellious rounded-lg px-4 py-2 shadow-lg">
                    <div className="text-white font-bold text-sm">View Pitch Deck</div>
                    <div className="text-neutral-gray text-xs">Investor presentation</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Button */}
            <Link href="/pitch-deck">
              <motion.button
                className="relative w-20 h-20 bg-gradient-to-br from-rebellious via-rebellious-red to-rebellious rounded-full shadow-xl shadow-rebellious/50 hover:shadow-2xl hover:shadow-rebellious/70 transition-all flex items-center justify-center group overflow-visible cursor-pointer"
                whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                whileTap={{ scale: 0.9 }}
                aria-label="View Pitch Deck"
              >
                {/* Inner glow effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-rebellious-red to-rebellious rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Rotating gradient border */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, #ef4444, #3b82f6, #10b981, #ef4444)',
                    padding: '2px',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* Icon */}
                <div className="relative z-10 text-white text-3xl font-bold group-hover:scale-110 transition-transform">
                  📊
                </div>

                {/* Multiple pulse rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-rebellious"
                  animate={{
                    scale: [1, 1.8],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-trust-blue"
                  animate={{
                    scale: [1, 1.8],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.5,
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-profit-green"
                  animate={{
                    scale: [1, 1.8],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 1,
                  }}
                />

                {/* Static outer ring */}
                <div className="absolute inset-0 rounded-full border border-rebellious/30 scale-150" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
