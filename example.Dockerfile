FROM rust:1.77

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs=20.13.0-1nodesource1

RUN npm install -g pnpm@9.4.0

WORKDIR /usr/src/myapp

COPY . .

RUN cargo build --example grpc_web

CMD ["cargo", "run", "--example", "grpc_web"]
