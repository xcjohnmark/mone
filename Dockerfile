# ==============================================================================
# mone-agent — Lightweight Cloud Container (AWS EC2 / Fly.io / Docker)
# Autonomous Weather Prediction Market Trading Agent
# ==============================================================================

FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files
COPY pyproject.toml requirements.txt README.md* ./

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir fastapi uvicorn

# Copy codebase
COPY mone/ /app/mone/
COPY backtest_results.json* /app/

# Install package globally
RUN pip install --no-cache-dir -e .

# Expose API companion port
EXPOSE 8000

# Volume for persistent SQLite ledger & backtest cache
VOLUME ["/app/data"]

# Default environment configuration
ENV DATABASE_URL="sqlite:////app/data/mone.db"
ENV PYTHONUNBUFFERED=1

# Default command: Runs both agent recurring loop and FastAPI dashboard
CMD ["python", "-m", "mone.server"]
