#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
# Chaturbate E-stim 2B controller, Connects Chaturbate chat to E-Stim systems 2B
# Copyright (C) 2021 cb-stimmer

import estim2b
import asyncio
import functools
import json
import os
import random
import re
import string
import sys
import threading
import time
import traceback
import urllib.request
from datetime import datetime
from numbers import Number
from queue import Empty, SimpleQueue
import queue
import warnings



from Tip import Tip



class estim2bCom(object):
	"""docstring for estim2bCom"""
	def __init__(self, port, tip_levels, special_tips, mode, power):
		super(estim2bCom, self).__init__()
		self.tipLevels = tip_levels
		self.specialTips = special_tips
		self.mode = mode
		self.power = power
		self.port = port
		self.setup()
		
	def setup(self):
		print(self.port)
		self.e2b = estim2b.Estim(self.port, verbose=False)
		self.e2b.status()
		self.e2b.setMode(self.mode)
		if self.power == "L":
			self.e2b.setLow
		elif self.power == "H":
			self.e2b.setHigh
		else:
			self.e2b.setDynamic
		self.e2b.kill()

	def do_comm(self, timeout, val):
		if isinstance(val, Number):
			print("do_comm with " + str(timeout) + 's@' +
				str(val))
			self.e2b.setOutputs(val,val,timeout)
			# await asyncio.sleep(timeout)
			print("end do comm")

	def process_tip(self, ammount):
		# print("processing tip of ",ammount," \n")
		for lvl in self.specialTips:
			if lvl["ammount"] == ammount:
				self.e2b.setOutputs(lvl["levelA"],lvl["levelB"],lvl["time"])
				return
		for lvl in self.tipLevels:
			if ammount >= lvl["ammount"]:
				self.e2b.setOutputs(lvl["levelA"],lvl["levelB"],lvl["time"])
				return

	async def communicator(self, tips_queue, broadcaster):

		try:
			while True:
				while True:  # wait for queue message but also allow interrupts
					# print("Quesize " + str(tips_queue.qsize()))
					try:
						msg = tips_queue.get(timeout=0.1) # (timeout=0.1)
						if type(msg) == Tip:
							print("\n\n Tip recieved " + str(msg.val) + "\n\n")
							break
						else:
							if msg[0] == 'delay':
								delay += msg[1]
								print("new delay: " + str(delay))
							elif msg[0] == "broadcaster":
								broadcaster = msg[1]
								tips_queue.clear()
								#user = init_user(tips_queue, broadcaster)
								print('new broadcaster ' + broadcaster)
							elif msg[0] == 'levels_reload':
								print("levels_reload")
								#user = init_user(tips_queue, broadcaster)
							
							continue
					except:
						self.e2b.kill()
						#print("except empty")
						continue
					if tips_queue.empty():
						self.e2b.kill()
				tip: Tip = msg
				# print("tip processing \n")
				self.process_tip(msg.val)

		except ValueError as ex:  # non-int in queue
			print("com valueerror")
			print(traceback.format_exc())
			self.e2b.kill()
		except Exception as ex:
			print("comm error")
			print(traceback.format_exc())
			self.e2b.kill()
		finally:
			self.e2b.kill()
			return




# class Tip(object):
#     val = 0
#     timestamp = 0

#     def __init__(self, val, timestamp, level=None):
#         self.val = val
#         self.timestamp = timestamp

#     def __str__(self):
#         return f'Tip val:{self.val} timestamp:{self.timestamp}'
