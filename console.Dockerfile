# renovate: datasource=github-tags depName=rust lookupName=rust-lang/rust
ARG RUST_VERSION=1.75.0@sha256:87f3b2f93b82995443a1a558c234212dafe79cfdc3af956539610560369ddcd0

FROM rust:$RUST_VERSION

RUN apt-get update \
    && apt-get install -y git

RUN git clone https://github.com/tokio-rs/console.git /opt/console

WORKDIR /opt/console

# Start app example with web feature enabled
CMD ["cargo", "run", "--release", "--example", "grpc_web", "--features", "grpc-web"]

# Expose port 8888
EXPOSE 8888
