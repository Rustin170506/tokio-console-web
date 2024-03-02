use std::net::SocketAddr;

use axum::{
    http::{header, StatusCode, Uri},
    response::{Html, IntoResponse, Response},
    routing::Router,
};
use clap::{Parser, ValueHint};
use rust_embed::RustEmbed;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

static INDEX_HTML: &str = "index.html";

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
}

#[derive(RustEmbed)]
#[folder = "app/.output/public"]
struct Assets;

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "tokio-console-web=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let args = Args::parse();
    let addr = SocketAddr::new(args.host.unwrap().parse().unwrap(), args.port.unwrap());
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    tracing::debug!("listening on {}", listener.local_addr().unwrap());

    let app = Router::new().fallback(static_handler);
    axum::serve(listener, app.layer(TraceLayer::new_for_http()))
        .await
        .unwrap();
}

async fn static_handler(uri: Uri) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/');

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
