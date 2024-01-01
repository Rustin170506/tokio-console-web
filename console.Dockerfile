# renovate: datasource=github-tags depName=rust lookupName=rust-lang/rust
ARG RUST_VERSION=1.75.0@sha256:e17a45360b8569720da89dd7bf3c8628ba801c0758c8b4f12b1b32a9327a43a7

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
