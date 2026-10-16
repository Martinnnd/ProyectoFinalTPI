import gsap from "gsap";

type HeroAnimationOptions = { mobile: boolean };

export function animateHero({ mobile }: HeroAnimationOptions) {
  gsap
    .timeline({ defaults: { ease: "power3.out" } })
    .from("[data-landing-header]", {
      autoAlpha: 0,
      y: -20,
      duration: 0.65,
    })
    .from(
      "[data-hero-eyebrow]",
      { autoAlpha: 0, y: 18, duration: 0.55 },
      "-=0.3",
    )
    .from(
      "[data-hero-title]",
      {
        autoAlpha: 0,
        clipPath: "inset(0 0 100% 0)",
        y: mobile ? 32 : 54,
        duration: mobile ? 0.8 : 1.05,
      },
      "-=0.25",
    )
    .from(
      "[data-hero-tagline]",
      { autoAlpha: 0, y: 22, duration: 0.65 },
      "-=0.42",
    )
    .from(
      "[data-hero-actions] > *",
      { autoAlpha: 0, y: 18, duration: 0.5, stagger: 0.11 },
      "-=0.35",
    )
    .from(
      "[data-hero-pin]",
      {
        autoAlpha: 0,
        scale: 0.35,
        y: -36,
        duration: 0.62,
        ease: "back.out(1.8)",
        stagger: 0.1,
      },
      mobile ? "-=0.2" : "-=0.65",
    );

  gsap.fromTo(
    "[data-hero-map]",
    { scale: mobile ? 1.03 : 1.08, yPercent: -2 },
    {
      scale: mobile ? 1.06 : 1.13,
      yPercent: mobile ? 4 : 9,
      ease: "none",
      scrollTrigger: {
        trigger: "[data-hero-shell]",
        start: "top top",
        end: "bottom top",
        scrub: 0.8,
      },
    },
  );
}
