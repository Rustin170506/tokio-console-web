use std::env;
use std::process::{exit, Command};

fn get_pnpm_command() -> &'static str {
    if cfg!(target_os = "windows") {
        "pnpm.cmd"
    } else {
        "pnpm"
    }
}

fn check_command_exists(command: &str) -> bool {
    let cmd = if command == "pnpm" {
        get_pnpm_command()
    } else {
        command
    };
    Command::new(cmd)
        .arg("--version")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

fn run_command(name: &str, dir: &str, args: &[&str]) -> Result<(), String> {
    let cmd = if name == "pnpm" {
        get_pnpm_command()
    } else {
        name
    };
    let output = Command::new(cmd)
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
            eprintln!(
                "Error: {} is not found in PATH. Current PATH: {:?}",
                cmd,
                env::var("PATH")
            );
            eprintln!(
                "Error: {} is not installed or not in PATH. Please install it to continue.",
                cmd
            );
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
