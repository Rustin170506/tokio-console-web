use std::process::Command;

fn check_command_exists(command: &str) -> bool {
    Command::new("which")
        .arg(command)
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

fn main() {
    if !check_command_exists("node") {
        panic!("Node.js is not installed. Please install Node.js to continue.");
    }

    if !check_command_exists("pnpm") {
        panic!("pnpm is not installed. Please install pnpm to continue.");
    }

    // Check if wasm-pack is installed
    if !check_command_exists("wasm-pack") {
        panic!("wasm-pack is not installed. Please install wasm-pack to continue.");
    }

    // Run wasm-pack build for histogram (which is inside app directory)
    let wasm_pack_build = Command::new("wasm-pack")
        .current_dir("app")
        .args(&["build", "histogram"])
        .output()
        .expect("Failed to execute wasm-pack build");

    if !wasm_pack_build.status.success() {
        panic!("wasm-pack build failed");
    }

    let output = Command::new("pnpm")
        .current_dir("app")
        .arg("build")
        .output()
        .expect("Failed to execute pnpm build");

    if !output.status.success() {
        panic!("pnpm build failed");
    }

    println!("cargo:rerun-if-changed=app");
}
