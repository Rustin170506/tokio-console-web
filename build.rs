use std::process::{exit, Command};

const PNPM_WINDOWS: &str = "pnpm.cmd";
const PNPM_UNIX: &str = "pnpm";
const REQUIRED_COMMANDS: [&str; 2] = ["node", "pnpm"];
const BUILD_STEPS: [(&str, &str, &[&str]); 2] =
    [("pnpm", "app", &["install"]), ("pnpm", "app", &["build"])];

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

    println!(
        "Running command: {} in directory: {} with arguments: {:?}",
        cmd, dir, args
    );

    let output = Command::new(cmd)
        .current_dir(dir)
        .args(args)
        .output()
        .map_err(|e| format!("Failed to execute {}: {}", name, e))?;

    if !output.status.success() {
        eprintln!(
            "Command stderr: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        return Err(format!("Error: {} failed", name));
    }

    println!(
        "Command stdout: {}",
        String::from_utf8_lossy(&output.stdout)
    );
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
