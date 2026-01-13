import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Send, Video } from 'lucide-react';

// Google Apps Script Web App URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxDCY2rkCucil3IZop_U-dlVv7D-qRASRgqUBiJ9XmMziIZRBGNhK4jolNr1r1DRmG6Zg/exec';

export default function UploadForm({ onUploadSuccess }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isVideo, setIsVideo] = useState(false);
    const [caption, setCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type - Accept both images and videos
            const isImageFile = file.type.startsWith('image/');
            const isVideoFile = file.type.startsWith('video/');

            if (!isImageFile && !isVideoFile) {
                setError('Please select an image or video file');
                return;
            }

            // Validate file size (max 50MB for videos, 10MB for images)
            const maxSize = isVideoFile ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
            if (file.size > maxSize) {
                setError(`File must be smaller than ${isVideoFile ? '50MB' : '10MB'}`);
                return;
            }

            setSelectedFile(file);
            setIsVideo(isVideoFile);
            setError(null);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearSelection = () => {
        setSelectedFile(null);
        setPreview(null);
        setIsVideo(false);
        setCaption('');
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Send the full Data URL - backend will handle stripping the header
                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isUploading) return;

        if (!selectedFile) {
            setError('Please select an image or video');
            return;
        }

        if (GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
            setError('Please update GAS_URL in UploadForm.jsx with your deployed Web App URL');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const base64 = await convertToBase64(selectedFile);

            // DEBUG: Log what we're sending
            console.log('Uploading file:', {
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size,
                isVideo: selectedFile.type.startsWith('video/')
            });

            const response = await fetch(GAS_URL, {
                method: 'POST',
                // Use text/plain to avoid CORS preflight (OPTIONS) request
                // GAS doesn't support OPTIONS, so we make it a "simple request"
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    base64,
                    type: selectedFile.type,
                    fileName: selectedFile.name,
                    caption: caption.trim(),
                }),
            });

            const result = await response.json();

            if (result.success) {
                clearSelection();
                onUploadSuccess?.(result.data);
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-xl mx-auto"
        >
            <div className="glass-card-strong p-8">
                <h2 className="font-serif text-2xl font-semibold text-[var(--color-brown)] mb-6 text-center">
                    Share a Memory 🌻
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload Area */}
                    <div className="relative">
                        <AnimatePresence mode="wait">
                            {!preview ? (
                                <motion.label
                                    key="upload-area"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    htmlFor="image-upload"
                                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-[var(--color-sunflower)] rounded-[var(--radius-soft)] cursor-pointer bg-[var(--color-sunflower-light)]/30 hover:bg-[var(--color-sunflower-light)]/50 transition-smooth"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <ImageIcon size={48} className="text-[var(--color-sunflower-dark)] mb-4" />
                                        <p className="mb-2 text-sm text-[var(--color-brown)]">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-[var(--color-brown)]/60">
                                            Images (PNG, JPG, GIF) up to 10MB • Videos (MP4, MOV) up to 50MB
                                        </p>
                                    </div>
                                </motion.label>
                            ) : (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="relative w-full rounded-[var(--radius-soft)] overflow-hidden"
                                >
                                    {isVideo ? (
                                        <video
                                            src={preview}
                                            className="w-full h-64 object-cover"
                                            muted
                                            playsInline
                                        />
                                    ) : (
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="w-full h-64 object-cover"
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={clearSelection}
                                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[var(--color-brown)]/80 text-white flex items-center justify-center hover:bg-[var(--color-brown)] transition-smooth"
                                        aria-label="Remove image"
                                    >
                                        <X size={18} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <input
                            ref={fileInputRef}
                            id="image-upload"
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Caption Input */}
                    <div>
                        <label htmlFor="caption" className="block text-sm font-medium text-[var(--color-brown)] mb-2">
                            Add a caption
                        </label>
                        <textarea
                            id="caption"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Write something sweet..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-[var(--radius-soft)] border border-[var(--color-sunflower)]/30 bg-white/50 font-serif text-[var(--color-charcoal)] placeholder:text-[var(--color-brown)]/40 resize-none transition-smooth focus:border-[var(--color-sunflower)] focus:bg-white"
                        />
                    </div>

                    {/* Error Message */}
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

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={!selectedFile || isUploading}
                        className="w-full py-4 rounded-[var(--radius-soft)] gradient-sunflower text-[var(--color-brown)] font-semibold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth hover:shadow-lg"
                        whileHover={{ scale: selectedFile && !isUploading ? 1.02 : 1 }}
                        whileTap={{ scale: selectedFile && !isUploading ? 0.98 : 1 }}
                    >
                        {isUploading ? (
                            <>
                                <span className="sunflower-spin">🌻</span>
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                <span>Share Memory</span>
                            </>
                        )}
                    </motion.button>
                </form>
            </div>
        </motion.div>
    );
}
