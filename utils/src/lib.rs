use std::{env, path::PathBuf};

/// Returns the path to the application's data directory: `~/.{key}`.
///
/// This follows the convention of tools like Maven (`.m2`), Cargo (`.cargo`),
/// or Rustup (`.rustup`), placing a hidden directory directly in the user's
/// home directory.
///
/// ### Path Resolution:
/// 1. `$HOME/.{key}` (Standard)
/// 2. `./.{key}` (Fallback if home is unavailable)
///
/// ### Side Effects:
/// This function **does not** create the directory. It is a pure path
/// constructor. Callers should use `std::fs::create_dir_all` before
/// performing I/O.
pub fn app_data_dir(key: &str) -> PathBuf {
    let mut path = env::home_dir()
        .or_else(|| env::current_dir().ok())
        .unwrap_or_else(|| PathBuf::from("."));

    let hidden_key = format!(".{}", key.trim_start_matches('.'));
    path.push(hidden_key);
    path
}
