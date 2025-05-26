"""SimpleJinja2Templates

This class is a wrapper class of the Jinja2Templates, which helps to find the directory of templates easily.
Just set a directory name without absolute path, it find and set the absolute path.
"""
import glob
import inspect
import logging
import os.path

from fastapi.templating import Jinja2Templates


class SimpleJinja2Templates(Jinja2Templates):
    UPWARD_DIR_DEPTH = 7

    def __init__(self, directory: str = 'templates') -> None:
        if directory.startswith('./') or directory.startswith('/'):
            super(SimpleJinja2Templates, self).__init__(directory=directory)
        else:
            super(SimpleJinja2Templates, self).__init__(
                directory=self._find_template_dir(directory, self.UPWARD_DIR_DEPTH)
            )

    def _find_template_dir(self, directory: str, depth: 5):
        module = inspect.getmodule(inspect.stack()[2][0])
        current_path = os.path.dirname(os.path.abspath(module.__file__))
        found = None
        for i in range(depth):
            for d in filter(lambda f: os.path.isdir(f), glob.glob(f'{current_path}/{"../" * i}*')):
                relative_dir = d.split(os.sep)[-1]
                if relative_dir == directory:
                    logging.debug(f'FastAPI templates directory found: {d}')
                    found = d
                    break

            if found:
                break

        return found if found else directory