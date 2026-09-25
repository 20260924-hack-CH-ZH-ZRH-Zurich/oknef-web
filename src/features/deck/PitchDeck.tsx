"use client";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  HeartHandshake,
  Layers3,
  Maximize2,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "@/components/ui/data-display/Brand/Brand";
import {
  PreferenceControls,
  usePreferences,
} from "@/features/preferences/Preferences";
import { slides } from "./content";
import { deckResources } from "./resources";
export function PitchDeck() {
  const { locale, t } = usePreferences();
  const [index, setIndex] = useState(0);
  const slide = slides[locale][index];
  function previous() {
    setIndex((value) => Math.max(value - 1, 0));
  }
  function next() {
    setIndex((value) => Math.min(value + 1, slides.en.length - 1));
  }
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLButtonElement ||
        event.target instanceof HTMLAnchorElement
      )
        return;
      if (["ArrowRight", " "].includes(event.key)) {
        event.preventDefault();
        setIndex((value) => Math.min(value + 1, slides.en.length - 1));
      }
      if (event.key === "ArrowLeft")
        setIndex((value) => Math.max(value - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  async function fullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }
  return (
    <main className="flex min-h-dvh flex-col bg-rail px-6 py-6 text-white md:px-12 lg:px-16">
      <header className="flex items-center justify-between gap-5">
        <Link href="/" title={t("deckExit")}>
          <Brand inverse />
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-xs text-rail-muted md:block">
            ZÜRICH · SWISS {"{ai}"} WEEKS 2026
          </span>
          <PreferenceControls />
          <button
            type="button"
            className="hidden text-rail-muted md:block"
            onClick={fullscreen}
            title={t("fullscreen")}
            aria-label={t("fullscreen")}
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </header>
      <section
        className={`mx-auto grid w-full max-w-7xl flex-1 content-center gap-10 py-12 lg:gap-12 ${slide.media ? "lg:grid-cols-[.9fr_1.3fr]" : "lg:grid-cols-[1.35fr_1fr]"}`}
      >
        <div>
          <p className="text-xs uppercase tracking-[.2em] text-accent">
            {slide.label}
          </p>
          <h1
            className={`mt-6 whitespace-pre-line break-words text-4xl font-medium leading-[1.09] tracking-[-.045em] ${slide.media ? "md:text-5xl" : "md:text-6xl lg:text-7xl"}`}
          >
            {slide.title}
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-rail-muted md:text-lg">
            {slide.body}
          </p>
          {slide.repositoryLabel && (
            <a
              href={deckResources.repositories}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-accent px-6 py-4 text-sm font-semibold text-accent-ink"
            >
              {slide.repositoryLabel}
              <ArrowUpRight size={19} />
            </a>
          )}
          {[3, slides.en.length - 1].includes(index) && (
            <Link
              href="/login?demo=1"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-accent px-6 py-4 text-sm font-semibold text-accent-ink"
            >
              {t("demo")}
              <ArrowUpRight size={19} />
            </Link>
          )}
        </div>
        <div className="flex flex-col justify-center gap-4">
          {slide.video && (
            <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
              {/* The ephemeral frame allows Vimeo under the existing COEP policy. */}
              <iframe
                {...{ credentialless: true }}
                key={index}
                src={deckResources.video}
                title="Oknef Zurich Hackathon Demo Video"
                className="h-full w-full border-0"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          )}
          {slide.videoLinkLabel && (
            <a
              href={deckResources.videoPage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent underline underline-offset-4"
            >
              {slide.videoLinkLabel}
            </a>
          )}
          {slide.repositoryLabel && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <Layers3 className="text-accent" size={40} />
              <p className="mt-6 break-words text-xl leading-8">
                Web · iOS · Android · Extension
                <br />
                Rust · AI Core · OpenClaw
                <br />
                Protocol · Schemas · Terraform
              </p>
            </div>
          )}
          {slide.media && (
            <figure>
              <Image
                src={slide.media.src}
                alt={slide.media.alt}
                width={1440}
                height={1100}
                unoptimized
                className="max-h-[65vh] w-full rounded-2xl border border-white/10 bg-white object-contain"
              />
              <figcaption className="mt-3 text-xs leading-6 text-rail-muted">
                {slide.media.caption}
              </figcaption>
            </figure>
          )}
          {index === 0 && (
            <div className="relative mx-auto mb-6 flex h-44 w-72 items-center justify-center">
              <div className="absolute size-40 rounded-full border border-accent/35" />
              <div className="absolute size-52 rounded-full border border-accent/15" />
              <div className="flex size-20 items-center justify-center rounded-3xl bg-accent text-accent-ink">
                <HeartHandshake size={38} strokeWidth={1.3} />
              </div>
              <span className="absolute left-1 top-12 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-rail text-accent">
                <Layers3 size={20} />
              </span>
              <span className="absolute right-2 bottom-8 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-rail text-accent">
                <ShieldCheck size={21} />
              </span>
            </div>
          )}
          {slide.cards.map((card, cardIndex) => (
            <article
              key={card.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-accent/10 text-xs text-accent">
                  0{cardIndex + 1}
                </span>
                <h2 className="text-lg font-medium">{card.title}</h2>
              </div>
              <p className="text-sm leading-7 text-rail-muted">{card.body}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-5">
        <Link href="/" className="text-xs text-rail-muted">
          {t("deckExit")}
        </Link>
        <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
          {slides.en.map((item, i) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${t("deckCounter")} ${i + 1}`}
              aria-current={index === i ? "step" : undefined}
              className={`h-1.5 rounded-full transition-all ${index === i ? "w-8 bg-accent" : "w-2 bg-white/20"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-5">
          <button
            type="button"
            aria-label={t("deckPrevious")}
            title={t("deckPrevious")}
            disabled={index === 0}
            onClick={previous}
            className="text-rail-muted"
          >
            <ArrowLeft size={19} />
          </button>
          <span className="text-xs tabular-nums text-rail-muted">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(slides.en.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            aria-label={t("deckNext")}
            title={t("deckNext")}
            disabled={index === slides.en.length - 1}
            onClick={next}
            className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-ink"
          >
            <ArrowRight size={19} />
          </button>
        </div>
      </footer>
    </main>
  );
}
