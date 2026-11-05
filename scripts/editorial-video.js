"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEditorialVideo = extractEditorialVideo;
exports.injectEditorialVideo = injectEditorialVideo;
exports.parseVideoSource = parseVideoSource;
const VIDEO_BLOCK_REGEX = /\n*\[GLAMORA_VIDEO:\s*(\{[^\n\]]+\})\s*\]\s*$/;
function extractEditorialVideo(rawBody) {
    const text = rawBody || '';
    const match = text.match(VIDEO_BLOCK_REGEX);
    if (!match) {
        return { cleanBody: text, video: null };
    }
    try {
        const parsed = JSON.parse(match[1]);
        if (!parsed || typeof parsed.url !== 'string' || !parsed.url.trim()) {
            return { cleanBody: text.replace(VIDEO_BLOCK_REGEX, '').trimEnd(), video: null };
        }
        const aspect = parsed.aspect === '9:16' ? '9:16' : '16:9';
        return {
            cleanBody: text.replace(VIDEO_BLOCK_REGEX, '').trimEnd(),
            video: {
                url: parsed.url.trim(),
                aspect,
                caption: typeof parsed.caption === 'string' ? parsed.caption.trim() : '',
            },
        };
    }
    catch {
        return { cleanBody: text, video: null };
    }
}
function injectEditorialVideo(cleanBody, video) {
    const trimmedBody = (cleanBody || '').replace(VIDEO_BLOCK_REGEX, '').trimEnd();
    if (!video || !video.url.trim()) {
        return trimmedBody;
    }
    const payload = {
        url: video.url.trim(),
        aspect: video.aspect === '9:16' ? '9:16' : '16:9',
        ...(video.caption?.trim() ? { caption: video.caption.trim() } : {}),
    };
    const serialized = `[GLAMORA_VIDEO: ${JSON.stringify(payload)}]`;
    return trimmedBody ? `${trimmedBody}\n\n${serialized}` : serialized;
}
function parseVideoSource(rawUrl) {
    const url = (rawUrl || '').trim();
    if (!url)
        return null;
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        // YouTube (watch, youtu.be, shorts, embed)
        if (host.includes('youtube.com') || host.includes('youtu.be')) {
            let videoId = '';
            if (host.includes('youtu.be')) {
                videoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
            }
            else if (parsed.pathname.startsWith('/shorts/')) {
                videoId = parsed.pathname.split('/')[2] || '';
            }
            else if (parsed.pathname.startsWith('/embed/')) {
                videoId = parsed.pathname.split('/')[2] || '';
            }
            else {
                videoId = parsed.searchParams.get('v') || '';
            }
            if (videoId) {
                return {
                    kind: 'youtube',
                    embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0`,
                };
            }
        }
        // Vimeo
        if (host.includes('vimeo.com')) {
            const segments = parsed.pathname.split('/').filter(Boolean);
            const numericId = segments.find((seg) => /^\d+$/.test(seg));
            if (numericId) {
                return {
                    kind: 'vimeo',
                    embedUrl: `https://player.vimeo.com/video/${numericId}`,
                };
            }
        }
        // Instagram Reel / Post
        if (host.includes('instagram.com')) {
            const match = parsed.pathname.match(/^\/(reel|p|tv)\/([^/?#]+)/i);
            if (match) {
                return {
                    kind: 'instagram',
                    embedUrl: `https://www.instagram.com/${match[1]}/${match[2]}/embed`,
                };
            }
        }
    }
    catch {
        // Si no es una URL absoluta válida pero empieza con /
        if (!url.startsWith('/'))
            return null;
    }
    return {
        kind: 'direct',
        src: url,
    };
}
