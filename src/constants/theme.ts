export const IMAGE_RADIUS = {
  // Small: Thumbnails, list items
  SM: "rounded-xl md:rounded-2xl",
  // Medium: Standard grid cards, slider items
  MD: "rounded-2xl md:rounded-3xl",
  // Large: Hero sections, main featured articles
  LG: "rounded-3xl md:rounded-[40px]",
};

/**
 * Admin/backend modals live inside Layout's <main> (stacking context z-10),
 * while the sidebar is z-40 — full-viewport overlays paint under the menu.
 * Offset from lg:left-64 (sidebar width) and size within the main column.
 */
export const ADMIN_MODAL = {
  backdrop:
    "fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 lg:left-64",
  backdropElevated:
    "fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-4 lg:left-64",
  backdropTop:
    "fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4 lg:left-64",
  /** Wide editor: fills main column (≈2× old max-w-4xl on typical screens) */
  panelWide:
    "w-full max-w-[min(96rem,100%)] max-h-[90vh]",
  panelConfirm: "w-full max-w-sm",
} as const;
