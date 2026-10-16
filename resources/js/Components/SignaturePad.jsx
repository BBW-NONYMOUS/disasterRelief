import { useRef, useEffect, useState } from 'react';

export default function SignaturePad({ onSave, error }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const lastPos = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const getPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches?.[0] ?? e;
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        };
    };

    const startDrawing = (e) => {
        e.preventDefault();
        setIsDrawing(true);
        setIsEmpty(false);
        lastPos.current = getPos(e, canvasRef.current);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPos.current = pos;
    };

    const endDrawing = () => setIsDrawing(false);

    const clear = () => {
        const canvas = canvasRef.current;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
    };

    const save = () => {
        if (isEmpty) return;
        canvasRef.current.toBlob((blob) => {
            const file = new File([blob], 'signature.png', { type: 'image/png' });
            onSave(file);
        });
    };

    return (
        <div>
            <div className="border border-input rounded-lg overflow-hidden bg-card">
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={endDrawing}
                />
            </div>
            <div className="flex gap-2 mt-2">
                <button type="button" onClick={clear}
                    className="text-sm text-muted-foreground hover:text-foreground underline">
                    Clear
                </button>
                <button type="button" onClick={save} disabled={isEmpty}
                    className="text-sm text-primary hover:text-primary-dark underline disabled:opacity-40">
                    Save Signature
                </button>
            </div>
            {error && <p className="mt-1 text-sm text-status-rejected">{error}</p>}
        </div>
    );
}
