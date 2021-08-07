# SPDX-License-Identifier: LGPL-3.0-or-later
# Chaturbate parser based on work by cgakdr: https://github.com/cgakdr/Chaturbate-Buttplug
# Copyright (C) 2021 cgakdr, cb-stimmer


import asyncio
import functools
#import logging
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
import warnings

import requests
import websockets

from pipe import Pipe

from Tip import Tip

class Chaturbate(object):
	"""docstring for Chaturbate"""
	def __init__(self):
		super(Chaturbate, self).__init__()
				


	async def chat_watcher(self, tips_queue, broadcaster):
	    
	    try:
	        api_info = None
	        with urllib.request.urlopen(f'https://chaturbate.com/api/chatvideocontext/{broadcaster}/') as url:
	            api_info = json.loads(url.read().decode())
	        # CB uses SockJS defaults of randomness
	        ws_uri = f"{api_info['wschat_host'].replace('https://', 'wss://')}/{random.randint(100, 999)}/{''.join(random.choices(string.ascii_letters + string.digits, k=8))}/websocket"
	        # print(ws_uri + "\n")
	        async with websockets.connect(ws_uri) as websocket:
	            # opening handshake
	            resp = await websocket.recv()
	            json_encoder = json.JSONEncoder()
	            obj2 = json_encoder.encode({'method': 'connect', 'data': {'user': api_info['chat_username'], 'password': api_info['chat_password'], 'room': api_info['broadcaster_username'], 'room_password': api_info['room_pass']}})
	            obj3 = json_encoder.encode([obj2])
	            # # print(f'>> {obj3}')
	            await websocket.send(obj3)
	            resp = await websocket.recv()
	            assert 'onAuthResponse' in resp
	            obj2 = json_encoder.encode({'method': 'joinRoom', 'data': {'room': broadcaster, 'exploringHashTag': ''}})
	            obj3 = json_encoder.encode([obj2])
	            await websocket.send(obj3)
	            # print("connected to chat room")
	            ws_connect_time = time.time()

	            random_levels = None
	            prev_resps = SimpleQueue() # allow follow-up message clarifying random levels to be sent with the tip
	            while True:
	                resp = None

	                try:
	                    try:
	                        resp = prev_resps.get_nowait()
	                    except Empty:
	                        resp = await asyncio.wait_for(websocket.recv(), 1)
	                except asyncio.TimeoutError:
	                    pass

	                # print("In true loop")

	                # save all websockets messages for debugging
	                # with open('ws.log', 'a') as f:
	                        # f.write(f'{datetime.now().isoformat()} {resp}\n')

	                if resp != None and re.search(r'tip_alert', resp, re.IGNORECASE) and time.time() - ws_connect_time > 1: # ignore initial burst of old tips
	                    # tip notification: a["{\"args\":[\"{\\\"in_fanclub\\\": false, \\\"to_username\\\": \\\"{broadcaster}\\\", \\\"has_tokens\\\": true, \\\"message\\\": \\\"\\\", \\\"tipped_recently\\\": true, \\\"is_anonymous_tip\\\": false, \\\"dont_send_to\\\": \\\"\\\", \\\"from_username\\\": \\\"{username}\\\", \\\"send_to\\\": \\\"\\\", \\\"tipped_alot_recently\\\": true, \\\"amount\\\": 1, \\\"tipped_tons_recently\\\": true, \\\"is_mod\\\": false, \\\"type\\\": \\\"tip_alert\\\", \\\"history\\\": true}\",\"true\"],\"callback\":null,\"method\":\"onNotify\"}"]
	                    # random level chosen a["{\"args\":[\"{broadcaster}\",\"{\\\"c\\\": \\\"rgb(120,0,175)\\\", \\\"X-Successful\\\": true, \\\"in_fanclub\\\": false, \\\"f\\\": \\\"Arial, Helvetica\\\", \\\"i\\\": \\\"HWBBR7LPLE7F7V\\\", \\\"gender\\\": \\\"f\\\", \\\"has_tokens\\\": true, \\\"m\\\": \\\"--------\\\\\\\"{username} has RANDOMLY activated level DOMI in 3 by tipping 44 tokens\\\", \\\"tipped_alot_recently\\\": false, \\\"user\\\": \\\"{broadcaster}\\\", \\\"is_mod\\\": false, \\\"tipped_tons_recently\\\": false, \\\"tipped_recently\\\": false}\"],\"callback\":null,\"method\":\"onRoomMsg\"}"]
	                    msg = json.loads(json.loads(json.loads(resp[1:])[0])['args'][0])
	                    if msg['type'] == 'tip_alert':
	                        # print(f'<<j {msg}')
	                        amt = msg['amount']
	                        tip: Tip = Tip(int(amt), time.time())
	                        # one of the next few messages might have the randomly chosen level if this tip was for random level
	                        if random_levels != None and tip.val == random_levels['value']:
	                            # limit to 5 messages or 1 second
	                            # print('searching for random level')
	                            while prev_resps.qsize() < 10 and time.time() < tip.timestamp + 1:
	                                try:
	                                    resp = await asyncio.wait_for(websocket.recv(), 1)
	                                    matches = re.search(r'[Ll]evel[^\d]+(\d+)', resp)
	                                    if matches:
	                                        random_tip_level = int(matches.group(1))
	                                        tip.val = random_levels['selection'][random_tip_level - 1]
	                                        # print(f'random tip level found:{random_tip_level} tip.val:{tip.val}')
	                                    else:
	                                        if 'room subject changed to' not in resp and '"Notice: ' not in resp: # ignore easy 'spam'
	                                            prev_resps.put(resp)
	                                except asyncio.TimeoutError:
	                                    pass

	                        # send the tip
	                        tips_queue.put(tip)
	                        # print('sent ' + str(tip.val) +
	                        #        ' from ' + msg['from_username'] +
	                        #        ' tip queue len ' + str(tips_queue.len_write()))
	                elif resp != None and re.search(r'appnotice', resp, re.IGNORECASE) and time.time() - ws_connect_time > 1:
	                    msg = json.loads(json.loads(json.loads(resp[1:])[0])['args'][0])
	                    # print(msg)

	                await asyncio.sleep(0.1)
	                try:
	                    ex = tips_queue.get_nowait()
	                    if type(ex) == Exception:
	                        raise ex
	                    else:
	                        if ex[0] == 'broadcaster':
	                            broadcaster = ex[1]
	                            # print('new broadcaster: ' + broadcaster)
	                            break
	                        elif ex[0] == 'random_levels':
	                            random_levels = ex[1]
	                            if random_levels != None:
	                                random_levels['selection'] = sorted(random_levels['selection'])
	                except Empty:
	                    pass
	    except Exception as ex:
	        print('watcher error')
	        print(traceback.format_exc())
	    finally:
	        tips_queue.put(Exception('watcher error'))
	        return


