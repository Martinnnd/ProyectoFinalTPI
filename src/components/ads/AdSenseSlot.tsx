"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { adSensePublisherId, adSenseSlots } from "../../adSense";
import styles from "./AdSenseSlot.module.css";

type AdSenseWindow = Window & {
  adsbygoogle?: Record<string, never>[];
};

export default function AdSenseSlot({ placement }: { placement: keyof typeof adSenseSlots }) {
  const slotId = adSenseSlots[placement];
  const ad = useRef<HTMLModElement>(null);
  const requested = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    const element = ad.current;
    if (!scriptReady || !element || requested.current) return;

    const observer = new ResizeObserver(() => {
      if (!element.isConnected || element.offsetWidth === 0) return;

      observer.disconnect();
      requested.current = true;
      if (element.hasAttribute("data-adsbygoogle-status")) return;

      const adsWindow = window as AdSenseWindow;
      try {
        (adsWindow.adsbygoogle ??= []).push({});
      } catch {
        // AdSense can reject an ad request. Keep the surrounding content usable.
        element.dataset.adStatus = "unfilled";
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [scriptReady]);

  if (!adSensePublisherId || !slotId || !/^\d+$/.test(slotId)) return null;

  const markScriptReady = () => setScriptReady(true);
  return (
    <div className={styles.slot}>
      <span className={styles.label}>Publicidad</span>
      <ins
        ref={ad}
        className={`adsbygoogle ${styles.ad}`}
        data-ad-client={adSensePublisherId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <Script
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSensePublisherId}`}
        strategy="afterInteractive"
        crossOrigin="anonymous"
        async
        onLoad={markScriptReady}
        onReady={markScriptReady}
      />
    </div>
  );
}
