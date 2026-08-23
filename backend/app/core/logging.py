"""Centralized logging setup.

Every module gets its logger from get_logger() so log format stays
consistent and secrets never accidentally reach stdout - callers must
pass already-redacted messages.
"""

import logging
import sys

_CONFIGURED = False


def configure_logging(level: int = logging.INFO) -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s | %(levelname)-8s | %(name)s | %(message)s")
    )
    root = logging.getLogger()
    root.setLevel(level)
    root.addHandler(handler)
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    configure_logging()
    return logging.getLogger(name)
