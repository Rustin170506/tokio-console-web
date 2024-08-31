use std::process::{exit, Command};

fn check_command_exists(command: &str) -> bool {
    Command::new("which")
        .arg(command)
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

fn run_command(name: &str, dir: &str, args: &[&str]) -> Result<(), String> {
    let output = Command::new(name)
        .current_dir(dir)
        .args(args)
        .output()
        .map_err(|e| format!("Failed to execute {}: {}", name, e))?;

    if !output.status.success() {
        return Err(format!("Error: {} failed", name));
    }
    Ok(())
}

fn main() {
    // Check for required commands
    let required_commands = ["node", "pnpm", "wasm-pack"];
    for &cmd in required_commands.iter() {
        if !check_command_exists(cmd) {
            eprintln!("Error: {} is not installed. Please install it to continue.", cmd);
            if cmd == "wasm-pack" {
                eprintln!("You can install it using: cargo install wasm-pack");
            }
            exit(1);
        }
    }

    // Run build commands
    let build_steps = [
        ("wasm-pack", "app", &["build", "histogram"][..]),
        ("pnpm", "app", &["install"][..]),
        ("pnpm", "app", &["build"][..]),
    ];

    for (cmd, dir, args) in build_steps.iter() {
        if let Err(e) = run_command(cmd, dir, args) {
            eprintln!("{}", e);
            exit(1);
        }
    }

    println!("cargo:rerun-if-changed=app");
}
