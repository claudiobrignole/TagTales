import React, { useEffect, useState } from 'react';

interface EcwidBuyButtonProps {
  productId: string;
}

export default function EcwidBuyButton({ productId }: EcwidBuyButtonProps) {
  const [storeId, setStoreId] = useState<string>('');

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.ecwidStoreId) setStoreId(data.ecwidStoreId);
      })
      .catch(err => console.error("Could not fetch config", err));
  }, []);

  useEffect(() => {
    if (!storeId || !productId) return;
    
    // Check if script is already loaded
    if (!document.getElementById(`ecwid-script-${storeId}`)) {
      const script = document.createElement('script');
      script.id = `ecwid-script-${storeId}`;
      script.type = 'text/javascript';
      script.src = `https://app.ecwid.com/script.js?${storeId}&data_platform=singleproduct_v2`;
      script.charset = 'utf-8';
      script.setAttribute('data-cfasync', 'false');
      document.body.appendChild(script);
      
      script.onload = () => {
        if (typeof (window as any).xProduct !== 'undefined') {
          (window as any).xProduct();
        }
      };
    } else {
      if (typeof (window as any).xProduct !== 'undefined') {
        (window as any).xProduct();
      }
    }
  }, [storeId, productId]);

  if (!storeId || !productId) {
    return (
      <button className="px-6 py-3 rounded-full font-bold uppercase tracking-widest text-white bg-[#121212] opacity-50 cursor-not-allowed">
        Buy Now
      </button>
    );
  }

  // The Ecwid widget div
  return (
    <div 
      className={`ecwid ecwid-SingleProduct-v2 ecwid-Product ecwid-Product-${productId}`} 
      itemScope 
      itemType="http://schema.org/Product" 
      data-single-product-id={productId}
    >
      <div 
        itemProp="offers" 
        itemScope 
        itemType="http://schema.org/Offer"
      >
        <div 
          className="ecwid-title" 
          itemProp="name" 
        ></div>
        <div 
          itemProp="price" 
        ></div>
      </div>
    </div>
  );
}
