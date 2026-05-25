# Tailscale Setup cho team

> Tailscale = WireGuard-based mesh VPN. Free tier đủ cho team <20 user, 100 device.
> Mục đích: máy host (chạy `codegraph` snapshot HTTP server) và máy dev kết nối qua
> mạng riêng, không expose public internet.

## Bước 1 — Tạo Tailnet (1 lần / org)

1. Vào https://login.tailscale.com → Sign in (Google/Microsoft/GitHub SSO).
2. Sau khi login, bạn đã có 1 tailnet personal. Tên tailnet hiển thị bên trên-trái.
3. (Optional) Invite team: **Users** → **Invite users** → email teammate. Họ accept qua link.

> Lưu ý: account dùng để sign in (vd nhatnv2@vnext.vn) sẽ là owner. Mọi dev khác sign in cùng tailnet để có access.

## Bước 2 — Install Tailscale trên máy HOST

```bash
# macOS
brew install --cask tailscale

# Mở app, click "Log in", chọn cùng account tailnet đã tạo
# Hoặc CLI:
sudo tailscale up
```

Sau khi login:
```bash
tailscale ip -4
# → 100.x.y.z  (đây là Tailscale IP của host, ghi lại)

tailscale status
# → 100.x.y.z  hostname  user  macOS  -
```

(Optional) Set hostname đẹp:
```bash
sudo tailscale up --hostname=codegraph-host
```

## Bước 3 — Install Tailscale trên mỗi máy DEV

Mỗi dev:
1. Cài Tailscale (same command as above).
2. Sign in vào cùng tailnet (chấp nhận invite nếu được gửi).
3. Verify kết nối được tới host:
   ```bash
   ping 100.x.y.z              # IP của host
   # hoặc nếu set hostname:
   ping codegraph-host
   ```

## Bước 4 — (Optional) ACL lock port 7474

Mặc định Tailscale cho phép mọi device trong tailnet kết nối tất cả ports. Để chỉ
allow port 7474 cho codegraph (defense in depth):

1. Vào https://login.tailscale.com → **Access controls**.
2. Edit ACL JSON, thêm:
   ```json
   {
     "acls": [
       {
         "action": "accept",
         "src": ["group:team"],
         "dst": ["tag:codegraph-host:7474"]
       }
     ],
     "tagOwners": {
       "tag:codegraph-host": ["autogroup:admin"]
     },
     "groups": {
       "group:team": ["nhatnv2@vnext.vn", "teammate@vnext.vn"]
     }
   }
   ```
3. Trên máy host: `sudo tailscale up --advertise-tags=tag:codegraph-host`.

Bỏ qua bước này nếu tailnet chỉ có internal team trust nhau.

## Magic DNS (recommend)

Magic DNS cho phép gọi máy bằng hostname (vd `http://codegraph-host:7474`) thay vì IP.

1. https://login.tailscale.com → **DNS** → Enable **MagicDNS**.
2. Mỗi máy dev refresh: `sudo tailscale down && sudo tailscale up`.
3. Test: `ping codegraph-host`.

## Troubleshooting

- **`ping` không thông:** Check `tailscale status` cả 2 máy có hiện node của nhau không. Nếu không, sign-out + sign-in lại.
- **MacOS firewall block:** System Settings → Network → Firewall → Allow Tailscale.
- **Magic DNS không work:** Verify ở https://login.tailscale.com → **DNS** đã bật. Restart Tailscale.

## Cost

- Free tier: 100 device, 3 user, 1 admin → đủ cho team <3 dev + nhiều personal device.
- Khi vượt → $5/user/month (Personal Pro), hoặc dùng [Headscale](https://github.com/juanfont/headscale) self-host miễn phí.

## Liên kết

- [`README.md`](README.md) — Setup `cron_sync` + HTTP server (dùng Tailscale IP từ bước 2)
- https://tailscale.com/kb/ — Official docs
