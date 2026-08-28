#!/usr/bin/env bash
#
# One-command bootstrap for Knip (Linux and macOS).
#
#   Checks that Node.js is installed and recent enough, installs it if missing
#   (using the distro/package manager detected), then runs the official Knip
#   setup: `npm init @knip/config`.
#
# Usage — a single command that does everything:
#   ./setup.sh
#   # or, without cloning anything:
#   curl -fsSL https://raw.githubusercontent.com/IndianCoder3/knip-fork/main/setup.sh | bash
#
# Windows: see setup.bat
#
set -euo pipefail

MIN_NODE_MAJOR=20
MIN_NODE_MINOR=19

log() { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
ok()  { printf '\033[1;32m  \u2713\033[0m %s\n' "$*"; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

node_version_ok() {
  command_exists node || return 1
  local major minor
  major=$(node -p 'process.versions.node.split(".")[0]')
  minor=$(node -p 'process.versions.node.split(".")[1]')
  if (( major > MIN_NODE_MAJOR )); then return 0; fi
  if (( major == MIN_NODE_MAJOR && minor >= MIN_NODE_MINOR )); then return 0; fi
  return 1
}

install_node() {
  local os
  os="$(uname -s)"
  case "$os" in
    Darwin)
      if command_exists brew; then
        log "Installing Node.js via Homebrew"
        brew install node
      elif command_exists port; then
        log "Installing Node.js via MacPorts"
        sudo port install nodejs22
      else
        echo "Install Homebrew (brew.sh) or Node.js >= $MIN_NODE_MAJOR.$MIN_NODE_MINOR manually." >&2
        exit 1
      fi
      ;;
    Linux)
      # Detect package manager / distro
      if command_exists apt-get; then
        log "Installing Node.js via apt (NodeSource)"
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
      elif command_exists pacman; then
        log "Installing Node.js via pacman"
        sudo pacman -S --noconfirm nodejs-lts-jod npm
      elif command_exists dnf; then
        log "Installing Node.js via dnf"
        sudo dnf install -y nodejs npm
      elif command_exists yum; then
        log "Installing Node.js via yum"
        sudo yum install -y nodejs npm
      elif command_exists zypper; then
        log "Installing Node.js via zypper"
        sudo zypper --non-interactive install nodejs22 npm
      elif command_exists apk; then
        log "Installing Node.js via apk"
        sudo apk add nodejs npm
      else
        echo "Could not detect a package manager. Install Node.js >= $MIN_NODE_MAJOR.$MIN_NODE_MINOR manually." >&2
        exit 1
      fi
      ;;
    *)
      echo "Unsupported OS ($os). Install Node.js >= $MIN_NODE_MAJOR.$MIN_NODE_MINOR manually." >&2
      exit 1
      ;;
  esac
}

# --- Prerequisite: Node.js ----------------------------------------------------
log "Checking for Node.js"
if node_version_ok; then
  ok "Node.js $(node -v) found"
else
  install_node
  if node_version_ok; then
    ok "Node.js $(node -v) installed"
  else
    echo "Node.js not detected after install. Add it to your PATH and re-run." >&2
    exit 1
  fi
fi

if ! command_exists npm; then
  echo "npm not found (it ships with Node.js). Check your installation." >&2
  exit 1
fi

# --- Knip setup ----------------------------------------------------------------
log "Running Knip setup (this installs dependencies and configures knip)"
npm init @knip/config

PROJECT_DIR="$(pwd)"
KNIP_CMD='cd "$PROJECT_DIR" && npm run knip'

create_desktop_entry() {
  local term
  for t in "$TERMINAL" gnome-terminal konsole xfce4-terminal xterm kitty alacritty wezterm; do
    if command_exists "$t"; then term="$t"; break; fi
  done
  term="${term:-x-terminal-emulator}"
  local apps_dir="$HOME/.local/share/applications"
  mkdir -p "$apps_dir"
  cat > "$apps_dir/knip.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Knip
Comment=Run npm run knip in $PROJECT_DIR
Exec=sh -c 'cd "$PROJECT_DIR" && exec $term -e sh -c "npm run knip; exec sh"'
Terminal=false
Icon=utilities-terminal
Categories=Development;
EOF
  chmod +x "$apps_dir/knip.desktop"
  ok "Created app launcher entry: $apps_dir/knip.desktop"
}

create_macos_app() {
  local apps_dir="$HOME/Applications"
  mkdir -p "$apps_dir"
  local cmd_file="$apps_dir/knip.command"
  cat > "$cmd_file" <<EOF
#!/usr/bin/env bash
cd "$PROJECT_DIR" || exit 1
exec npm run knip
EOF
  chmod +x "$cmd_file"
  ok "Created double-clickable launcher: $cmd_file"
}

log "Creating launcher shortcut"
case "$(uname -s)" in
  Linux) create_desktop_entry ;;
  Darwin) create_macos_app ;;
esac

log "Done."
ok "Run Knip with: npm run knip"
