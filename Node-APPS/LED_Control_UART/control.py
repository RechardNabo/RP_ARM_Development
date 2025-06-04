#!/usr/bin/env python3
"""
Raspberry Pi UART LED Control
This script sends commands to an ESP32 via UART to control its onboard LED.

Commands:
- ON: Turn the LED on
- OFF: Turn the LED off
- TOGGLE: Toggle the LED state
"""

import serial
import time
import sys

# UART configuration
SERIAL_PORT = '/dev/ttyAMA0'  # Default UART port on Raspberry Pi
BAUD_RATE = 19200             # Must match ESP32 setting

def main():
    print("Raspberry Pi UART LED Control")
    print(f"Port: {SERIAL_PORT}, Baud Rate: {BAUD_RATE}")
    
    try:
        # Open serial port
        ser = serial.Serial(
            port=SERIAL_PORT,
            baudrate=BAUD_RATE,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=1
        )
        
        print("Serial port opened successfully")
        
        # Main command loop
        while True:
            print("\nAvailable commands:")
            print("1. ON - Turn LED on")
            print("2. OFF - Turn LED off")
            print("3. TOGGLE - Toggle LED state")
            print("4. Quit")
            
            choice = input("Enter command (1-4): ")
            
            if choice == '1':
                send_command(ser, "ON")
            elif choice == '2':
                send_command(ser, "OFF")
            elif choice == '3':
                send_command(ser, "TOGGLE")
            elif choice == '4':
                print("Exiting...")
                break
            else:
                print("Invalid command! Please enter 1-4.")
            
    except serial.SerialException as e:
        print(f"Error opening serial port: {e}")
        sys.exit(1)
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()
            print("Serial port closed")

def send_command(ser, command):
    """Send a command to ESP32 and read the response."""
    # Add newline to end command
    full_command = command + '\n'
    
    # Send the command
    ser.write(full_command.encode('utf-8'))
    print(f"Sent: {command}")
    
    # Wait for response
    time.sleep(0.1)
    
    # Read response
    if ser.in_waiting:
        response = ser.readline().decode('utf-8').strip()
        print(f"Received: {response}")
    else:
        print("No response received")

if __name__ == "__main__":
    main()