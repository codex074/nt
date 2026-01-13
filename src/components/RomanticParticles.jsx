import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function RomanticParticles() {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        // Create 25 floating particles
        const newParticles = Array.from({ length: 25 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100, // random position %
            y: Math.random() * 100,
            size: Math.random() * 6 + 2, // size between 2px and 8px
            duration: Math.random() * 10 + 10, // 10-20s float duration
            delay: Math.random() * 5,
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute bg-[var(--color-sunflower)] rounded-full opacity-30 shadow-[0_0_10px_var(--color-sunflower)]"
                    style={{
                        left: `${p.x}%`,
                        width: p.size,
                        height: p.size,
                    }}
                    initial={{ y: `${p.y}%`, opacity: 0 }}
                    animate={{
                        y: [
                            `${p.y}%`,
                            `${p.y - 20}%`, // Float up
                            `${p.y}%`, // Float back down slightly
                            `${p.y - 40}%` // Keep going up
                        ],
                        opacity: [0, 0.4, 0.2, 0],
                        scale: [1, 1.2, 0.8, 1],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
}
