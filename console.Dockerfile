# renovate: datasource=github-tags depName=rust lookupName=rust-lang/rust
ARG RUST_VERSION=1.75.0@sha256:755b46a632bc0c1b95aa8a8babfca92c3f8f91e041d3095132b5f5c8ec99bd22

FROM rust:$RUST_VERSION

RUN apt-get update \
    && apt-get install -y git

# Clone specific branch of tokio-console repo into /opt/console
# TODO: Change to official repo once PR is merged.
RUN git clone -b rustin-patch-grpc-web https://github.com/hi-rustin/console.git /opt/console

WORKDIR /opt/console

# Start app example with web feature enabled
CMD ["cargo", "run", "--release", "--example", "grpc_web", "--features", "grpc-web"]

# Expose port 8888
EXPOSE 8888
