// A post's clips: looping, muted videos that play like GIFs. Their markup has
// preload="none" and controls, so without JavaScript nothing downloads until a
// reader presses play. Here each clip starts loading a screen before it comes
// into view and plays only while it's on screen, so a post with a dozen clips
// doesn't fetch them all on load. Under reduced motion the clips keep their
// controls and only load far enough to show their first frame.

import { $$, reducedMotion } from "../util.js";

export function initVideos() {
  const clips = $$(".post-body video[loop][muted]");
  if (!clips.length) return;
  const still = reducedMotion.matches;

  const near = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      near.unobserve(target);
      // Raising preload resumes the fetch. load() would too, but it would
      // cancel a play() that came first for a clip already on screen.
      target.preload = still ? "metadata" : "auto";
    }
  }, { rootMargin: "100% 0px" });

  const visible = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      // play() rejects if the browser blocks it; the clip just stays still.
      if (isIntersecting) target.play().catch(() => {});
      else target.pause();
    }
  });

  for (const clip of clips) {
    near.observe(clip);
    if (still) continue;
    clip.controls = false;
    visible.observe(clip);
  }
}
