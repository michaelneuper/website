---
name: chat-voip-p2p
order: 5
cat: sw
src: private
demo: rbudp
summary: "Four networking projects in Java: chat, fast UDP file transfer, voice calls and P2P sharing."
stack: "Java, JavaFX, TCP and UDP sockets, Java Sound, RSA, AES-GCM"
note: "Source private (coursework, group project)"
---

A series of networking projects built with my group for a university course:

- A chat server that handles many clients at once, with a JavaFX client, load-tested with dozens of simultaneous users.
- File transfer over Reliable Blast UDP, measured against TCP across packet sizes, loss rates and file sizes from 1 to 100&nbsp;MB.
- The chat extended with voice calls and group calls streamed over UDP, plus voice notes.
- Peer-to-peer file sharing: a server brokers searches, then peers send files to each other directly over TCP, encrypted with AES-GCM keys exchanged using RSA, with pause and resume. We tested it across four machines over Tailscale.

Below is the RBUDP transfer in miniature: blast every packet over UDP, ask over TCP which ones arrived, and resend the gaps.
