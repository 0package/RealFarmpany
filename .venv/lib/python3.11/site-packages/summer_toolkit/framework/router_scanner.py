import glob
import importlib
import logging
import os

from fastapi import FastAPI

from summer_toolkit.utility.file import find_current_dir


class RouterScanner:
    @staticmethod
    def scan(app: FastAPI, name_pattern='*_router.py'):
        current_dir = find_current_dir()
        module_root = current_dir.split(os.sep)[-1]
        for router in filter(
            lambda f: os.path.isfile(f), glob.glob(f'{current_dir}/**/{name_pattern}', recursive=True)
        ):
            module_relative_path = '.'.join(router.replace(current_dir, '').split(os.sep)).replace('.py', '')
            module_full_name = f'{module_root}{module_relative_path}'
            try:
                module = importlib.import_module(module_full_name)
                target = getattr(module, module_full_name.split('.')[-1])
                logging.info(f'{module_full_name} loaded automatically')
            except Exception as exc:
                target = None
                logging.warning(f'{module_full_name} not loaded', exc_info=exc)

            if target:
                app.include_router(target)
