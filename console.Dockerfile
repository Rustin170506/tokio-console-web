# renovate: datasource=github-tags depName=rust lookupName=rust-lang/rust
ARG RUST_VERSION=1.74.1@sha256:fd45a543ed41160eae2ce9e749e5b3c972625b0778104e8962e9bfb113535301

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
