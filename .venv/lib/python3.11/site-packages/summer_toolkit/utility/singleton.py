import threading


class Singleton(type):
    LOCK = 'lock'
    INSTANCE = 'instance'

    _instances = {}
    lock = threading.Lock()

    def __call__(cls, *args, **kwargs):
        with cls.lock:
            if cls not in cls._instances:
                cls._instances[cls] = {
                    cls.LOCK: threading.Lock()
                }

        with cls._instances[cls][cls.LOCK]:
            if not cls._instances[cls].get(cls.INSTANCE):
                cls._instances[cls][cls.INSTANCE] = super(Singleton, cls).__call__(*args, **kwargs)

            return cls._instances[cls][cls.INSTANCE]
