import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Calendar, X, ZoomIn, ZoomOut, Play, Volume2 } from 'lucide-react';

// Google Apps Script Web App URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxDCY2rkCucil3IZop_U-dlVv7D-qRASRgqUBiJ9XmMziIZRBGNhK4jolNr1r1DRmG6Zg/exec';

// Fallback placeholder image
// Fallback placeholder image (Sunflower field)
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&w=800&q=80';

// Check if media is a video based on mimeType (primary) or URL (fallback)
const isVideoMedia = (media) => {
    // Primary: check mimeType from API
    if (media?.mimeType) {
        return media.mimeType.startsWith('video/');
    }
    // Fallback: check URL for video extensions
    const url = media?.url || '';
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

// Extract file ID from any Google Drive URL format
const extractFileId = (url) => {
    if (!url) return null;

    const thumbMatch = url.match(/\/thumbnail\?id=([a-zA-Z0-9_-]+)/);
    if (thumbMatch) return thumbMatch[1];

    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) return fileMatch[1];

    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) return idMatch[1];

    return null;
};

// Get thumbnail URL (works for both images and video thumbnails)
const getThumbnailUrl = (url) => {
    if (!url) return PLACEHOLDER_IMAGE;
    if (url.includes('drive.google.com/thumbnail?')) return url;

    const fileId = extractFileId(url);
    if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
    return url;
};

// Get video playback URL for lightbox
const getVideoPlaybackUrl = (url) => {
    const fileId = extractFileId(url);
    if (fileId) {
        // Use export=download for direct video playback
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
};

// Group photos by year, sorted within each group
const groupPhotosByYear = (photos) => {
    const groups = {};

    photos.forEach((photo) => {
        const date = new Date(photo.date || photo.timestamp);
        const year = date.getFullYear();
        if (!groups[year]) groups[year] = [];
        groups[year].push({ ...photo, parsedDate: date });
    });

    return Object.keys(groups)
        .sort((a, b) => a - b)
        .map((year) => ({
            year: parseInt(year),
            photos: groups[year].sort((a, b) => a.parsedDate - b.parsedDate),
        }));
};

// ============================================================
// LIGHTBOX COMPONENT
// ============================================================
function Lightbox({ media, onClose }) {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    // Use mimeType-based detection
    const isVideo = isVideoMedia(media);
    // For videos: use playback URL; for images: use thumbnail URL
    const imageUrl = getThumbnailUrl(media?.url);
    const videoUrl = getVideoPlaybackUrl(media?.url);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 4));
    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.5, 1));
        if (zoom <= 1.5) setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e) => {
        if (zoom > 1) {
            setIsDragging(true);
            dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - dragStart.current.x,
                y: e.clientY - dragStart.current.y,
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    // Handle backdrop click (close when clicking outside content)
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
        >
            {/* Backdrop - clicking closes the lightbox */}
            <div
                className="absolute inset-0 bg-black/95"
                onClick={onClose}
            />

            {/* FIXED CLOSE BUTTON - Minimal, elegant design */}
            <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="fixed top-6 right-6 z-[60] text-white/80 hover:text-white transition-colors p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm"
                aria-label="Close lightbox"
                style={{ pointerEvents: 'auto' }}
            >
                <X size={28} />
            </button>

            {/* Zoom Controls (for images only) */}
            {!isVideo && (
                <div className="fixed top-4 left-4 z-[60] flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                        className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                    >
                        <ZoomOut size={20} />
                    </button>
                    <span className="text-white/70 text-sm min-w-[3rem] text-center bg-black/30 px-2 py-1 rounded-full">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                        className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                    >
                        <ZoomIn size={20} />
                    </button>
                </div>
            )}

            {/* Media Content Container */}
            <div
                className="absolute inset-0 flex items-center justify-center p-4 overflow-hidden"
                style={{ zIndex: 51 }}
                onClick={handleBackdropClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {isVideo ? (
                    <div
                        className="w-full max-w-5xl h-[80vh] bg-black rounded-lg shadow-2xl overflow-hidden relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <iframe
                            src={`https://drive.google.com/file/d/${extractFileId(media.url)}/preview`}
                            width="100%"
                            height="100%"
                            className="absolute inset-0 w-full h-full border-0"
                            allow="autoplay; fullscreen"
                            title={media.caption || "Video player"}
                        />
                    </div>
                ) : (
                    <motion.img
                        src={imageUrl}
                        alt={media?.caption || 'Memory'}
                        className="max-w-full max-h-[80vh] object-contain select-none rounded-lg shadow-2xl"
                        style={{
                            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                        }}
                        onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                        draggable={false}
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
            </div>

            {/* Caption Footer */}
            {
                media?.caption && (
                    <div
                        className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent"
                        style={{ zIndex: 52 }}
                    >
                        <p className="font-serif text-white text-xl text-center mb-2">"{media.caption}"</p>
                        <p className="text-white/60 text-sm text-center">
                            {formatDate(media.date || media.timestamp)}
                        </p>
                    </div>
                )
            }
        </motion.div >
    );
}

// ============================================================
// MEDIA CARD COMPONENT
// ============================================================
function MediaCard({ media, onClick }) {
    // Use mimeType-based detection
    const isVideo = isVideoMedia(media);
    // Always use thumbnail for feed view (both images and videos)
    const thumbnailUrl = getThumbnailUrl(media.url);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div
            onClick={onClick}
            className="relative flex-shrink-0 w-72 h-80 rounded-[var(--radius-soft)] overflow-hidden shadow-medium cursor-pointer group"
        >
            {/* Always show thumbnail image for both images and videos */}
            <img
                src={thumbnailUrl}
                alt={media.caption || 'Memory'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMAGE;
                }}
            />

            {/* Video play icon overlay - centered */}
            {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
                        <Play size={32} fill="white" className="text-white ml-1" />
                    </div>
                </div>
            )}

            {/* Video badge - top right corner */}
            {isVideo && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium flex items-center gap-1">
                    <Play size={12} fill="white" />
                    VIDEO
                </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

            {/* Date badge */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white/90 text-sm font-medium">
                <Calendar size={14} />
                <span>{formatDate(media.date || media.timestamp)}</span>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm bg-black/50 px-4 py-2 rounded-full flex items-center gap-2">
                    {isVideo ? <><Volume2 size={16} /> Watch with sound</> : <>Click to view</>}
                </span>
            </div>
        </div>
    );
}

// ============================================================
// MARQUEE ROW COMPONENT
// ============================================================
function MarqueeRow({ year, photos, delayIndex, onMediaClick }) {
    // shouldAnimate check removed to force animation

    // Calculate animation duration based on number of photos
    const baseDuration = Math.max(20, photos.length * 8);
    const animationDelay = delayIndex * 0.5;

    // Always duplicate content for seamless marquee loop
    const displayPhotos = [...photos, ...photos];

    return (
        <section className="mb-10 group">
            {/* Year Header */}
            <div className="flex items-center gap-3 px-4 mb-4">
                <h2 className="font-serif text-3xl font-bold text-[var(--color-brown)]">
                    {year}
                </h2>
                <span className="text-[var(--color-brown)]/50 text-sm">
                    {photos.length} {photos.length === 1 ? 'memory' : 'memories'}
                </span>
                <div className="flex-1 h-px bg-[var(--color-sunflower)]/30" />
            </div>

            {/* Marquee Container */}
            <div className="overflow-hidden">
                <div
                    className="flex gap-4 animate-marquee"
                    style={{
                        '--marquee-duration': `${baseDuration}s`,
                        animationDelay: `${animationDelay}s`,
                        width: 'fit-content',
                    }}
                >
                    {displayPhotos.map((media, index) => (
                        <MediaCard
                            key={`${media.url}-${index}`}
                            media={media}
                            onClick={() => onMediaClick(media)}
                        />
                    ))}
                </div>
            </div>

            {/* Pause hint - only show if animating */}
            {/* Pause hint */}
            <p className="text-center text-[var(--color-brown)]/40 text-xs mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                ⏸ Paused — move away to resume
            </p>
        </section>
    );
}

// Narrative Whispers to display between years
const WHISPERS = [
    "It started with a simple hello...",
    "Every moment became a memory...",
    "Growing closer with every season...",
    "Building a lifetime of happiness...",
    "And now, for the next chapter..."
];

function WhisperText({ text }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="flex justify-center py-12 relative z-10"
        >
            <p className="font-serif italic text-2xl text-[var(--color-brown)]/60 max-w-lg text-center leading-relaxed">
                "{text}"
            </p>
        </motion.div>
    );
}

// ============================================================
// MAIN GALLERY COMPONENT
// ============================================================
export default function Gallery({ refreshTrigger }) {
    const [photos, setPhotos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lightboxMedia, setLightboxMedia] = useState(null);

    const fetchPhotos = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(GAS_URL);
            const result = await response.json();

            if (result.success) {
                setPhotos(result.data || []);
            } else {
                throw new Error(result.error || 'Failed to fetch photos');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, [refreshTrigger]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <span className="sunflower-spin text-6xl mb-4">🌻</span>
                <p className="text-[var(--color-brown)]/60 font-medium">Loading memories...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="text-5xl mb-4">😢</div>
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={fetchPhotos}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-sunflower)] text-[var(--color-brown)] font-medium hover:bg-[var(--color-sunflower-dark)] transition-smooth"
                >
                    <RefreshCw size={18} />
                    Try Again
                </button>
            </div>
        );
    }

    // Empty state
    if (photos.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
            >
                <div className="text-8xl mb-6">🌻</div>
                <h3 className="font-serif text-3xl text-[var(--color-brown)] mb-3">
                    No memories yet
                </h3>
                <p className="text-[var(--color-brown)]/60 max-w-md">
                    Click the + button above to share your first beautiful moment together.
                </p>
            </motion.div>
        );
    }

    const yearGroups = groupPhotosByYear(photos);

    return (
        <>
            <div className="w-full py-8">
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10 px-4"
                >
                    <h1 className="font-serif text-3xl md:text-4xl font-bold text-[var(--color-brown)] mb-2">
                        Our Memories
                    </h1>
                    <p className="text-[var(--color-brown)]/60">
                        {photos.length} {photos.length === 1 ? 'moment' : 'moments'} captured
                    </p>
                </motion.div>

                {/* Year Groups with Marquee */}
                {yearGroups.map(({ year, photos }, index) => (
                    <div key={year}>
                        <MarqueeRow
                            year={year}
                            photos={photos}
                            delayIndex={index}
                            onMediaClick={setLightboxMedia}
                        />
                        {/* Render whisper after every year (or cycle through them) */}
                        <WhisperText text={WHISPERS[index % WHISPERS.length]} />
                    </div>
                ))}

                <div className="h-24" />
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {lightboxMedia && (
                    <Lightbox media={lightboxMedia} onClose={() => setLightboxMedia(null)} />
                )}
            </AnimatePresence>
        </>
    );
}
