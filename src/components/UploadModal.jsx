import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Send, Calendar, Film } from 'lucide-react';
import Swal from 'sweetalert2';

// Google Apps Script Web App URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxjwkydEnmYUIhRo-84hCaxLMewi5xdEPm935l15if_3KnrjLgw_Rvg7P3Fhjo1z9MGlw/exec';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [caption, setCaption] = useState('');
    const [date, setDate] = useState(() => {
        // Default to today's date
        return new Date().toISOString().split('T')[0];
    });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            if (!isImage && !isVideo) {
                setError('Please select an image or video file');
                return;
            }

            // Size limits: 10MB for images, 50MB for videos
            const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
            if (file.size > maxSize) {
                setError(`File must be smaller than ${isVideo ? '50MB' : '10MB'}`);
                return;
            }

            setSelectedFile(file);
            setError(null);

            // Create preview
            if (isImage) {
                const reader = new FileReader();
                reader.onload = (e) => setPreview({ type: 'image', src: e.target.result });
                reader.readAsDataURL(file);
            } else {
                // Video preview using object URL
                setPreview({ type: 'video', src: URL.createObjectURL(file) });
            }
        }
    };

    const clearSelection = () => {
        setSelectedFile(null);
        setPreview(null);
        setCaption('');
        setDate(new Date().toISOString().split('T')[0]);
        setError(null);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        clearSelection();
        onClose();
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setError('Please select a file');
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadProgress(10);

        try {
            const base64 = await convertToBase64(selectedFile);
            setUploadProgress(30);
            // No headers = simple request = no CORS preflight
            const response = await fetch(GAS_URL, {
                method: 'POST',
                body: JSON.stringify({
                    base64,
                    type: selectedFile.type,
                    caption: caption.trim(),
                    date: date,
                }),
            });

            setUploadProgress(80);

            const result = await response.json();
            setUploadProgress(100);
            if (result.success) {
                clearSelection();
                onUploadSuccess?.(result.data);
                onClose();

                // Show success alert
                Swal.fire({
                    icon: 'success',
                    title: 'Memory Saved! 🌻',
                    text: 'Your moment is now eternal',
                    background: '#FEF9E7',
                    color: '#5D4037',
                    confirmButtonColor: '#F4D03F',
                    confirmButtonText: 'Continue',
                    timer: 3000,
                    timerProgressBar: true,
                });
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload. Please try again.');

            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: err.message || 'Something went wrong',
                background: '#FEF9E7',
                color: '#5D4037',
                confirmButtonColor: '#e74c3c',
            });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="glass-card-strong w-full max-w-lg p-6 pointer-events-auto relative max-h-[90vh] overflow-y-auto">
                            {/* Close button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--color-brown)]/10 flex items-center justify-center hover:bg-[var(--color-brown)]/20 transition-smooth"
                                aria-label="Close"
                            >
                                <X size={18} className="text-[var(--color-brown)]" />
                            </button>

                            <h2 className="font-serif text-2xl font-semibold text-[var(--color-brown)] mb-6 text-center">
                                Share a Memory 🌻
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Image Upload */}
                                <div className="relative">
                                    <AnimatePresence mode="wait">
                                        {!preview ? (
                                            <motion.label
                                                key="upload"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                htmlFor="modal-media-upload"
                                                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[var(--color-sunflower)] rounded-[var(--radius-soft)] cursor-pointer bg-[var(--color-sunflower-light)]/30 hover:bg-[var(--color-sunflower-light)]/50 transition-smooth"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <ImageIcon size={32} className="text-[var(--color-sunflower-dark)]" />
                                                    <Film size={32} className="text-[var(--color-sunflower-dark)]" />
                                                </div>
                                                <p className="text-sm text-[var(--color-brown)]">
                                                    <span className="font-semibold">Click to upload</span>
                                                </p>
                                                <p className="text-xs text-[var(--color-brown)]/60 mt-1">Images or Videos up to 50MB</p>
                                            </motion.label>
                                        ) : (
                                            <motion.div
                                                key="preview"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="relative w-full rounded-[var(--radius-soft)] overflow-hidden"
                                            >
                                                {preview?.type === 'video' ? (
                                                    <video
                                                        src={preview.src}
                                                        className="w-full h-48 object-cover"
                                                        autoPlay
                                                        muted
                                                        loop
                                                        playsInline
                                                    />
                                                ) : (
                                                    <img src={preview?.src} alt="Preview" className="w-full h-48 object-cover" />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={clearSelection}
                                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-smooth"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <input
                                        ref={fileInputRef}
                                        id="modal-media-upload"
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>

                                {/* Date Picker */}
                                <div>
                                    <label htmlFor="memory-date" className="flex items-center gap-2 text-sm font-medium text-[var(--color-brown)] mb-2">
                                        <Calendar size={16} />
                                        When was this memory?
                                    </label>
                                    <input
                                        id="memory-date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-4 py-3 rounded-[var(--radius-soft)] border border-[var(--color-sunflower)]/30 bg-white/50 text-[var(--color-charcoal)] transition-smooth focus:border-[var(--color-sunflower)] focus:bg-white cursor-pointer"
                                    />
                                </div>

                                {/* Caption */}
                                <div>
                                    <label htmlFor="caption" className="block text-sm font-medium text-[var(--color-brown)] mb-2">
                                        Caption
                                    </label>
                                    <textarea
                                        id="caption"
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder="Write something sweet..."
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-[var(--radius-soft)] border border-[var(--color-sunflower)]/30 bg-white/50 font-serif text-[var(--color-charcoal)] placeholder:text-[var(--color-brown)]/40 resize-none transition-smooth focus:border-[var(--color-sunflower)] focus:bg-white"
                                    />
                                </div>

                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="text-red-500 text-sm text-center"
                                        >
                                            {error}
                                        </motion.p>
                                    )}
                                </AnimatePresence>

                                {/* Submit */}
                                <motion.button
                                    type="submit"
                                    disabled={!selectedFile || isUploading}
                                    className="w-full py-3 rounded-[var(--radius-soft)] gradient-sunflower text-[var(--color-brown)] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth hover:shadow-lg"
                                    whileHover={{ scale: selectedFile && !isUploading ? 1.02 : 1 }}
                                    whileTap={{ scale: selectedFile && !isUploading ? 0.98 : 1 }}
                                >
                                    {isUploading ? (
                                        <>
                                            <span className="sunflower-spin text-xl">🌻</span>
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            <span>Share Memory</span>
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
