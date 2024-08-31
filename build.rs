use std::process::{exit, Command};

fn check_command_exists(command: &str) -> bool {
    Command::new("which")
        .arg(command)
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

fn main() {
    if !check_command_exists("node") {
        eprintln!("Error: Node.js is not installed. Please install Node.js to continue.");
        exit(1);
    }

    if !check_command_exists("pnpm") {
        eprintln!("Error: pnpm is not installed. Please install pnpm to continue.");
        exit(1);
    }

    // Check if wasm-pack is installed
    if !check_command_exists("wasm-pack") {
        eprintln!("Error: wasm-pack is not installed. Please install wasm-pack to continue.");
        eprintln!("You can install it using: cargo install wasm-pack");
        exit(1);
    }

    // Run wasm-pack build for histogram (which is inside app directory)
    let wasm_pack_build = Command::new("wasm-pack")
        .current_dir("app")
        .args(&["build", "histogram"])
        .output()
        .expect("Failed to execute wasm-pack build");

    if !wasm_pack_build.status.success() {
        eprintln!("Error: wasm-pack build failed");
        exit(1);
    }

    // Install dependencies
    let pnpm_install = Command::new("pnpm")
        .current_dir("app")
        .arg("install")
        .output()
        .expect("Failed to execute pnpm install");

    if !pnpm_install.status.success() {
        eprintln!("Error: pnpm install failed");
        exit(1);
    }

    let output = Command::new("pnpm")
        .current_dir("app")
        .arg("build")
        .output()
        .expect("Failed to execute pnpm build");

    if !output.status.success() {
        eprintln!("Error: pnpm build failed");
        exit(1);
    }

    println!("cargo:rerun-if-changed=app");
}
