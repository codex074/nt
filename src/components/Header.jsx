import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

export default function Header({ onUploadClick }) {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-40 px-6 py-4"
        >
            <div className="max-w-6xl mx-auto flex items-center justify-between">
                {/* Logo / Title */}
                <motion.div
                    className="flex items-center gap-3"
                    whileHover={{ scale: 1.02 }}
                >
                    <span className="text-3xl">🌻</span>
                    <h1 className="font-serif text-xl md:text-2xl font-semibold text-[var(--color-brown)]">
                        Sunflower Gallery
                    </h1>
                </motion.div>

                {/* Upload Button */}
                <motion.button
                    onClick={onUploadClick}
                    className="w-12 h-12 rounded-full gradient-sunflower flex items-center justify-center shadow-lg hover:shadow-xl transition-smooth"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Upload photo"
                >
                    <Plus size={24} className="text-[var(--color-brown)]" />
                </motion.button>
            </div>
        </motion.header>
    );
}
