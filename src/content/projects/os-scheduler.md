---
name: os-scheduler
order: 2
cat: sw
src: private
demo: scheduler
summary: "A multicore operating system scheduler, for a concurrency course."
note: "Source private (concurrency coursework)"
---

The part of an operating system that decides which process runs on which core, and for how long. I wrote it for a concurrency course, so the source stays private, but the idea fits in a small simulation: processes arrive, wait in a shared ready queue, and get dispatched to cores under first come, first served, round robin or preemptive priority scheduling.
