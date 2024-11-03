<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/logo-dark.svg">
  <img alt="crates.io logo" src="./docs/logo.svg" width="200">
</picture>
</div>

---

<div align="center">

[Homepage](https://github.com/Rustin170506/tokio-console-web)
| [Discord](https://discord.gg/EeF3cQw)
| [Contributing](#️-contributing)

</div>

## 🦀 Overview

Welcome to the `tokio-console-web` project! This project is a web-based console for the [console-subscriber] crate. It is designed to be a simple, easy-to-use, and powerful tool for monitoring and debugging your `tokio` applications.

## 🚀 Getting Started

To use `tokio-console-web`, follow these steps:

1. **Using Docker (Recommended):**

    You can quickly get started by pulling the Docker image:

    ```sh
    docker pull ghcr.io/rustin170506/tokio-console-web:latest
    docker run -p 3000:3000 ghcr.io/rustin170506/tokio-console-web:latest
    ```

2. **Manual Setup:**

    If you prefer to set up manually, follow these steps:

    1. Enable the `grpc_web` feature in your `console-subscriber` dependency:

        ```toml
        [dependencies]
        console-subscriber = { version = "0.4.0", features = ["grpc-web"] }
        ```

    2. Configure your application to use the `ConsoleLayer` with gRPC-Web enabled:

        ```rust
        use std::net::Ipv4Addr;

        console_subscriber::ConsoleLayer::builder()
            .enable_grpc_web(true)
            .server_addr((Ipv4Addr::UNSPECIFIED, 9999))
            .init();
        ```

    3. Clone this repository and run `pnpm install` to install the dependencies.

        ```sh
        git clone https://github.com/Rustin170506/tokio-console-web.git
        cd tokio-console-web
        pnpm install
        ```

    4. Install Rust toolchain.

        ```sh
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
        ```

    5. Run `pnpm dev` to start the development server.

        ```sh
        pnpm dev
        ```

    6. Access the web console at `http://127.0.0.1:3000` in your browser.

## 🛠️ Contributing

Contributions are welcome! Please feel free to submit a Pull Request. If you have any questions, please feel free to ask in the [Discord](https://discord.gg/EeF3cQw) server.

## ⚖️ License

Licensed under either of these:

-   Apache License, Version 2.0, ([LICENSE-APACHE](./LICENSE-APACHE) or https://www.apache.org/licenses/LICENSE-2.0)
-   MIT license ([LICENSE-MIT](./LICENSE-MIT) or https://opensource.org/licenses/MIT)

[console-subscriber]: https://crates.io/crates/console-subscriber
