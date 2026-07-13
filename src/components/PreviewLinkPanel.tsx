import React, { useState } from 'react';
import { Copy, RefreshCw, Link2 } from 'lucide-react';
import {
  buildPreviewUrl,
  generatePreviewToken,
  type PreviewContentType,
} from '../utils/previewAccess';
import clsx from 'clsx';
import { ADMIN_MODAL } from '../constants/theme';

type PreviewLinkPanelProps = {
  type: PreviewContentType;
  slug: string;
  previewToken: string;
  published: boolean;
  onRegenerateToken: (newToken: string) => void;
};

export default function PreviewLinkPanel({
  type,
  slug,
  previewToken,
  published,
  onRegenerateToken,
}: PreviewLinkPanelProps) {
  const [copied, setCopied] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  if (published || !slug || !previewToken) return null;

  const previewUrl = buildPreviewUrl(type, slug, previewToken);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback ignored
    }
  };

  const handleRegenerate = () => {
    onRegenerateToken(generatePreviewToken());
    setConfirmRegenerate(false);
  };

  return (
    <div className="rounded-2xl border border-[#FF4F00]/30 bg-[#FF4F00]/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-[#FF4F00]">
        <Link2 size={18} />
        <span className="font-['Karla'] font-bold uppercase tracking-wider text-sm">
          Link anteprima
        </span>
      </div>
      <p className="text-sm text-[#59554E] font-['Karla']">
        Condividi questo link per far vedere la pagina senza pubblicarla. Chi non ha il link non può accedervi.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={previewUrl}
          className="flex-1 text-xs font-mono bg-white border border-[#EAE3D9] rounded-xl px-3 py-2 text-[#121212]"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#121212] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#FF4F00] transition-colors"
        >
          <Copy size={14} />
          {copied ? 'Copiato' : 'Copia'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmRegenerate(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-[#EAE3D9] text-[#59554E] text-xs font-bold uppercase tracking-wider hover:border-[#121212] hover:text-[#121212] transition-colors"
        >
          <RefreshCw size={14} />
          Rigenera
        </button>
      </div>

      {confirmRegenerate && (
        <div className={clsx(ADMIN_MODAL.backdropTop, "bg-black/50")}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-[#EAE3D9]">
            <h3 className="font-['Karla'] font-bold uppercase tracking-wider text-[#121212] mb-2">
              Rigenerare link anteprima?
            </h3>
            <p className="text-sm text-[#59554E] font-['Karla'] mb-6">
              Il link attuale smetterà di funzionare. Dovrai condividere il nuovo link.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmRegenerate(false)}
                className="px-4 py-2 rounded-full font-bold uppercase tracking-wider text-sm text-[#59554E] hover:bg-[#F2EEE8]"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                className="px-4 py-2 rounded-full font-bold uppercase tracking-wider text-sm text-white bg-[#FF4F00] hover:bg-[#121212]"
              >
                Rigenera link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
