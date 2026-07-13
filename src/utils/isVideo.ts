export function isVideo(url?: string): boolean {
  return url ? /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url) : false;
}
