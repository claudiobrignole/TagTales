import React from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import LazyImage from "./LazyImage";
import { isVideo } from "../utils/isVideo";

/** Shell class: compensates PublicLayout main padding so hero fills the viewport. */
export const FULL_PAGE_HERO_SHELL =
  "relative -mt-[65px] lg:-mt-[75px] h-[100svh] w-full overflow-hidden bg-[#121212]";

interface HeroMediaProps {
  src?: string;
  fallback?: string;
  alt?: string;
  loading?: "eager" | "lazy";
}

export function FullPageHeroBackground({
  src,
  fallback,
  alt = "",
  loading = "eager",
}: HeroMediaProps) {
  if (!src || src.trim() === "") return null;

  if (isVideo(src)) {
    return (
      <video
        src={src}
        poster={fallback}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 z-0 h-full w-full object-cover opacity-80"
      />
    );
  }

  return (
    <LazyImage
      src={src}
      alt={alt}
      className="opacity-80"
      wrapperClassName="absolute inset-0 z-0 h-full w-full"
      loading={loading}
      width={1920}
      height={1080}
      style={{ objectFit: "cover" }}
    />
  );
}

export function FullPageHeroOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#121212]/50 via-transparent to-[#121212]/60 md:from-[#121212]/30 md:to-[#121212]/50" />
  );
}

interface FullPageHeroContentProps {
  backLink?: { to: string; label: string };
  footer?: React.ReactNode;
  hasTagImage?: boolean;
  children: React.ReactNode;
}

export function FullPageHeroContent({
  backLink,
  footer,
  hasTagImage,
  children,
}: FullPageHeroContentProps) {
  return (
    <div className="absolute inset-0 z-[2] flex min-h-0 flex-col px-[15px] md:px-[25px] lg:px-20 pt-[calc(65px+0.75rem)] lg:pt-[calc(75px+1.25rem)] pb-[max(1rem,env(safe-area-inset-bottom))]">
      {backLink && (
        <Link
          to={backLink.to}
          className="relative z-[3] mb-3 shrink-0 self-start font-['Karla'] text-xs font-bold uppercase tracking-widest text-white transition-colors hover:text-[#FF4F00] sm:text-sm"
        >
          &larr; {backLink.label}
        </Link>
      )}
      <div
        className={clsx(
          "flex min-h-0 flex-1 items-center justify-center overflow-y-auto lg:justify-start",
          hasTagImage && "pt-[60px]",
        )}
      >
        <div className="my-auto w-full max-w-4xl min-w-0 overflow-visible py-2 lg:my-0">
          {children}
        </div>
      </div>
      {footer ? <div className="relative z-[3] shrink-0">{footer}</div> : null}
    </div>
  );
}

export function FullPageHeroCard({
  children,
  className,
  tagImage,
  tagAlt = "Tag",
}: {
  children: React.ReactNode;
  className?: string;
  tagImage?: string;
  tagAlt?: string;
}) {
  const hasTag = Boolean(tagImage?.trim());

  const tagBadgeClass =
    "h-[100px] w-[100px] shrink-0 overflow-hidden rounded-full border-4 border-[#121212]/90 bg-[#121212] shadow-lg";

  return (
    <div className="relative w-full overflow-visible">
      <div className={clsx("hero-content-card relative w-full text-left", className)}>
        {hasTag && (
          <div className={clsx("-mt-[88px] mb-2", tagBadgeClass)}>
            <LazyImage
              src={tagImage!}
              alt={tagAlt}
              loading="eager"
              width={100}
              height={100}
              style={{ objectFit: "cover" }}
            />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

interface FullPageHeroProps extends HeroMediaProps {
  backLink?: { to: string; label: string };
  footer?: React.ReactNode;
  tagImage?: string;
  tagAlt?: string;
  children: React.ReactNode;
  className?: string;
}

export default function FullPageHero({
  src,
  fallback,
  alt,
  loading,
  backLink,
  footer,
  tagImage,
  tagAlt,
  children,
  className,
}: FullPageHeroProps) {
  const hasTagImage = Boolean(tagImage?.trim());

  return (
    <section className={clsx(FULL_PAGE_HERO_SHELL, className)}>
      <FullPageHeroBackground src={src} fallback={fallback} alt={alt} loading={loading} />
      <FullPageHeroOverlay />
      <FullPageHeroContent backLink={backLink} footer={footer} hasTagImage={hasTagImage}>
        <FullPageHeroCard tagImage={tagImage} tagAlt={tagAlt}>
          {children}
        </FullPageHeroCard>
      </FullPageHeroContent>
    </section>
  );
}
