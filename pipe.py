"""
A pipe class to emulate the *nix pipe(2), "a unidirectional data channel that can be used for interprocess communication."
Creates 2 queues, where each thread/process reads from one and writes to the other. It looks like a single queue to each thread/process.
"""
# SPDX-License-Identifier: LGPL-3.0-or-later
# Chaturbate parser based on work by cgakdr
# Copyright (C) 2021 cgakdr

class Pipe:

    def __init__(self):
        from queue import SimpleQueue
        q = (SimpleQueue(), SimpleQueue())
        self.pipe_a = self._PipeQueue(*q)
        self.pipe_b = self._PipeQueue(*q[::-1])

    class _PipeQueue:

        def __init__(self, q_ro, q_wo):
            self._q_ro = q_ro
            self._q_wo = q_wo

        def get(self, **kwargs):
            return self._q_ro.get(kwargs)

        def get_nowait(self):
            return self._q_ro.get_nowait()

        def put(self, item, **kwargs):
            return self._q_wo.put(item, kwargs)

        def clear(self):
            return self._q_ro.clear()
        
        def len_read(self):
            return self._q_ro.qsize()

        def len_write(self):
            return self._q_wo.qsize()
