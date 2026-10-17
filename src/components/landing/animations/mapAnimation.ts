import gsap from "gsap";

type MapAnimationOptions = { mobile: boolean };

export function animateMemoryMap({ mobile }: MapAnimationOptions) {
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: "[data-map-section]",
      start: mobile ? "top 82%" : "top 72%",
      once: true,
    },
    defaults: { ease: "power3.out" },
  });

  timeline
    .from("[data-map-section]", {
      "--divider-scale": 0,
      duration: 0.8,
      ease: "power2.inOut",
    })
    .from(
      "[data-memory-map]",
      { autoAlpha: 0, scale: 0.84, duration: 0.9 },
      "-=0.42",
    )
    .from(
      "[data-map-ring]",
      { autoAlpha: 0, scale: 0.55, duration: 0.65, stagger: 0.13 },
      "-=0.55",
    )
    .from(
      "[data-map-pin]",
      {
        autoAlpha: 0,
        scale: 0.4,
        y: -28,
        duration: 0.5,
        ease: "back.out(1.7)",
        stagger: 0.1,
      },
      "-=0.35",
    )
    .from(
      "[data-map-message]",
      { autoAlpha: 0, scale: 0.7, duration: 0.55 },
      "-=0.35",
    )
    .from(
      "[data-map-copy] > *",
      { autoAlpha: 0, y: 28, duration: 0.58, stagger: 0.1 },
      "-=0.65",
    );

  if (!mobile) {
    gsap.to("[data-map-ring='outer']", {
      rotation: 22,
      transformOrigin: "center",
      ease: "none",
      scrollTrigger: {
        trigger: "[data-memory-map]",
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2,
      },
    });

    gsap.to("[data-map-ring='inner']", {
      rotation: -28,
      transformOrigin: "center",
      ease: "none",
      scrollTrigger: {
        trigger: "[data-memory-map]",
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2,
      },
    });
  }
}
