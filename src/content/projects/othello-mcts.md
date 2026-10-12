---
name: othello-mcts
order: 3
cat: sw
src: private
demo: othello
summary: "An Othello player in C that runs Monte Carlo tree search across MPI processes."
stack: "C, MPI, Docker"
note: "Source private (concurrency coursework)"
---

The player picks a move by running thousands of random games from the current position and keeping the move that was explored most, using UCT to balance trying new moves against improving promising ones. Each move gets one second.

The project was for a concurrency course, so the next step was to parallelise it with MPI, which I did in three ways: independent search trees combined at the end with `MPI_Allreduce`, trees that share their statistics every so often, and the same sharing done asynchronously with non-blocking sends. In ten-game matches on four processes, each version beat the one before it, except the asynchronous version, which won half its games against the synchronous one.

You can play a serial version, rewritten in JavaScript for this page, below. While it thinks, each legal move is shaded by how often the search tried it.
