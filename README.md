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

The `tokio-console-web` can be installed using the following methods:

For a direct download and installation, execute the following command:

```sh
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/Rustin170506/tokio-console-web/releases/download/v0.1.1-beta.2/tokio-console-web-installer.sh | sh
```

If you're using `powershell`, the following command can be used:

```powershell
powershell -c "irm https://github.com/Rustin170506/tokio-console-web/releases/download/v0.1.1-beta.2/tokio-console-web-installer.ps1 | iex"
```

For those using homebrew, the following command will install `tokio-console-web`:

```sh
brew install Rustin170506/homebrew-tokio-console-web/tokio-console-web
```

Additional installation methods for `tokio-console-web` can be found on the release page.

After installation, the `tokio-console-web` can be started using the following command:

```sh
tokio-console-web
```

The `tokio-console-web` can be accessed by navigating to `http://127.0.01:3333` in your web browser.

```console
$ tokio-console-web --help
A web console for tokio

Usage: tokio-console-web[EXE] [OPTIONS]

Options:
      --host <HOST>  The address to listen on [default: 127.0.0.1]
      --port <PORT>  The port to listen on [default: 3333]
  -h, --help         Print help
  -V, --version      Print version

```

## 🛠️ Contributing

Contributions are welcome! Please feel free to submit a Pull Request. If you have any questions, please feel free to ask in the [Discord](https://discord.gg/EeF3cQw) server.

## ⚖️ License

Licensed under either of these:

- Apache License, Version 2.0, ([LICENSE-APACHE](./LICENSE-APACHE) or https://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](./LICENSE-MIT) or https://opensource.org/licenses/MIT)

[console-subscriber]: https://crates.io/crates/console-subscriber
