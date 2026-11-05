export type VideoSource = { kind: 'iframe' | 'file'; src: string };

/**
 * Turns a pasted link into something safe to play. Only known players can go in an iframe,
 * and the id is checked, so a page can't be made to frame any other address.
 */
export function parseVideoUrl(value: unknown): VideoSource | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  const path = url.pathname.split('/').filter(Boolean);
  const youtube = (id: string | null | undefined): VideoSource | null =>
    id && /^[\w-]{6,20}$/.test(id) ? { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` } : null;

  if (host === 'youtu.be') return youtube(path[0]);
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (path[0] === 'watch') return youtube(url.searchParams.get('v'));
    if (path[0] === 'embed' || path[0] === 'shorts' || path[0] === 'live') return youtube(path[1]);
    return null;
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = path[path.length - 1];
    return id && /^\d{5,12}$/.test(id) ? { kind: 'iframe', src: `https://player.vimeo.com/video/${id}` } : null;
  }
  if (url.protocol === 'https:' && /\.(mp4|webm|ogg)$/i.test(url.pathname)) return { kind: 'file', src: url.href };
  return null;
}
