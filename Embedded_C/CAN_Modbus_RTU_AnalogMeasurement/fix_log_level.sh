#!/bin/bash
# Simple script to replace all instances of current_log_level with log_level
sed -i 's/current_log_level/log_level/g' Main.c
echo "All instances of 'current_log_level' replaced with 'log_level'"
