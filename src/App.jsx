import { useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Header from './components/Header';
import UploadModal from './components/UploadModal';
import Gallery from './components/Gallery';

import MusicPlayer from './components/MusicPlayer';
import RomanticParticles from './components/RomanticParticles';
import ProposalSection from './components/ProposalSection';
import TimelineStem from './components/TimelineStem';

// Welcome Screen Component
function WelcomeScreen({ onEnter }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gradient-warm"
    >
      {/* Decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--color-sunflower)]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--color-olive)]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--color-sunflower-light)]/30 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="relative z-10 text-center px-6"
      >
        {/* Sunflower icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, duration: 0.8, type: 'spring', stiffness: 100 }}
          className="text-8xl mb-8"
        >
          🌻
        </motion.div>

        {/* Welcome text */}
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[var(--color-brown)] mb-4">
          Welcome to Our Memories
        </h1>
        <p className="text-[var(--color-brown)]/70 text-lg mb-12 max-w-md mx-auto">
          A beautiful collection of our special moments together
        </p>

        {/* Enter button */}
        <motion.button
          onClick={onEnter}
          className="px-8 py-4 rounded-full bg-[var(--color-brown)] text-white font-semibold text-lg shadow-strong hover:bg-[var(--color-brown-light)] transition-smooth flex items-center gap-3 mx-auto"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <span>Enter Gallery</span>
          <span className="text-2xl">🌻</span>
        </motion.button>

        {/* Subtle hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-[var(--color-brown)]/40 text-sm mt-8"
        >
          Click to start the experience with music
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  const handleEnter = () => {
    setHasEntered(true);
  };

  const handleUploadSuccess = (data) => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const { scrollYProgress } = useScroll();
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.5, 0.9], // Top, Middle, Bottom (Proposal)
    ['#FEF9E7', '#FDEBD0', '#2C1A1D'] // Day -> Golden Hour -> Romantic Night
  );

  return (
    <motion.div style={{ backgroundColor }} className="min-h-screen relative transition-colors duration-1000">
      {/* The Growing Stem Timeline */}
      <TimelineStem />
      {/* Romantic Floating Particles Background */}
      <RomanticParticles />
      {/* Welcome Screen Overlay */}
      <AnimatePresence>
        {!hasEntered && <WelcomeScreen onEnter={handleEnter} />}
      </AnimatePresence>

      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-[var(--color-sunflower)]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-[var(--color-olive)]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-[var(--color-sunflower-light)]/20 rounded-full blur-3xl" />
      </div>

      {/* Header with Upload Button */}
      <Header onUploadClick={() => setIsUploadModalOpen(true)} />

      {/* Main content */}
      <div className="relative z-10 pt-24">
        {/* Gallery */}
        <Gallery refreshTrigger={refreshTrigger} />

        {/* PROPOSAL SURPRISE SECTION */}
        <ProposalSection />

        {/* Footer */}
        <footer className="py-8 text-center text-[var(--color-brown)]/50 text-sm">
          <p className="font-serif italic">
            Made with 💛 and lots of sunflowers
          </p>
        </footer>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Music Player - only render after entering, starts unmuted */}
      {hasEntered && <MusicPlayer autoPlay={true} />}
    </motion.div>
  );
}
