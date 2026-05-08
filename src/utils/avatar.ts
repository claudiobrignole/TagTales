export const getAvatarFallback = (name: string, userId: string = '') => {
  const initial = name.charAt(0).toUpperCase();
  const colors = [
    '#FF4F00', // TagTales Orange
    '#59554E', // TagTales Brown
    '#121212', // TagTales Black
    '#FF8C00', // Dark Orange
    '#8B4513', // Saddle Brown
    '#2F4F4F', // Dark Slate Gray
  ];
  
  // Use userId for consistent color, fallback to name if no userId
  const seed = userId || name;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const color = colors[Math.abs(hash) % colors.length];
  return { initial, color };
};
