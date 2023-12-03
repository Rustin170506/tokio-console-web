# renovate: datasource=github-tags depName=rust lookupName=rust-lang/rust
ARG RUST_VERSION=1.74.0@sha256:6de6071df133f8be44dd4538c74e93590941c6d2b9c98853e05011714fbcf57d

FROM rust:$RUST_VERSION

RUN apt-get update \
    && apt-get install -y git

# Clone specific branch of tokio-console repo into /opt/console
# TODO: Change to official repo once PR is merged.
RUN git clone -b rustin-patch-grpc-web https://github.com/hi-rustin/console.git /opt/console

WORKDIR /opt/console

# Start app example with web feature enabled
CMD ["cargo", "run", "--release", "--example", "app", "--features", "web"]

# Expose port 8888
EXPOSE 8888
