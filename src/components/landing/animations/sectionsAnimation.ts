import gsap from "gsap";

type SectionsAnimationOptions = { mobile: boolean };

export function animateLandingSections({ mobile }: SectionsAnimationOptions) {
  gsap
    .timeline({
      scrollTrigger: {
        trigger: "[data-story-section]",
        start: mobile ? "top 84%" : "top 72%",
        once: true,
      },
    })
    .from("[data-story-quote]", {
      autoAlpha: 0,
      y: mobile ? 20 : 55,
      duration: 0.8,
      ease: "power3.out",
    })
    .from(
      "[data-story-copy] > *",
      {
        autoAlpha: 0,
        y: 28,
        duration: 0.6,
        stagger: 0.11,
        ease: "power3.out",
      },
      "-=0.55",
    )
    .from(
      "[data-story-feature]",
      {
        autoAlpha: 0,
        x: mobile ? 0 : 28,
        y: mobile ? 18 : 0,
        duration: 0.52,
        stagger: 0.11,
        ease: "power3.out",
      },
      "-=0.35",
    );

  gsap
    .timeline({
      scrollTrigger: {
        trigger: "[data-final-call]",
        start: "top 82%",
        once: true,
      },
    })
    .from("[data-final-call]", {
      "--call-reveal": 0,
      duration: 0.85,
      ease: "power2.inOut",
    })
    .from("[data-final-call] > *", {
      autoAlpha: 0,
      y: 30,
      duration: 0.62,
      stagger: 0.12,
      ease: "power3.out",
    });

  gsap.from("[data-footer-group]", {
    autoAlpha: 0,
    y: 24,
    duration: 0.65,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: "[data-landing-footer]",
      start: "top 88%",
      once: true,
    },
  });
}
