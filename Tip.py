class Tip(object):
    val = 0
    timestamp = 0

    def __init__(self, val, timestamp, level=None):
        self.val = val
        self.timestamp = timestamp

    def __str__(self):
        return f'Tip val:{self.val} timestamp:{self.timestamp}'
