"""Filtro de registros que enmascara credenciales y correos (FR-033, RNF-06; research R-11).

Se asocia a todos los handlers de LOGGING. Actúa sobre el mensaje ya formateado (con sus
argumentos), el texto de la excepción y la pila, para que nada sensible llegue a la salida.
"""

import logging
import re

JWT_PATTERN = re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*")
EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_FORMATTER = logging.Formatter()


def redact(text: str) -> str:
    return EMAIL_PATTERN.sub("[correo]", JWT_PATTERN.sub("[jwt]", text))


class RedactFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            message = record.getMessage()
        except (TypeError, ValueError):
            message = str(record.msg)
        record.msg = redact(message)
        record.args = ()
        if record.exc_info:
            record.exc_text = redact(_FORMATTER.formatException(record.exc_info))
        elif record.exc_text:
            record.exc_text = redact(record.exc_text)
        if record.stack_info:
            record.stack_info = redact(record.stack_info)
        return True
