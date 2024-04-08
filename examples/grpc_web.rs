//! Example of using the console subscriber with tonic-web.
//! This example requires the `grpc-web` feature to be enabled.
//! Run with:
//! ```sh
//! cargo run --example grpc_web
//! ```
use std::net::Ipv4Addr;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    console_subscriber::ConsoleLayer::builder()
        .enable_grpc_web(true)
        .server_addr((Ipv4Addr::UNSPECIFIED, 9999))
        .init();

    let task1 = tokio::task::Builder::new()
        .name("task1")
        .spawn(spawn_tasks(1, 10))
        .unwrap();
    let task2 = tokio::task::Builder::new()
        .name("task2")
        .spawn(spawn_tasks(10, 30))
        .unwrap();

    let result = tokio::try_join! {
        task1,
        task2,
    };
    result?;

    Ok(())
}

#[tracing::instrument]
async fn spawn_tasks(min: u64, max: u64) {
    loop {
        for i in min..max {
            tracing::trace!(i, "spawning wait task");
            tokio::task::Builder::new()
                .name("wait")
                .spawn(wait(i))
                .unwrap();

            let sleep = Duration::from_secs(max) - Duration::from_secs(i);
            tracing::trace!(?sleep, "sleeping...");
            tokio::time::sleep(sleep).await;
        }
    }
}

#[tracing::instrument]
async fn wait(seconds: u64) {
    tracing::debug!("waiting...");
    tokio::time::sleep(Duration::from_secs(seconds)).await;
    tracing::trace!("done!");
}
