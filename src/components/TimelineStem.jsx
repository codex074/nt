import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

export default function TimelineStem() {
    const { scrollYProgress } = useScroll();

    // Smooth out the scroll progress
    const scaleY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div className="fixed inset-0 pointer-events-none z-0 flex justify-center">
            {/* The Stem Container */}
            <div className="w-1 h-full relative">
                {/* Background Line (Faint) */}
                <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-[var(--color-sunflower)]/20" />

                {/* Growing Line (Animated) */}
                <motion.div
                    className="absolute top-0 left-1/2 w-1 -translate-x-1/2 bg-[var(--color-olive)] origin-top rounded-full shadow-[0_0_10px_var(--color-olive-light)]"
                    style={{ scaleY, height: "100%" }}
                />

                {/* Decorative Leaves at intervals */}
                {[10, 30, 50, 70, 90].map((pos, i) => (
                    <LeafNode key={i} top={`${pos}%`} side={i % 2 === 0 ? 'left' : 'right'} scrollYProgress={scrollYProgress} target={pos / 100} />
                ))}
            </div>
        </div>
    );
}

function LeafNode({ top, side, scrollYProgress, target }) {
    // Reveal leaf when scroll passes the target position
    const opacity = useTransform(scrollYProgress, [target - 0.05, target], [0, 1]);
    const scale = useTransform(scrollYProgress, [target - 0.05, target], [0, 1]);
    const rotate = useTransform(scrollYProgress, [target - 0.05, target], [side === 'left' ? -45 : 45, side === 'left' ? -15 : 15]);

    return (
        <motion.div
            style={{ top, opacity, scale, rotate }}
            className={`absolute w-6 h-6 ${side === 'left' ? '-left-6 rounded-tr-none' : '-right-6 rounded-tl-none'} bg-[var(--color-olive-light)] rounded-full`}
        />
    );
}
