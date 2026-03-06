FROM python:3.12-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --no-cache-dir -e "."

COPY . .

RUN printf '#!/bin/bash\nset -e\necho "Running migrations..."\npython -m alembic upgrade head\necho "Starting server..."\nexec uvicorn app.main:app --host 0.0.0.0 --port 3400\n' \
    > /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 3400

CMD ["/entrypoint.sh"]
