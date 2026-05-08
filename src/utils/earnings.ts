export const calculateEarnings = (sale: any, artwork: any) => {
  const price = Number(sale.price);
  const vat = (price / 1.22) * 0.22;
  const productionCost = Number(artwork?.productionCost || 0);
  const shippingCost = Number(artwork?.shippingCost || 0);
  const ccFee = price * 0.0295;
  
  const hasMissingCosts = !artwork?.productionCost || !artwork?.shippingCost;
  
  let netRevenue = null;
  let artistEarnings = null;
  
  if (!hasMissingCosts) {
    netRevenue = price - vat - productionCost - shippingCost - ccFee;
    artistEarnings = netRevenue * 0.5;
  }

  return {
    netRevenue,
    artistEarnings,
    artistShare: artistEarnings, // Alias for compatibility
    splitArtista: artistEarnings, // New translation-aligned alias
    productionCost,
    shippingCost,
    vat,
    ccFee,
    hasMissingCosts
  };
};
