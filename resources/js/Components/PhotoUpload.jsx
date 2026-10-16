import { useRef, useState } from 'react';

const MAX_BYTES = 1024 * 1024; // relief.md: photos resized client-side to ≤ 1MB to save data
const MAX_DIMENSION = 1600;

/** Downscale/re-encode an image until it fits MAX_BYTES. Falls back to the original on failure. */
export async function compressImage(file) {
    if (file.size <= MAX_BYTES) return file;

    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();

        // Step quality down until the photo fits the budget.
        for (const quality of [0.8, 0.65, 0.5, 0.35]) {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
            if (blob && blob.size <= MAX_BYTES) {
                return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
            }
        }
    } catch {
        // Older browser or decode failure — upload the original and let the server validate.
    }
    return file;
}

export default function PhotoUpload({ name = 'photos', multiple = true, onChange, error }) {
    const inputRef = useRef(null);
    const [previews, setPreviews] = useState([]);
    const [compressing, setCompressing] = useState(false);

    const handleChange = async (e) => {
        const files = Array.from(e.target.files);
        setCompressing(true);
        const compressed = await Promise.all(files.map(compressImage));
        setCompressing(false);
        setPreviews(compressed.map(f => URL.createObjectURL(f)));
        if (onChange) onChange(compressed);
    };

    return (
        <div>
            <div
                className="border-2 border-dashed border-input rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 transition-colors"
                onClick={() => inputRef.current?.click()}
            >
                <svg className="mx-auto h-10 w-10 text-muted-foreground mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-muted-foreground">
                    Click to upload photos <span className="text-primary font-medium">or drag and drop</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WEBP — large photos are compressed automatically to save data
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    name={name}
                    multiple={multiple}
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleChange}
                    className="hidden"
                />
            </div>
            {compressing && (
                <p className="mt-2 text-xs text-muted-foreground" role="status">Compressing photos…</p>
            )}
            {previews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                    {previews.map((url, i) => (
                        <img key={i} src={url} className="h-24 w-full object-cover rounded-md" alt={`Preview ${i + 1}`} />
                    ))}
                </div>
            )}
            {error && <p className="mt-1 text-sm text-status-rejected">{error}</p>}
        </div>
    );
}
