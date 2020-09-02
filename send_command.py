#!/usr/bin/python
# SPDX-License-Identifier: GPL-3.0-or-later
# Chaturbate E-stim 2B controller, An application to control the E-Stim systems 2B based on tips
# Copyright (C) 2020  cb-stimmer

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
while reply == 'ERR\r' or not ( len(replyList) == 9 or len(replyList) == 13 ):
	++i
	time.sleep(1)
	ser.write(command)
	reply = ser.readline()
	replyList = reply.split(b':')
	print(reply)
	if i ==10:
		break
ser.close()             # close port