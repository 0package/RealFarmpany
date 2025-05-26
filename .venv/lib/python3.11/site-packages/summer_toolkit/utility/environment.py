import logging
import os.path
from functools import reduce

from summer_toolkit.utility.file import find_current_dir


class Environment:
    DEFAULT_FILE = 'properties'
    DEFAULT_FILE_EXT = '.yml'
    CONFIG_PATH = 'config/'
    DEFAULT_PHASE = 'default'
    OS_ENV_VAR_NAME = 'SUMMER_DEPLOYMENT_PHASE'
    DEFAULT_CONFIG_DIR_DEPTH_LIMIT = 10

    def __init__(self, config_dir_depth_limit=None, config_dir_path=None):
        if not config_dir_depth_limit:
            self.config_dir_depth_limit = self.DEFAULT_CONFIG_DIR_DEPTH_LIMIT
        else:
            self.config_dir_depth_limit = config_dir_depth_limit

        self.current_dir = find_current_dir()
        assert self.current_dir

        if config_dir_path:
            self.abs_config_path = config_dir_path
        else:
            self.abs_config_path = self.__find_config_dir()

        self.__validate_config_path_and_file()

        if self.OS_ENV_VAR_NAME in os.environ:
            self.active_phase = os.environ[self.OS_ENV_VAR_NAME]
        else:
            self.active_phase = self.DEFAULT_PHASE

        self.props = self.compose_props()

    def __find_config_dir(self):
        upward_path = os.sep
        found = ''
        for i in range(self.config_dir_depth_limit):
            path = self.current_dir + upward_path + self.CONFIG_PATH + self.DEFAULT_FILE + self.DEFAULT_FILE_EXT
            if os.path.exists(path):
                found = path
                logging.debug(f'Configuration directory found: {found}')
                break

            upward_path += f'..{os.sep}'

        return os.path.dirname(found)

    def __validate_config_path_and_file(self):
        if not self.abs_config_path or not os.path.exists(self.abs_config_path):
            raise FileNotFoundError(f'The directory for properties files NOT FOUND: {self.abs_config_path}')

    def compose_props(self):
        default = self.load_yaml()
        if self.active_phase != self.DEFAULT_PHASE:
            phase = self.load_yaml(self.active_phase)
            if phase:
                self.dict_merge(default, phase)

        return default

    def load_yaml(self, phase=''):
        yaml_file = self.DEFAULT_FILE + (('-' + phase) if phase != '' else '')
        yaml_file += self.DEFAULT_FILE_EXT
        abspath = os.path.join(self.abs_config_path, yaml_file)

        if os.path.exists(abspath):
            with open(abspath, 'r', encoding='utf-8') as fp:
                import yaml
                yaml_loaded = yaml.full_load(fp)
                return yaml_loaded

        return None

    def dict_merge(self, dest: dict = None, src: dict = None):
        assert src
        if dest is None:
            dest = {}

        for k, v in src.items():
            if dest.get(k) is None or isinstance(v, dict) is not True:
                dest[k] = v
            else:
                self.dict_merge(dest[k], v)

    # noinspection PyBroadException
    def get_props(self, key, default_value=''):
        try:
            return reduce(lambda c, k: c[k], key.split('.'), self.props)
        except Exception:
            return default_value
