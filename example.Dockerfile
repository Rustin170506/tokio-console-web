FROM rust:1.77

WORKDIR /usr/src/myapp

COPY . .

RUN cargo build --example grpc_web

CMD ["cargo", "run", "--example", "grpc_web"]