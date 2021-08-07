#!/usr/bin/env python3

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
import warnings

from Chaturbate import Chaturbate
from Tip import Tip
from estim2bCom import estim2bCom

import requests
import websockets

from pipe import Pipe

# local versions of libraries
sys.path.insert(0, 'buttplug')
sys.path.insert(0, 'python_readchar\\readchar')
from readchar import key as KEY
from readchar import readkey


settings = dict()

def load_settings():
    with open("settings.json", "r") as read_file:
        global settings
        settings = json.load(read_file)

def main():

    load_settings()

    broadcaster = sys.argv[1] if len(sys.argv) >= 2 else ''
    pipe = Pipe()
    pipe_comm = pipe.pipe_a
    pipe_watcher = pipe.pipe_b

    comm_thread = threading.Thread(
        target=communicator_runner, args=(pipe_comm, broadcaster))
        #target=comm_dummy, args=(pipe_comm, broadcaster))
    watcher_thread = threading.Thread(
        target=chat_watcher_runner, args=(pipe_watcher, broadcaster))
        # target=comm_test, args=(pipe_watcher, broadcaster))
    comm_thread.start()
    watcher_thread.start()
    print("started threads")
    print("controls: [q]uit\t[a]/[z] delay\t[c]hange broadcaster\t[l]evels reload")
    try:
        while True:
            inp = readkey()
            if inp == 'q':
                raise Exception('Quit pressed')
            elif inp == 'a':
                pipe_watcher.put(('delay', 0.5))
            elif inp == 'z':
                pipe_watcher.put(('delay', -0.5))
            elif inp == 'c':
                new_broadcaster = input('Enter new broadcaster: ')
                pipe_comm.put(('broadcaster', new_broadcaster))
                pipe_watcher.put(('broadcaster', new_broadcaster))
            elif inp == 'l':
                pipe_comm.put(('levels_reload'))
        watcher_thread.join()
        comm_thread.join()
    except Exception as ex:
        print('main thread error', ex)
        pipe_comm.put(Exception('main thread error'))
        pipe_watcher.put(Exception('main thread error'))
    finally:
        print("finally")


def communicator_runner(pipe, broadcaster):
    estim = estim2bCom(settings["serialPort"],settings["tipLevels"],settings["specialTips"],settings["mode"],settings["power"])
    asyncio.run(estim.communicator(pipe, broadcaster))
    print('communicator_runner finished')


def comm_test(tips_queue, broadcaster):
    try:
        while True:
            print('test: 666 wave 10s')
            tips_queue.put(Tip(666, time.time() - 6))
            time.sleep(12)
            print('test: 777 pulse 10s')
            tips_queue.put(Tip(777, time.time() - 6))
            time.sleep(12)
            print('test: 888 earthquake 10s')
            tips_queue.put(Tip(888, time.time() - 6))
            time.sleep(12)
            print('test: 999 fireworks 10s')
            tips_queue.put(Tip(999, time.time() - 6))
            time.sleep(15)
            print('test: nothing 10s')
            time.sleep(10)

    except Exception as ex:
        print('comm_test error')
        print(traceback.format_exc())
    finally:
        print('comm_test done')


def chat_watcher_runner(tips_queue, broadcaster):
    cb = Chaturbate()

    asyncio.run(cb.chat_watcher(tips_queue, broadcaster))
    print('chat_watcher_runner finished')


def comm_dummy(pipe, broadcaster):

    try:
        while True:
            try:
                el = pipe.get()
                print('recv' + str(el) + '\r\n')
                if type(el) == Tip:
                    print("type is tip")
                    print(type(el))
                if type(el) == Exception:
                    raise el
            except Empty:
                time.sleep(10)
    except Exception:
        print('comm_dummy error')
        print(traceback.format_exc())



if __name__ == '__main__':
    main()
