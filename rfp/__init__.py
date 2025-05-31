import logging.config
import os.path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from fastapi.middleware.cors import CORSMiddleware

from summer_toolkit.framework.router_scanner import RouterScanner
from summer_toolkit.utility.environment import Environment


def create_app():
    env = Environment()

    logging.config.dictConfig(env.props['summer']['logger'])

    app = FastAPI(
        title=env.get_props('summer.docs.title'),
        description=env.get_props('summer.docs.description'),
        version=env.get_props('summer.docs.version'),
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.mount('/static', StaticFiles(directory=f'{os.path.dirname(os.path.realpath(__file__))}/static'), name='static')
    RouterScanner.scan(app)

    return app
