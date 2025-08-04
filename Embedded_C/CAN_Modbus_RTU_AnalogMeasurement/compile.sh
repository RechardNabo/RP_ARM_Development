#!/bin/bash

# Compile Main.c with required libraries and includes
gcc -o Main Main.c -I/usr/include/libbson-1.0 -I/usr/include/libmongoc-1.0 -lpigpio -lpthread -lcurl -lmongoc-1.0 -lbson-1.0 -Wall

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo "Compilation successful! Executable 'Main' created."
else
    echo "Compilation failed!"
    exit 1
fi
