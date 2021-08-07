async def communicator(tips_queue, broadcaster):
    
    async def do_comm(timeout, val):
        if isinstance(val, Number):
            print('do_comm with ' + str(timeout) + 's@' +
                  str(val))
            await dev.send_vibrate_cmd(val)
            await asyncio.sleep(timeout)
        elif type(val) == type('str'):
            print('do_comm with ' + str(timeout) + 's@' + val)
            patterns = {'wave': (0.4, 0.4, 0.4, 0.4, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.6, 0.6, 0.6, 0.6, 0.6, 0.7, 0.7, 0.7, 0.7, 0.7, 0.8, 0.8, 0.8, 0.8, 0.8, 1.0, 1.0, 1.0, 1.0, 1.0, 0.8, 0.8, 0.8, 0.8, 0.8, 0.7, 0.7, 0.7, 0.7, 0.7, 0.6, 0.6, 0.6, 0.6, 0.6, 0.5, 0.5, 0.5, 0.5, 0.5),
                        'pulse': (1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0),
                        'earthquake': (0.4, 0.4, 0.4, 0.4, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.6, 0.6, 0.6, 0.6, 0.6, 1.0, 1.0, 1.0, 1.0, 1.0, 0.7, 0.7, 0.7, 0.7, 0.7, 1.0, 1.0, 1.0, 1.0, 1.0, 0.7, 0.7, 0.7, 0.7, 0.7, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0),
                        'fireworks': (0.4, 0.4, 0.4, 0.4, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.6, 0.6, 0.6, 0.6, 0.6, 0.7, 0.7, 0.7, 0.7, 0.7, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0)}
            pattern = patterns[val]
            idx = 0
            start = time.time()
            while time.time() < start + timeout:
                await dev.send_vibrate_cmd(pattern[idx % len(pattern)])
                idx += 1
                await asyncio.sleep(0.1)
        else:
            raise ValueError('Got type ' + str(type(val)))

    async def init_buttplug():
        nonlocal dev
        client = ButtplugClient('Waves Client')
        connector = ButtplugClientWebsocketConnector('ws://127.0.0.1:12345')
        client.device_added_handler += on_device_added
        await client.connect(connector)
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', category=RuntimeWarning)
            client.request_log('Off')
        await client.start_scanning()
        while dev == None:
            await asyncio.sleep(0.5)
        await client.stop_scanning()
        print('device ready')
        return client

    def on_device_added(emitter, new_dev: ButtplugClientDevice):
        print(f'device added {new_dev.name}')
        asyncio.create_task(on_device_added_task(new_dev))

    async def on_device_added_task(new_dev):
        nonlocal dev
        assert 'VibrateCmd' in new_dev.allowed_messages.keys()
        await new_dev.send_vibrate_cmd(0.25)
        await asyncio.sleep(0.25)
        await new_dev.send_vibrate_cmd(0)
        dev = new_dev

    def init_user(tips_queue, broadcaster):
        users = json.load(open('levels.json', 'r'))
        user = None
        if broadcaster in users:
            user = users[broadcaster]
        else:
            print('broadcaster not found in levels.json, using default')
            user = users['default']
        rand = [l for l in user if 'type' in l and l['type'] == 'e' and 'level' in l and l['level'] == 'r']
        if len(rand) > 0:
            tips_queue.put(('random_levels', rand[0]))
        else:
            tips_queue.put(('random_levels', None))
        return user

    levelmap = {'0': 0.0,
                'L': 0.25,
                'M': 0.5,
                'H': 0.75,
                'U': 1.0}
    OFF = 0.0

    client = None
    try:
        user = init_user(tips_queue, broadcaster)
        dev = None
        client = await init_buttplug()

        delay = 6
        while True:  # each loop iteration handles 1 message
            while True:  # wait for queue message but also allow interrupts
                try:
                    msg = tips_queue.get(timeout=0.1)
                    if type(msg) == Tip:
                        log.debug('recv tip ' + str(msg.val))
                        break
                    else:  # TODO: handle Exception type
                        log.debug('recv command ' + str(msg[0]))
                        if msg[0] == 'delay':
                            delay += msg[1]
                            log.info('new delay: ' + str(delay))
                        elif msg[0] == 'broadcaster':
                            broadcaster = msg[1]
                            tips_queue.clear()
                            user = init_user(tips_queue, broadcaster)
                            log.info('new broadcaster ' + broadcaster)
                        elif msg[0] == 'levels_reload':
                            user = init_user(tips_queue, broadcaster)
                        continue
                except Empty:
                    continue
            tip: Tip = msg
            while time.time() < tip.timestamp + delay:
                await asyncio.sleep(0.25)
            # handle tips
            for level in user:
                if (level['type'] == 'e' and tip.val == level['value']) or (
                        level['type'] == 'g' and tip.val >= level['value']):
                    if level['level'] == 'x':
                        raise Exception('Exception requested in levels.json')
                    elif level['level'] == 'r':
                        tip.val = random.choice(level['selection'])
                        continue
                    elif level['level'] == 'c':
                        tips_queue.clear()
                    else:
                        lvl = None
                        if level['level'] in levelmap:
                            lvl = levelmap[level['level']]
                        lvl = lvl or level['level']
                        await do_comm(level['time'], lvl)
                    break

            await dev.send_vibrate_cmd(OFF)
            log.debug('sent off')
    except ValueError as ex:  # non-int in queue
        print("com valueerror")
        print(traceback.format_exc())
    except Exception as ex:
        print("comm error")
        print(traceback.format_exc())
    finally:
        try:
            await do_comm(0.1, OFF)
        except:
            pass
        try:
            if client != None:
                await client.disconnect()
        except:
            pass
        return