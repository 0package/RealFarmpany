import inspect
import os
from pathlib import Path


def find_current_dir(start_frame_depth=2):
    """
    find the absolute path of the current directory
    It find the valid path although it is imported as a external module.

    :param start_frame_depth: use the default value when calling it in a method of a class
                set 1 when calling in global environment
    :return: current directory path or None
    """
    current_dir = None
    working_directory = str(Path.cwd()).split(os.sep)[-1]
    frames = inspect.stack()
    module_name = None
    for i in range(start_frame_depth, len(frames)):
        filename = frames[i].filename
        if working_directory in frames[i].filename \
                and 'site-packages' not in filename and 'dist-packages' not in filename:
            module_name = frames[i][0]
            break

    if module_name:
        module = inspect.getmodule(module_name)
        current_dir = os.path.dirname(os.path.abspath(module.__file__))

    return current_dir
