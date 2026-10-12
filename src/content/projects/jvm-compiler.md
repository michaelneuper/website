---
name: jvm-compiler
order: 4
cat: sw
src: private
demo: bytecode
summary: "A compiler in C for a custom language that targets the JVM."
stack: "C, JVM bytecode"
note: "Source private (computer architecture coursework)"
---

I wrote it in C for a computer architecture course. It reads a small custom programming language and produces bytecode the Java virtual machine can run. The source stays private, but the last stage is easy to show: the JVM is a stack machine, so an expression compiles to instructions that push and pop an operand stack. Type one below to see the bytecode and run it.
