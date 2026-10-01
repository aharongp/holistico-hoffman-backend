#!/usr/bin/env bash
# Prepared for review. Run as root on 68.183.142.98 only after owner approval.
# Usage: bash install-sftp-account.sh /path/to/dedicated-key.pub
# Requires hoffman-sftp.sshd.conf beside this script. Never copy the private key.
set -Eeuo pipefail
umask 077

storage_user=hoffman_files
storage_root=/var/www/html/sshh/public/assets
jail_root=/srv/hoffman-sftp
public_key=${1:?Provide the dedicated public key path}
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
config_block="$script_dir/hoffman-sftp.sshd.conf"
relative_paths=(historia images/foto_rostro images/foto_cuerpo_frente images/foto_cuerpo_perfil images/foto_espalda_entero images/foto_extra images/foto_ocular)
source_paths=()

[[ $(id -u) == 0 ]] || { printf 'Run as root.\n' >&2; exit 1; }
[[ -f "$public_key" && -f "$config_block" ]] || { printf 'Public key or configuration missing.\n' >&2; exit 1; }
[[ $(wc -l < "$public_key") == 1 ]] && grep -Eq '^ssh-ed25519 [A-Za-z0-9+/=]+( .*)?$' "$public_key"
ssh-keygen -l -f "$public_key" >/dev/null
for required in getfacl setfacl mount mountpoint useradd systemctl find stat; do
  command -v "$required" >/dev/null
done
! getent passwd "$storage_user" >/dev/null || { printf 'Account already exists; inspect it before continuing.\n' >&2; exit 1; }
! getent group "$storage_user" >/dev/null || { printf 'Group already exists; inspect it before continuing.\n' >&2; exit 1; }
[[ ! -e "$jail_root" && ! -e "/etc/ssh/authorized_keys/$storage_user" ]]
! grep -q 'HOFFMAN SFTP\|/srv/hoffman-sftp' /etc/ssh/sshd_config /etc/fstab
for ancestor in / /srv; do
  [[ $(stat -c %u "$ancestor") == 0 ]]
  mode=$(stat -c %a "$ancestor")
  (( (8#$mode & 0022) == 0 ))
done
for relative in "${relative_paths[@]}"; do
  source_path="$storage_root/$relative"
  [[ -d "$source_path" && ! -L "$source_path" ]]
  # Refuse existing links rather than expose an unexpected target in the jail.
  [[ -z $(find "$source_path" -xdev -type l -print -quit) ]]
  source_paths+=("$source_path")
done
/usr/sbin/sshd -t
systemctl is-active --quiet ssh

install -d -m 0700 /var/lib/hoffman-sftp
backup_dir=$(mktemp -d /var/lib/hoffman-sftp/install.XXXXXXXX)
cp -a /etc/ssh/sshd_config "$backup_dir/sshd_config.before"
cp -a /etc/fstab "$backup_dir/fstab.before"
getfacl -R -p -- "${source_paths[@]}" > "$backup_dir/storage.acl.before"
cat /etc/ssh/sshd_config > "$backup_dir/sshd_config.candidate"
printf '\n' >> "$backup_dir/sshd_config.candidate"
cat "$config_block" >> "$backup_dir/sshd_config.candidate"
/usr/sbin/sshd -t -f "$backup_dir/sshd_config.candidate"

# Keep the existing authenticated root connection open throughout installation.
trap 'printf "Installation stopped. Backup: %s. Inspect completed steps before retrying.\n" "$backup_dir" >&2' ERR
install -d -o root -g root -m 0755 "$jail_root" "$jail_root/assets" "$jail_root/assets/images"
useradd --system --user-group --no-create-home --home-dir /assets --shell /usr/sbin/nologin --password '*' "$storage_user"
install -d -o root -g root -m 0755 /etc/ssh/authorized_keys
{ printf 'restrict '; cat "$public_key"; } > "/etc/ssh/authorized_keys/$storage_user"
chown root:root "/etc/ssh/authorized_keys/$storage_user"
# Public key: readable for authentication, writable only by root.
chmod 0644 "/etc/ssh/authorized_keys/$storage_user"

# Preserve owners and existing ACL entries. Grant access only within selected trees.
setfacl -R -m "u:$storage_user:rwX" -- "${source_paths[@]}"
find "${source_paths[@]}" -xdev -type d -exec setfacl -m "d:u:$storage_user:rwx,d:u:www-data:rwx" -- {} +
printf '\n# BEGIN HOFFMAN SFTP\n' >> /etc/fstab
for relative in "${relative_paths[@]}"; do
  source_path="$storage_root/$relative"
  target_path="$jail_root/assets/$relative"
  install -d -o root -g root -m 0755 "$target_path"
  mount --bind "$source_path" "$target_path"
  mount -o remount,bind,nosuid,nodev,noexec "$target_path"
  printf '%s %s none bind,nosuid,nodev,noexec,nofail 0 0\n' "$source_path" "$target_path" >> /etc/fstab
done
printf '# END HOFFMAN SFTP\n' >> /etc/fstab

# Change only the new user's SSH rules; restore the previous file if validation fails.
cat "$backup_dir/sshd_config.candidate" > /etc/ssh/sshd_config
if ! /usr/sbin/sshd -t || ! systemctl reload ssh; then
  cp -a "$backup_dir/sshd_config.before" /etc/ssh/sshd_config
  /usr/sbin/sshd -t && systemctl reload ssh
  printf 'SSH configuration restored. Inspect the account, ACLs and mounts before retrying. Backup: %s\n' "$backup_dir" >&2
  exit 1
fi
systemctl daemon-reload
printf 'Account configured. Backup: %s\nSFTP root: /assets\n' "$backup_dir"
printf 'Next: test key authentication, confinement and a disposable file before deployment.\n'
