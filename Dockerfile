# Build stage
FROM node:20 AS builder

# Install system dependencies required for wasm-pack
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Rust and wasm-pack
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy the rest of the application
COPY . .

# Install dependencies
RUN pnpm install

# Generate WASM and protobuf files, then build the application
RUN pnpm gen && pnpm build

# Production stage
FROM node:20 AS production

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/.output/ ./.output

# Expose the port the app runs on
EXPOSE 3000

# Start the serve package
CMD ["node", ".output/server/index.mjs"]
