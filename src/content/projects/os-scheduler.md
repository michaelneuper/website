---
name: os-scheduler
title: "Multicore OS scheduler"
order: 2
cat: sw
demo: scheduler
demoNote: "A simplified simulation written for this page. Its processes only use the CPU, so none of them wait for resources or deadlock."
summary: "A multicore operating system scheduler, for a concurrency course."
stack: "C, OpenMP"
note: "private (concurrency coursework)"
---

The part of an operating system that decides which process runs on which core, and for how long. Processes come from a file that lists each one’s instructions, which request and release named resources. OpenMP threads act as the cores: each takes the next process from a shared ready queue, behind a lock so two cores never take the same one, and runs it under first come, first served, round robin or preemptive priority scheduling.

A process that asks for a resource another process has goes into a waiting queue until the holder releases it, then back to the ready queue. Once nothing is left to run, the scheduler checks the waiting processes for deadlock by following who holds the resource each one needs: a chain that leads back to where it started is a deadlock.
