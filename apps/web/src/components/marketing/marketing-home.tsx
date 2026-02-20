"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import styles from "../../app/style/landing-reference.module.css";
import { submitPublicContactRequest } from "../../lib/api/public-contact";
import { ContactSection } from "./landing/contact-section";
import { CtaSection } from "./landing/cta-section";
import { CursorLayer } from "./landing/cursor-layer";
import { navItems, tickerItems } from "./landing/data";
import { FaqSection } from "./landing/faq-section";
import { HeroSection } from "./landing/hero-section";
import { NavBar } from "./landing/nav-bar";
import { PageFooter } from "./landing/page-footer";
import { PricingSection } from "./landing/pricing-section";
import { ProcessSection } from "./landing/process-section";
import { ProofSection } from "./landing/proof-section";
import { ServicesSection } from "./landing/services-section";
import { TickerStrip } from "./landing/ticker-strip";

export function MarketingHomeContent() {
  const [activeId, setActiveId] = useState("services");
  const [openFaq, setOpenFaq] = useState(0);
  const [sent, setSent] = useState(false);
  const [submittingContact, setSubmittingContact] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactStartedAtIso] = useState(() => new Date().toISOString());
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  const tickerLoop = useMemo(() => [...tickerItems, ...tickerItems], []);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));

    const onScroll = () => {
      if (!sections.length) return;
      const checkpoint = window.innerHeight * 0.35;
      let current = sections[0];
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= checkpoint) current = section;
        else break;
      }
      setActiveId(current.id);
    };

    const onHashChange = () => {
      const hashId = window.location.hash.replace("#", "");
      if (!hashId) return;
      if (navItems.some((item) => item.id === hashId)) {
        setActiveId(hashId);
      }
    };

    onHashChange();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(`.${styles.reveal}`));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return;
          window.setTimeout(() => entry.target.classList.add(styles.visible), index * 80);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;
    let raf = 0;

    const onMove = (event: MouseEvent) => {
      mx = event.clientX;
      my = event.clientY;
      cursor.style.transform = `translate(${mx - 6}px, ${my - 6}px)`;
    };

    const animate = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.transform = `translate(${rx - 20}px, ${ry - 20}px)`;
      raf = window.requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove);
    raf = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const service = String(formData.get("service") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const company = String(formData.get("company") ?? "").trim();
    const startedAt = String(formData.get("startedAt") ?? "").trim();

    setSubmittingContact(true);
    setSent(false);
    setContactError(null);

    const response = await submitPublicContactRequest({
      name,
      email,
      service,
      message,
      company,
      startedAt,
      pagePath: "/#contact"
    });

    setSubmittingContact(false);
    if (!response.success) {
      setContactError(response.error?.message ?? "Unable to submit request right now. Please try again.");
      return;
    }

    setSent(true);
    form.reset();
  };

  return (
    <div className={styles.page}>
      <CursorLayer cursorRef={cursorRef} ringRef={ringRef} />
      <NavBar items={navItems} activeId={activeId} />

      <main>
        <HeroSection />
        <TickerStrip items={tickerLoop} />
        <ServicesSection />
        <ProcessSection />
        <ProofSection />
        <PricingSection />
        <FaqSection openFaq={openFaq} setOpenFaq={setOpenFaq} />
        <ContactSection
          sent={sent}
          loading={submittingContact}
          error={contactError}
          startedAtIso={contactStartedAtIso}
          onSubmit={onSubmit}
        />
        <CtaSection />
      </main>

      <PageFooter />
    </div>
  );
}
