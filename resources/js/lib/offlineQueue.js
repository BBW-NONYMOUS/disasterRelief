/*
| Offline-first incident reporting (relief.md cross-cutting rule).
|
| Drafts are stored in localStorage when the phone has no signal and
| re-submitted automatically on reconnect. Photos are not queued —
| serialized images would blow the storage budget — the reporter can
| attach them afterwards by editing the report.
*/
const KEY = 'reliefnet.report-drafts';
const EVENT = 'reliefnet:queue-changed';

function read() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) ?? [];
    } catch {
        return [];
    }
}

function write(drafts) {
    localStorage.setItem(KEY, JSON.stringify(drafts));
    window.dispatchEvent(new CustomEvent(EVENT));
}

export function getDrafts() {
    return read();
}

export function queueDraft(data) {
    const { photos, ...fields } = data; // photos cannot survive localStorage
    write([...read(), {
        // Doubles as an idempotency key: a draft is removed before re-queueing.
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        queued_at: new Date().toISOString(),
        data: fields,
    }]);
}

export function removeDraft(id) {
    write(read().filter(d => d.id !== id));
}

export function onQueueChange(handler) {
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
}
