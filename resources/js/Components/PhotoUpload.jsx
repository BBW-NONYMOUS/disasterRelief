import { useRef, useState } from 'react';

export default function PhotoUpload({ name = 'photos', multiple = true, onChange, error }) {
    const inputRef = useRef(null);
    const [previews, setPreviews] = useState([]);

    const handleChange = (e) => {
        const files = Array.from(e.target.files);
        const urls = files.map(f => URL.createObjectURL(f));
        setPreviews(urls);
        if (onChange) onChange(files);
    };

    return (
        <div>
            <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => inputRef.current?.click()}
            >
                <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-600">
                    Click to upload photos <span className="text-blue-600 font-medium">or drag and drop</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB each</p>
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
            {previews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                    {previews.map((url, i) => (
                        <img key={i} src={url} className="h-24 w-full object-cover rounded-md" alt={`Preview ${i + 1}`} />
                    ))}
                </div>
            )}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
