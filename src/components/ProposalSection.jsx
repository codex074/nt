import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ProposalSection() {
    const [isOpened, setIsOpened] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);

    const handleUnlock = () => {
        setIsOpened(true);
        // Small initial burst of magic
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#F4D03F', '#FFFFFF']
        });
    };

    const handleAccept = () => {
        setIsAccepted(true);

        // MASSIVE CELEBRATION
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Random confetti bursts from left and right
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#F4D03F', '#E74C3C', '#FFFFFF'] });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#F4D03F', '#E74C3C', '#FFFFFF'] });
        }, 250);
    };

    return (
        <section className="min-h-[60vh] flex flex-col items-center justify-center py-20 relative overflow-hidden">
            <AnimatePresence mode='wait'>
                {!isOpened ? (
                    <motion.div
                        key="locked"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0, rotate: 10 }}
                        whileHover={{ scale: 1.05 }}
                        className="cursor-pointer flex flex-col items-center gap-4"
                        onClick={handleUnlock}
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, -5, 5, 0],
                                filter: ["drop-shadow(0 0 10px rgba(244, 208, 63, 0.3))", "drop-shadow(0 0 20px rgba(244, 208, 63, 0.6))", "drop-shadow(0 0 10px rgba(244, 208, 63, 0.3))"]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="bg-[var(--color-sunflower)] p-8 rounded-full shadow-2xl relative"
                        >
                            <Lock size={48} className="text-white relative z-10" />
                            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                        </motion.div>

                        <motion.p
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="font-serif text-[var(--color-brown)] text-xl italic"
                        >
                            One final secret awaits...
                        </motion.p>
                        <p className="text-sm text-[var(--color-brown)]/60 font-medium tracking-widest uppercase">
                            Click to unlock
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="proposal"
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="text-center px-4 max-w-2xl mx-auto"
                    >
                        {/* Reveal Animation Content */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: "spring" }}
                            className="mb-8 inline-block"
                        >
                            <div className="text-9xl animate-bounce drop-shadow-xl filter hover:scale-110 transition-transform cursor-pointer">
                                🌻
                            </div>
                        </motion.div>

                        {!isAccepted ? (
                            <div className="bg-[#FFF9E5]/95 backdrop-blur-md p-8 md:p-12 rounded-[3rem] shadow-2xl border border-yellow-400/30 max-w-3xl mx-auto transform hover:scale-[1.01] transition-transform duration-500">
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="font-serif text-[#5D4037] text-3xl mb-8 italic"
                                >
                                    Every moment with you is my favorite memory.
                                </motion.p>


                                <motion.h1
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.5, type: "spring", stiffness: 100 }}
                                    className="font-serif text-5xl md:text-7xl font-bold text-[#5D4037] mb-12 drop-shadow-sm pb-4 leading-tight tracking-wide"
                                >
                                    Will You Marry Me?
                                </motion.h1>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 2.2 }}
                                    className="flex flex-col md:flex-row items-center justify-center gap-6"
                                >
                                    <button
                                        onClick={handleAccept}
                                        className="bg-[var(--color-sunflower)] hover:bg-[var(--color-sunflower-dark)] text-[var(--color-brown)] font-bold text-xl px-12 py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all w-full md:w-auto transform"
                                    >
                                        YES! I Will! 💖
                                    </button>

                                    <button
                                        onClick={handleAccept}
                                        className="bg-white border-2 border-[var(--color-sunflower)] text-[#5D4037] font-medium text-lg px-8 py-3 rounded-full hover:bg-[var(--color-cream)] transition-colors w-full md:w-auto"
                                    >
                                        Absolutely Yes! 🌻
                                    </button>
                                </motion.div>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/80 backdrop-blur-md p-10 rounded-[3rem] shadow-2xl border-4 border-[var(--color-sunflower)]"
                            >
                                <h2 className="font-serif text-4xl md:text-6xl font-bold text-red-500 mb-6 flex items-center justify-center gap-4">
                                    <Heart className="fill-red-500" />
                                    She Said YES!
                                    <Heart className="fill-red-500" />
                                </h2>
                                <p className="text-2xl text-[var(--color-brown)] font-medium">
                                    Forever starts right now. I love you so much! ❤️
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
