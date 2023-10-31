---
title: "Buffer Overflows: Keep Your Code Safe"
date: 2022-12-14T18:59:28+02:00
categories: ['Articles']
tags: ['Security', 'Programming']
draft: false
---

A buffer overflow attack is a type of cyber attack in which an attacker attempts to write more data to a buffer (a temporary data storage area) in a computer's memory than the buffer is designed to hold. 
This can cause the buffer to overflow, or exceed its maximum capacity, which can corrupt other parts of the computer's memory and allow the attacker to gain unauthorized access to the system.

In this post we will explore more about how a buffer overflow attack works and how to prevent it.

## Programming a Vulnerable Program

Buffer overflows are a common security vulnerability in computer programs, especially those written in the C programming language. 
In C, buffers are often used to store strings of characters, such as user input or file contents. 
When a program receives input from a user or reads data from a file, it writes that data to a buffer. 
If the amount of data is larger than the size of the buffer, the excess data will overflow into other parts of the computer's memory, potentially overwriting or corrupting other data.

Lets write a basic program in C that is vulnerable to a buffer overflow attack. Load up your favourite text editor and create a file called `vuln.c`, then copy and paste the following:
``` c
#include <stdio.h>
#include <string.h>

void vulnerable_function(char* input) {
    char buffer[8];
    strcpy(buffer, input);
    printf("The input is: %s\n", buffer);
}

int main(int argc, char* argv[]) {
    vulnerable_function(argv[1]);

    return 0;
}

```

This program contains a function called `vulnerable_function()` that takes a string of characters as input.
The function declares a buffer called 'buffer' with a size of 8 characters. 
It then uses the `strcpy()` function to copy the input string into the buffer. 
Finally, it prints the contents of the buffer using the `printf()` function.

To compile this code, we need a C compiler. 
GCC (GNU Compiler Collection) is a fantastic C compiler and what I will use in this post.
<!-- , it is the standard C compiler for Unix-like systems like Linux and macOS. -->

To compile the code and generate an executable file called `vuln`, you can run the following command:

``` shell
gcc -o vuln vuln.c
```

To use gdb to debug the vuln program, you can use the following steps:

1. Start gdb by running the `gdb` command.
    
2. Load the vuln program into gdb by running the `file vuln` command.
    
3. Run the program by running the `run` command.
    
4. When the program stops at the beginning of the `main()` function, you can set a breakpoint at the beginning of the `vulnerable_function()` function by running the `break vulnerable_function` command.
 
5. Run the program again by running the `run` command. This time, the program will stop at the breakpoint in the `vulnerable_function()` function.
    
6. Step through the code line by line by running the `next` command. You can use the print command to print the values of variables and the `x` command to examine the contents of memory.
    
7. When the program reaches the `strcpy()` function, you can see that the buffer overflows if the input string is longer than 8 characters.

## Preventing Buffer Overflow Attacks

To prevent buffer overflow attacks, it is important to carefully design and implement your code to avoid such vulnerabilities. Here are some best practices to follow:

1. Use safe functions for handling strings and other data. In C, the `strncpy()` and `strncat()` functions are safer alternatives to `strcpy()` and `strcat()` because they allow you to specify the maximum number of characters to copy or concatenate.
    
2. Avoid using `gets()`, which is a particularly dangerous function because it does not check the size of the input and can therefore easily cause a buffer overflow. Instead, use `fgets()` or `getline()`, which allow you to specify the maximum size of the input.
    
3. Always check the return value of functions that handle strings or other data. If a function returns a value indicating that an error occurred or that the input was too large, you can take appropriate action, such as truncating the input or displaying an error message.
    
4. Use secure coding practices, such as avoiding the use of hard-coded passwords, sanitizing user input to prevent SQL injection attacks, and using encryption to protect sensitive data.

By following these best practices, you can help protect your code from buffer overflow attacks and keep your computer systems secure.
