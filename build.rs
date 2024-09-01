use std::process::{exit, Command};

const PNPM_WINDOWS: &str = "pnpm.cmd";
const PNPM_UNIX: &str = "pnpm";
const REQUIRED_COMMANDS: [&str; 3] = ["node", "pnpm", "wasm-pack"];
const BUILD_STEPS: [(&str, &str, &[&str]); 3] = [
    ("wasm-pack", "app", &["build", "histogram"]),
    ("pnpm", "app", &["install"]),
    ("pnpm", "app", &["build"]),
];

fn get_pnpm_command() -> &'static str {
    if cfg!(target_os = "windows") {
        PNPM_WINDOWS
    } else {
        PNPM_UNIX
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
    for &cmd in REQUIRED_COMMANDS.iter() {
        if !check_command_exists(cmd) {
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
    for &(cmd, dir, args) in BUILD_STEPS.iter() {
        if let Err(e) = run_command(cmd, dir, args) {
            eprintln!("{}", e);
            exit(1);
        }
    }

    println!("cargo:rerun-if-changed=app");
}
