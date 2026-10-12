---
name: jvm-compiler
title: "Compiler to JVM bytecode"
order: 4
cat: sw
demo: bytecode
demoNote: "Only the last step, for arithmetic expressions, rewritten in JavaScript for this page. The JVM is a stack machine, so an expression compiles to instructions that push and pop an operand stack. Type one to see its bytecode and run it."
summary: "A compiler in C for a custom language that targets the JVM."
stack: "C, JVM bytecode, Jasmin"
note: "private (university coursework)"
---

I wrote it for a computer architecture course. It reads a program in a small procedural language, with subroutines, arrays, `if` and `while` statements, input and output, and produces a class file the Java virtual machine can run.

It works in stages. A scanner splits the source into tokens, and a recursive-descent parser checks them against the grammar. A symbol table, built on my own hash table, records every name and its type so the type checker can catch mistakes. The last stage emits [JVM instructions](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html), which [Jasmin](https://jasmin.sourceforge.net/) assembles into the class file.
