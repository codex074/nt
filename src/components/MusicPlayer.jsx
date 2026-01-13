import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Music } from 'lucide-react';
import YouTube from 'react-youtube';

const YOUTUBE_PLAYLIST_ID = 'PL1ZJAdqjBMYYBcJJd7MVsWO-TVhb5d7XF';

export default function MusicPlayer({ autoPlay = false }) {
    const [isMuted, setIsMuted] = useState(!autoPlay); // Start unmuted if autoPlay
    const [isPlaying, setIsPlaying] = useState(false);
    const [songTitle, setSongTitle] = useState('');
    const [isReady, setIsReady] = useState(false);
    const playerRef = useRef(null);

    // YouTube player options - start unmuted if autoPlay is true
    const opts = {
        height: '0',
        width: '0',
        playerVars: {
            autoplay: 1,
            loop: 1,
            list: YOUTUBE_PLAYLIST_ID,
            listType: 'playlist',
            mute: autoPlay ? 0 : 1, // Start unmuted if autoPlay
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
        },
    };

    const onReady = (event) => {
        playerRef.current = event.target;
        setIsReady(true);

        // If autoPlay, ensure unmuted and playing
        if (autoPlay) {
            event.target.unMute();
            event.target.setVolume(50);
            event.target.playVideo();
        } else {
            event.target.mute();
        }
    };

    const onStateChange = (event) => {
        if (event.data === 1) {
            setIsPlaying(true);
            try {
                const videoData = event.target.getVideoData();
                if (videoData?.title) {
                    setSongTitle(videoData.title);
                }
            } catch (err) {
                console.log('Could not get video data');
            }
        } else if (event.data === 2) {
            setIsPlaying(false);
        } else if (event.data === 0) {
            event.target.nextVideo();
        }
    };

    const toggleMute = useCallback(() => {
        if (playerRef.current) {
            if (isMuted) {
                playerRef.current.unMute();
                playerRef.current.setVolume(50);
                playerRef.current.playVideo();
            } else {
                playerRef.current.mute();
            }
            setIsMuted(!isMuted);
        }
    }, [isMuted]);

    // Truncate long song titles
    const displayTitle = songTitle.length > 25
        ? songTitle.substring(0, 25) + '...'
        : songTitle;

    return (
        <>
            {/* Hidden YouTube Player */}
            <div className="hidden">
                <YouTube
                    opts={opts}
                    onReady={onReady}
                    onStateChange={onStateChange}
                    onError={(e) => console.log('YouTube error:', e)}
                />
            </div>

            {/* Floating Capsule Player */}
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                className="fixed bottom-6 right-6 z-50"
            >
                <div className="flex items-center gap-3 px-4 py-3 rounded-full bg-[var(--color-brown)] shadow-strong">
                    {/* Music Icon - spins when playing and unmuted */}
                    <motion.div
                        animate={{ rotate: isPlaying && !isMuted ? 360 : 0 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="text-[var(--color-sunflower)]"
                    >
                        <Music size={20} />
                    </motion.div>

                    {/* Song Title (visible when unmuted) */}
                    <AnimatePresence>
                        {!isMuted && songTitle && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 'auto', opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-white text-sm font-medium whitespace-nowrap max-w-[120px] truncate">
                                        {displayTitle}
                                    </span>

                                    {/* Divider */}
                                    <div className="w-px h-5 bg-white/30" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mute/Unmute Button */}
                    <motion.button
                        onClick={toggleMute}
                        className="flex items-center justify-center text-white hover:text-[var(--color-sunflower)] transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={isMuted ? 'Unmute music' : 'Mute music'}
                    >
                        <AnimatePresence mode="wait">
                            {isMuted ? (
                                <motion.div
                                    key="muted"
                                    initial={{ opacity: 0, rotate: -90 }}
                                    animate={{ opacity: 1, rotate: 0 }}
                                    exit={{ opacity: 0, rotate: 90 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <VolumeX size={22} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="unmuted"
                                    initial={{ opacity: 0, rotate: -90 }}
                                    animate={{ opacity: 1, rotate: 0 }}
                                    exit={{ opacity: 0, rotate: 90 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <Volume2 size={22} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            </motion.div>
        </>
    );
}
