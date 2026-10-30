#!/usr/bin/env bash
# One-time host preparation for claudeemulator device hosts.
# Tested target: Ubuntu 22.04 / 24.04 (x86_64 or arm64), dedicated server or
# a VPS that allows loading kernel modules (KVM; not OpenVZ/LXC).
#
#   sudo bash infra/scripts/setup-host.sh
set -euo pipefail

DEVICES_DIR="${DEVICES_DIR:-/data/devices}"
NET_NAME="${REDROID_NETWORK:-redroid-net}"
BRIDGE="br-redroid"
SUBNET="${REDROID_SUBNET:-172.31.0.0/16}"

[[ $EUID -eq 0 ]] || { echo "run as root"; exit 1; }
log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

log "Installing packages"
apt-get update -y
apt-get install -y ca-certificates curl ufw e2fsprogs iptables
apt-get install -y "linux-modules-extra-$(uname -r)" || \
  echo "WARN: linux-modules-extra not available for this kernel; binder_linux must be built-in or provided another way"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

log "Loading binder kernel module"
cat >/etc/modules-load.d/redroid.conf <<EOF
binder_linux
EOF
cat >/etc/modprobe.d/redroid.conf <<EOF
options binder_linux devices=binder,hwbinder,vndbinder
EOF
modprobe binder_linux devices="binder,hwbinder,vndbinder"
lsmod | grep -q binder_linux && echo "binder_linux loaded"

log "Kernel tuning"
cat >/etc/sysctl.d/90-redroid.conf <<EOF
fs.inotify.max_user_instances = 8192
fs.inotify.max_user_watches = 1048576
vm.max_map_count = 1048576
kernel.pid_max = 4194304
EOF
sysctl --system >/dev/null

log "Preparing ${DEVICES_DIR} as a shared mount (loop mounts must propagate to dockerd)"
mkdir -p "${DEVICES_DIR}"
cat >/etc/systemd/system/ce-devices-mount.service <<EOF
[Unit]
Description=claudeemulator: make ${DEVICES_DIR} an rshared bind mount
Before=docker.service
DefaultDependencies=no
After=local-fs.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/sh -c 'mountpoint -q ${DEVICES_DIR} || mount --bind ${DEVICES_DIR} ${DEVICES_DIR}; mount --make-rshared ${DEVICES_DIR}'

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now ce-devices-mount.service

log "Creating device network ${NET_NAME} (inter-container traffic disabled)"
if ! docker network inspect "${NET_NAME}" >/dev/null 2>&1; then
  docker network create \
    --driver bridge \
    --subnet "${SUBNET}" \
    -o "com.docker.network.bridge.name=${BRIDGE}" \
    -o "com.docker.network.bridge.enable_icc=false" \
    "${NET_NAME}"
fi

log "Installing device firewall (devices can't reach host services or private networks)"
cat >/usr/local/sbin/ce-firewall.sh <<'EOF'
#!/bin/sh
# Idempotent. Devices on br-redroid: internet only.
BR=br-redroid
add() { iptables -C "$@" 2>/dev/null || iptables -I "$@"; }
# Host services (agent, sshd, docker API...) unreachable from devices; replies to host-initiated adb allowed.
add INPUT -i $BR -j DROP
add INPUT -i $BR -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
# No access to private ranges / cloud metadata from devices.
for net in 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16 100.64.0.0/10 169.254.0.0/16; do
  add DOCKER-USER -i $BR -d $net -m conntrack ! --ctstate ESTABLISHED,RELATED -j DROP
done
# DNS must keep working even if the host's upstream resolver is on a private IP
# (inserted last = evaluated first).
add DOCKER-USER -i $BR -p udp --dport 53 -j RETURN
add DOCKER-USER -i $BR -p tcp --dport 53 -j RETURN
EOF
chmod +x /usr/local/sbin/ce-firewall.sh
cat >/etc/systemd/system/ce-firewall.service <<EOF
[Unit]
Description=claudeemulator device firewall
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/sbin/ce-firewall.sh

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now ce-firewall.service

log "Configuring UFW: only 22, 80 (ACME), 443 inbound"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

log "Pulling redroid image"
docker pull "${REDROID_IMAGE:-redroid/redroid:13.0.0-latest}"

cat <<EOF

Done. Next:
  1. Insert this host into Supabase:  insert into hosts (name, region, public_url, capacity) values (...);
  2. cd infra/host && cp .env.example .env   (fill HOST_ID, secrets, Supabase keys, HOST_DOMAIN)
  3. Point DNS A record \${HOST_DOMAIN} -> this server
  4. docker compose up -d --build
EOF
