# CodeGraph Host — Setup Guide

> Hướng dẫn setup **MÁY ALWAYS-ON** (host machine) để chạy `codegraph index` định kỳ
> và expose DB snapshot qua HTTP cho team pull về.
>
> Đối tượng: 1 dev workstation Mac luôn bật, kết nối Tailscale (xem [`TAILSCALE_SETUP.md`](TAILSCALE_SETUP.md)).

## Tổng quan kiến trúc

```
[host] cron 30m → codegraph sync → snapshot DB.gz → HTTP :7474 (Tailscale IP)
                                                            ↓
[dev]                                       npm run code-graph:fetch (curl + atomic mv)
                                                            ↓
[dev] codegraph MCP local query db vừa pull (qua Claude Code)
```

Pattern: host = ingest worker. Dev = read replica. MCP vẫn local.

## Yêu cầu

- macOS với `launchctl`, `cron`/`crontab`, `python3` (built-in).
- `node` + `codegraph` CLI: `npm install -g @colbymchenry/codegraph`.
- Tailscale: xem [`TAILSCALE_SETUP.md`](TAILSCALE_SETUP.md) trước.
- Clone vault + submodules: `git clone <vault-repo> && git submodule update --init`.

## Bước 1 — Verify cron_sync chạy tay

```bash
cd ~/Documents/LLM/My_Project_Vault   # hoặc path vault của bạn
bash System/agent_skills/codegraph_host/cron_sync.sh
```

Expect output:
```
[2026-05-25T...] 🚀 cron_sync start — 2 project(s)
✅ angular-frontend: 0c33705a → 480K
✅ nestjs-backend: 06fac54b → 520K
[2026-05-25T...] 🏁 cron_sync done
```

Verify snapshot folder:
```bash
ls -la ~/codegraph-snapshots/angular-frontend/
# codegraph.db.gz  sha  synced_at
```

## Bước 2 — Cài HTTP server qua launchd

```bash
# Lấy Tailscale IP
TAILSCALE_IP=$(tailscale ip -4)
echo "Tailscale IP: $TAILSCALE_IP"

# Edit plist thay 2 placeholder
PLIST=System/agent_skills/codegraph_host/launchd_plist/com.vault.codegraph-server.plist
sed -e "s|REPLACE_WITH_TAILSCALE_IP|$TAILSCALE_IP|" \
    -e "s|REPLACE_WITH_HOME|$HOME|" \
    "$PLIST" > ~/Library/LaunchAgents/com.vault.codegraph-server.plist

# Load
launchctl load ~/Library/LaunchAgents/com.vault.codegraph-server.plist

# Verify đang chạy
launchctl list | grep codegraph
# → 12345  0  com.vault.codegraph-server

# Verify HTTP accessible
curl -fsS "http://$TAILSCALE_IP:7474/angular-frontend/sha"
# → <git-sha>
```

## Bước 3 — Cài crontab cho cron_sync

```bash
crontab -e
```

Thêm dòng (replace path):
```cron
*/30 * * * * /Users/<you>/Documents/LLM/My_Project_Vault/System/agent_skills/codegraph_host/cron_sync.sh >> /tmp/codegraph-sync.log 2>&1
```

Verify sau 30 phút:
```bash
tail -20 /tmp/codegraph-sync.log
ls -la ~/codegraph-snapshots/angular-frontend/synced_at
```

## Thông báo cho team

Sau khi setup xong, gửi team:
- Tailscale IP của host (vd `100.64.1.10`).
- Hoặc Magic DNS hostname (vd `dev-workstation-01.tail-xxxxx.ts.net`).
- Hướng dẫn dev: thêm vào `~/.zshrc`:
  ```bash
  export CODEGRAPH_HOST=100.64.1.10
  ```
  rồi gõ `npm --prefix System run code-graph:fetch`.

## Troubleshooting

**Cron không chạy:**
- Check `crontab -l` có dòng đúng không.
- Check log `/tmp/codegraph-sync.log` — nếu trống, có thể macOS chưa cấp Full Disk Access cho `cron` (System Settings → Privacy → Full Disk Access → thêm `/usr/sbin/cron`).
- Test bằng `bash cron_sync.sh` thủ công.

**HTTP server không listen:**
- `launchctl list | grep codegraph` → nếu exit code ≠ 0, check `/tmp/codegraph-server.err`.
- Verify `tailscale status` thấy node up.
- Verify port không bị chiếm: `lsof -i :7474`.
- Reload: `launchctl unload ... && launchctl load ...`.

**Snapshot stale (sha không update):**
- Cron có thể đang skip do local change trên submodule. Check log có dòng `⚠️  $proj: local changes detected`.
- Vào submodule dir: `cd 01_Raw/codebase/<proj> && git status` → commit hoặc stash local change.

**DB version mismatch trên dev:**
- Host và dev phải cùng major version `codegraph` (vd cả 2 đều 0.9.x).
- Check: `codegraph --version` trên cả 2 máy.
- Pin version qua npm: `npm install -g @colbymchenry/codegraph@0.9.4`.

## Stop / cleanup

```bash
launchctl unload ~/Library/LaunchAgents/com.vault.codegraph-server.plist
rm ~/Library/LaunchAgents/com.vault.codegraph-server.plist
crontab -e   # xoá dòng cron
rm -rf ~/codegraph-snapshots
```

## Liên kết

- [[../../../02_Wiki/05_Code_Graph/README|Code Graph wiki overview]]
- [[../../CLAUDE|System/CLAUDE.md]] §4.1 — CodeGraph workflow
- [`TAILSCALE_SETUP.md`](TAILSCALE_SETUP.md)
