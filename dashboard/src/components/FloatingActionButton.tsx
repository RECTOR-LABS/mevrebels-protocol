'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function FloatingActionButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  // Hide FAB on pitch-deck page (no need to link to itself)
  const shouldHide = pathname === '/pitch-deck';

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

  if (shouldHide) return null;

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
                className="relative w-16 h-16 bg-rebellious rounded-full shadow-lg hover:shadow-2xl transition-shadow flex items-center justify-center group overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="View Pitch Deck"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-rebellious to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Icon */}
                <div className="relative z-10 text-white text-2xl font-bold">
                  📊
                </div>

                {/* Pulse ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-rebellious"
                  animate={{
                    scale: [1, 1.5],
                    opacity: [0.8, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
