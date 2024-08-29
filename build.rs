use std::process::Command;

fn check_command_exists(command: &str) -> bool {
    let command_to_run = if cfg!(target_os = "windows") {
        Command::new("where").arg(command).output()
    } else {
        Command::new("which").arg(command).output()
    };

    command_to_run
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

    let output = Command::new("sh")
        .arg("-c")
        .arg("cd app && pnpm build")
        .output()
        .expect("Failed to execute pnpm build");

    if !output.status.success() {
        panic!("pnpm build failed");
    }

    println!("cargo:rerun-if-changed=app");
}
