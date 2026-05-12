const GA_ID = 'G-WZ8M5CQVY1';

function gtag(...args: any[]) {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag(...args);
  }
}

export function trackPageView(path: string) {
  gtag('config', GA_ID, { page_path: path });
}

export function trackViewArtist(artistId: string) {
  gtag('event', 'view_artist', { artist_id: artistId });
}

export function trackViewArtwork(artworkId: string) {
  gtag('event', 'view_artwork', { artwork_id: artworkId });
}

export function trackEcwidProductClick(productId: string) {
  gtag('event', 'ecwid_product_click', { product_id: productId });
}

export function trackCheckoutInitiated() {
  gtag('event', 'checkout_initiated');
}
