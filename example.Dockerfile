FROM rust:1.77

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

RUN npm install -g pnpm

WORKDIR /usr/src/myapp

COPY . .

RUN cargo build --example grpc_web

CMD ["cargo", "run", "--example", "grpc_web"]
