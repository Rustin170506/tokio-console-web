use std::net::SocketAddr;

use axum::{
    extract::State,
    http::{header, StatusCode, Uri},
    response::{Html, IntoResponse, Response},
    routing::Router,
};
use clap::{Parser, ValueHint};
use rust_embed::RustEmbed;
use serde::Serialize;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

static INDEX_HTML: &str = "index.html";
static CONSOLE_CONFIG_PATH: &str = "console.json";

#[derive(Parser, Debug)]
#[command(version, about)]
/// tokio-console-web - A web-based console for tokio applications.
struct Args {
    #[arg(long, value_hint = ValueHint::Hostname)]
    #[clap(default_value = "127.0.0.1")]
    /// The address to listen on.
    pub(crate) host: Option<String>,
    #[arg(long)]
    #[clap(default_value = "3333")]
    /// The port to listen on.
    pub(crate) port: Option<u16>,

    #[arg(long)]
    /// The URL of the subscriber.
    /// [default: http://127.0.0.1:9999]
    pub(crate) subscriber_base_url: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ConsoleConfig {
    subscriber_base_url: Option<String>,
}

#[derive(RustEmbed)]
#[folder = "app/.output/public"]
struct Assets;

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "tokio_console_web=debug,tower_http=debug".parse().unwrap()),
        )
        .init();

    let args = Args::parse();
    let addr = SocketAddr::new(args.host.unwrap().parse().unwrap(), args.port.unwrap());
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    let config = ConsoleConfig {
        subscriber_base_url: args.subscriber_base_url,
    };
    tracing::info!("listening on {}", listener.local_addr().unwrap());
    let app = Router::new().fallback(static_handler).with_state(config);
    axum::serve(listener, app.layer(TraceLayer::new_for_http()))
        .await
        .unwrap();
}

async fn static_handler(uri: Uri, State(config): State<ConsoleConfig>) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/');
    if path == CONSOLE_CONFIG_PATH {
        if config.subscriber_base_url.is_some() {
            return match serde_json::to_string(&config) {
                Ok(json) => ([(header::CONTENT_TYPE, "application/json")], json).into_response(),
                Err(e) => {
                    tracing::error!("failed to serialize console config: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "500").into_response()
                }
            };
        }
    }

    if path.is_empty() || path == INDEX_HTML {
        return index_html().await;
    }

    match Assets::get(path) {
        Some(content) => {
            let mime = mime_guess::from_path(path).first_or_octet_stream();

            ([(header::CONTENT_TYPE, mime.as_ref())], content.data).into_response()
        }
        None => {
            if path.contains('.') {
                return not_found().await;
            }

            index_html().await
        }
    }
}

async fn index_html() -> Response {
    match Assets::get(INDEX_HTML) {
        Some(content) => Html(content.data).into_response(),
        None => not_found().await,
    }
}

async fn not_found() -> Response {
    (StatusCode::NOT_FOUND, "404").into_response()
}
