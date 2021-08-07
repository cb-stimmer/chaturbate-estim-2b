# SPDX-License-Identifier: LGPL-3.0-or-later
# Chaturbate parser based on work by cgakdr
# Copyright (C) 2021 cgakdr

class Tip(object):
    val = 0
    timestamp = 0

    def __init__(self, val, timestamp, level=None):
        self.val = val
        self.timestamp = timestamp

    def __str__(self):
        return f'Tip val:{self.val} timestamp:{self.timestamp}'
