type BuffersMap = Map<string, AudioBuffer>;

function resolveSoundUrl(soundFile: string) {
    if (!soundFile) return '';
    if (soundFile.startsWith('http://') || soundFile.startsWith('https://') || soundFile.startsWith('/')) {
        return soundFile;
    }

    return new URL(`./${soundFile}`, import.meta.url).href;
}

let audioCtx: AudioContext | null = null;
const buffers: BuffersMap = new Map();
const objectUrls: Map<string, string> = new Map();

function dataUrlToArrayBuffer(dataUrl: string): { arrayBuffer: ArrayBuffer; mime: string } | null {
    const match = dataUrl.match(/^data:([^;,]+)?(?:;base64)?,(.*)$/);
    if (!match) return null;
    const mime = match[1] || 'application/octet-stream';
    const isBase64 = /;base64,/.test(dataUrl);
    const dataPart = dataUrl.substring(dataUrl.indexOf(',') + 1);

    if (isBase64) {
        const binary = atob(dataPart);
        const len = binary.length;
        const ab = new Uint8Array(len);
        for (let i = 0; i < len; i++) ab[i] = binary.charCodeAt(i);
        return { arrayBuffer: ab.buffer, mime };
    }

    // URL-encoded
    const decoded = decodeURIComponent(dataPart);
    const len = decoded.length;
    const ab = new Uint8Array(len);
    for (let i = 0; i < len; i++) ab[i] = decoded.charCodeAt(i);
    return { arrayBuffer: ab.buffer, mime };
}

function getAudioContext() {
    if (audioCtx) return audioCtx;
    const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
    return audioCtx;
}

export async function preloadSound(soundFile: string) {
    try {
        const url = resolveSoundUrl(soundFile);
        if (!url) return;

        const ctx = getAudioContext();
        if (!ctx) return;

        if (buffers.has(soundFile)) return;

        if (url.startsWith('data:')) {
            const parsed = dataUrlToArrayBuffer(url);
            if (parsed) {
                const decoded = await ctx.decodeAudioData(parsed.arrayBuffer.slice(0));
                buffers.set(soundFile, decoded);
                // Also create a blob URL for HTMLAudio fallback (blob: is allowed by CSP)
                try {
                    const blob = new Blob([parsed.arrayBuffer], { type: parsed.mime });
                    const obj = URL.createObjectURL(blob);
                    objectUrls.set(soundFile, obj);
                } catch (err) {
                    // ignore blob creation errors
                }
            }
            return;
        }

        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
        buffers.set(soundFile, decoded);
    } catch (err) {
        // Non-fatal — fallback will be used when playing
        // eslint-disable-next-line no-console
        console.warn('Failed to preload sound', soundFile, err);
    }
}

export function playSound(soundFile: string, volume = 1) {
    const url = resolveSoundUrl(soundFile);
    if (!url) return;

    const ctx = getAudioContext();
    if (ctx) {
        if (ctx.state === 'suspended') {
            void ctx.resume().catch(() => {});
        }

        const buf = buffers.get(soundFile);
        if (buf) {
            try {
                const src = ctx.createBufferSource();
                src.buffer = buf;
                const gain = ctx.createGain();
                gain.gain.value = Math.max(0, Math.min(1, volume));
                src.connect(gain);
                gain.connect(ctx.destination);
                src.start(0);
                return;
            } catch (err) {
                // fall through to HTMLAudio fallback
                // eslint-disable-next-line no-console
                console.warn('WebAudio play failed, falling back to HTMLAudio', err);
            }
        }
    }

    // Fallback: use HTMLAudio element for short/simple sounds
    try {
        let playUrl = url;
        if (url.startsWith('data:')) {
            // CSP may block data: in connect-src. Use blob: object URL instead.
            playUrl = objectUrls.get(soundFile) ?? '';
            if (!playUrl) {
                const parsed = dataUrlToArrayBuffer(url);
                if (parsed) {
                    try {
                        const blob = new Blob([parsed.arrayBuffer], { type: parsed.mime });
                        playUrl = URL.createObjectURL(blob);
                        objectUrls.set(soundFile, playUrl);
                    } catch (err) {
                        // leave playUrl empty
                    }
                }
            }
        }
        const a = new Audio(playUrl || url);
        a.volume = Math.max(0, Math.min(1, volume));
        a.currentTime = 0;
        void a.play().catch(() => {});
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Audio playback failed:', err);
    }
}

// Preload common click sound so short sounds play with low latency.
void preloadSound('ButtonClick.mp3');
void preloadSound('Correct.mp3');
void preloadSound('Wrong.mp3');