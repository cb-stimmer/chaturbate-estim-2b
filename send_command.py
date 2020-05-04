#!/usr/bin/python
import serial
import sys
import time
serialport = sys.argv[2]
command = sys.argv[1]
command += '\r'
command = command.encode()
ser = serial.Serial(serialport, 9600,timeout=10)  # open serial port
ser.write(command)     # write a string
reply = ser.readline()
replyList = reply.split(b':')
i = 0
print(reply)
#print('\n reply len = ')
#print(len(replyList))
while reply == 'ERR\r' or len(replyList) != 13:
	++i
	time.sleep(1)
	ser.write(command)
	reply = ser.readline()
	print(reply)
	if i ==10:
		break
ser.close()             # close port