# Freemail - Layanan Email Sementara / Temporary Email Service

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/idinging/freemail)

Freemail adalah layanan email sementara open-source berbasis **Cloudflare Workers + D1 + R2**. Project ini mendukung penerimaan email, pengiriman email, penerusan email, manajemen pengguna, dan login mailbox secara terpisah.

Freemail is an open-source temporary email service built with **Cloudflare Workers + D1 + R2**. It supports email receiving, email sending, forwarding, user management, and standalone mailbox login.

**Versi saat ini / Current version: V5.2.0**  
Menggunakan `postal-mime` untuk meningkatkan proses parsing email dan memperbaiki beberapa masalah encoding pada klien tertentu.  
Uses `postal-mime` to improve email parsing and fix several client-side encoding issues.

> Catatan: layanan ini dapat membuat mailbox secara otomatis saat menerima email. Untuk fitur forwarding, alamat tujuan harus sudah diverifikasi di Cloudflare Email Addresses.
>
> Note: this service can automatically create a mailbox when receiving an email. For forwarding, the destination address must be verified in Cloudflare Email Addresses.

📖 **[One-click Deployment Guide](docs/yijianbushu.md)** | 🤖 **[GitHub Actions Deployment](docs/action-deployment.md)** | 📬 **[Resend Sending Setup](docs/resend.md)** | 📚 **[API Documentation](docs/api.md)**

---

## Bahasa Indonesia

### 📸 Preview Project

Demo URL: https://mailexhibit.dinging.top/

Demo account:

```txt
Username: guest
Password: guest
```

Halaman yang tersedia:

#### Beranda
![Beranda](./pic/light/shouye.png)

#### Semua Mailbox
![Semua Mailbox](./pic/light/suoyouyouxiang.png)

#### Manajemen Pengguna
![Manajemen Pengguna](./pic/light/yonghuguanli.png)

#### Login Mailbox Tunggal
![Login Mailbox Tunggal](./pic/dange邮箱登录.png)

#### [Preview Mode Terang](docs/zhanshi-light.md) | [Preview Mode Gelap](docs/zhanshi-dark.md)

### Fitur Utama

| Kategori | Fitur |
|---|---|
| 📧 **Manajemen Mailbox** | Generate email sementara secara acak, dukungan multi-domain, pin/favorit, riwayat, pencarian mailbox |
| 💌 **Fitur Email** | Terima email real-time, auto refresh, ekstraksi kode verifikasi, dukungan HTML/plain text, forwarding email |
| ✉️ **Pengiriman Email** | Integrasi Resend API, API key multi-domain, bulk sending, scheduled sending, riwayat pengiriman |
| 👥 **Manajemen Pengguna** | Model permission tiga level, alokasi user/mailbox, login mailbox tunggal, kontrol akses login |
| 🎨 **Frontend Modern** | Efek glassmorphism, desain responsif, mobile-friendly, tampilan list/card |
| ⚡ **Arsitektur** | Cloudflare Workers, D1 Database, R2 Storage, Email Routing |

> Fitur ubah password mandiri untuk user mailbox default-nya nonaktif. Jika ingin mengaktifkannya, buka komentar pada `mailbox.html` baris 77-80.

### Riwayat Versi

| Versi | Perubahan Utama |
|---|---|
| **V5.2.0** | Menambahkan `postal-mime` untuk parsing email yang lebih baik dan perbaikan encoding |
| **V5.1.0** | Normalisasi alias mailbox diperluas, mendukung separator `.`, `+`, dan `-` |
| **V5.0** | UI baru, ikon SVG, dark mode, optimasi statistik dan layout admin panel |
| **V3.0** | Model permission tiga level, admin user management, penyimpanan EML di R2 |
| **V2.0** | Integrasi Resend untuk pengiriman email dan fitur pin mailbox |
| **V1.0** | Generate mailbox, menerima email, ekstraksi kode verifikasi |

### Deployment

#### Quick Start

1. Klik tombol **Deploy to Cloudflare Workers** di bagian atas README.
2. Atur **Email Routing** di Cloudflare: Domain → Email Routing → Catch-all → hubungkan ke Worker.
3. Jika ingin mengaktifkan pengiriman email, ikuti dokumentasi **Resend Sending Setup**.

> Jika memakai deployment via Git integration, atur environment variables secara manual di Workers → Settings → Variables.

### Environment Variables

| Variable | Deskripsi | Wajib |
|---|---|---|
| TEMP_MAIL_DB | Binding D1 Database | Ya |
| MAIL_EML | Binding R2 Bucket | Ya |
| MAIL_DOMAIN | Domain email, bisa lebih dari satu dengan pemisah koma | Ya |
| ADMIN_PASSWORD | Password admin utama | Ya |
| ADMIN_NAME | Username admin utama, default `admin` | Tidak |
| JWT_TOKEN | Secret untuk JWT signing | Ya |
| RESEND_API_KEY | API key Resend untuk pengiriman email, mendukung konfigurasi multi-domain | Tidak |
| FORWARD_RULES | Aturan forwarding email | Tidak |

<details>
<summary><strong>Format RESEND_API_KEY</strong></summary>

```bash
# Single key, backward compatible
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"

# Key-value format, recommended
RESEND_API_KEY="domain1.com=re_key1,domain2.com=re_key2"

# JSON format
RESEND_API_KEY='{"domain1.com":"re_key1","domain2.com":"re_key2"}'
```

Sistem akan memilih API key berdasarkan domain pengirim.
</details>

<details>
<summary><strong>Format FORWARD_RULES</strong></summary>

Rule dicocokkan berdasarkan prefix. Karakter `*` digunakan sebagai fallback/default rule.

Penting: alamat tujuan forwarding harus diverifikasi di Cloudflare sebelum dapat digunakan.

1. Buka Cloudflare Dashboard → Domain → Email → Email Routing.
2. Masuk ke tab **Destination addresses**.
3. Klik **Add destination address**, lalu masukkan email tujuan forwarding.
4. Buka email tujuan, lalu klik link verifikasi dari Cloudflare.

![Verifikasi alamat tujuan forwarding](pic/resend/zhuanfa.png)

```bash
# Key-value format
FORWARD_RULES="vip=a@example.com,news=b@example.com,*=fallback@example.com"

# JSON format
FORWARD_RULES='[{"prefix":"vip","email":"a@example.com"},{"prefix":"*","email":"fallback@example.com"}]'

# Disable forwarding
FORWARD_RULES="" atau "disabled" atau "none"
```
</details>

### Troubleshooting

<details>
<summary><strong>Masalah umum</strong></summary>

1. **Email tidak masuk**: cek konfigurasi Email Routing, MX record, dan variable `MAIL_DOMAIN`.
2. **Database error**: pastikan binding D1 bernama `TEMP_MAIL_DB` dan `database_id` benar.
3. **Masalah login**: pastikan `ADMIN_PASSWORD` dan `JWT_TOKEN` sudah diatur, lalu bersihkan cache browser.
4. **Tampilan error**: cek path static assets dan error di browser console.
</details>

<details>
<summary><strong>Debugging</strong></summary>

```bash
# Local development
wrangler dev

# Realtime logs
wrangler tail

# Check database
wrangler d1 execute TEMP_MAIL_DB --command "SELECT * FROM mailboxes LIMIT 10"
```
</details>

### Catatan Penting

- **Cache static assets**: setelah update, jalankan Purge Everything di Cloudflare dan lakukan hard refresh di browser.
- **Biaya R2/D1**: Cloudflare memiliki free tier, tetapi tetap disarankan membersihkan email lama secara berkala.
- **Keamanan**: untuk production, wajib ubah default `ADMIN_PASSWORD` dan `JWT_TOKEN`.

### Auto Deployment

Project ini mendukung deployment otomatis ke Cloudflare Workers menggunakan GitHub Actions. Lihat panduan lengkap di [GitHub Actions Deployment](docs/action-deployment.md).

---

## English

### 📸 Project Preview

Demo URL: https://mailexhibit.dinging.top/

Demo account:

```txt
Username: guest
Password: guest
```

Available pages:

#### Home
![Home](./pic/light/shouye.png)

#### All Mailboxes
![All Mailboxes](./pic/light/suoyouyouxiang.png)

#### User Management
![User Management](./pic/light/yonghuguanli.png)

#### Single Mailbox Login
![Single Mailbox Login](./pic/dange邮箱登录.png)

#### [Light Mode Preview](docs/zhanshi-light.md) | [Dark Mode Preview](docs/zhanshi-dark.md)

### Key Features

| Category | Features |
|---|---|
| 📧 **Mailbox Management** | Random temporary mailbox generation, multi-domain support, pin/favorite, history, mailbox search |
| 💌 **Email Features** | Real-time receiving, auto refresh, verification code extraction, HTML/plain text support, email forwarding |
| ✉️ **Sending Support** | Resend API integration, multi-domain API keys, bulk sending, scheduled sending, sending history |
| 👥 **User Management** | Three-level permission model, user/mailbox assignment, standalone mailbox login, login access control |
| 🎨 **Modern Frontend** | Glassmorphism effect, responsive design, mobile-friendly layout, list/card views |
| ⚡ **Architecture** | Cloudflare Workers, D1 Database, R2 Storage, Email Routing |

> Self-service password change for mailbox users is disabled by default. To enable it, uncomment lines 77-80 in `mailbox.html`.

### Version History

| Version | Main Updates |
|---|---|
| **V5.2.0** | Added `postal-mime` for better email parsing and encoding fixes |
| **V5.1.0** | Extended mailbox alias normalization with `.`, `+`, and `-` separators |
| **V5.0** | New UI, SVG icons, dark mode, admin panel statistics and layout improvements |
| **V3.0** | Three-level permission model, user management backend, EML storage in R2 |
| **V2.0** | Resend sending integration and mailbox pinning |
| **V1.0** | Mailbox generation, email receiving, verification code extraction |

### Deployment

#### Quick Start

1. Click the **Deploy to Cloudflare Workers** button at the top of this README.
2. Configure **Email Routing** in Cloudflare: Domain → Email Routing → Catch-all → bind it to the Worker.
3. To enable email sending, follow the **Resend Sending Setup** documentation.

> When deploying through Git integration, manually configure environment variables in Workers → Settings → Variables.

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| TEMP_MAIL_DB | D1 Database binding | Yes |
| MAIL_EML | R2 Bucket binding | Yes |
| MAIL_DOMAIN | Email domain, multiple domains can be separated by commas | Yes |
| ADMIN_PASSWORD | Main administrator password | Yes |
| ADMIN_NAME | Main administrator username, default `admin` | No |
| JWT_TOKEN | Secret used for JWT signing | Yes |
| RESEND_API_KEY | Resend API key for sending emails, supports multi-domain configuration | No |
| FORWARD_RULES | Email forwarding rules | No |

<details>
<summary><strong>RESEND_API_KEY Format</strong></summary>

```bash
# Single key, backward compatible
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"

# Key-value format, recommended
RESEND_API_KEY="domain1.com=re_key1,domain2.com=re_key2"

# JSON format
RESEND_API_KEY='{"domain1.com":"re_key1","domain2.com":"re_key2"}'
```

The system automatically selects the API key based on the sender domain.
</details>

<details>
<summary><strong>FORWARD_RULES Format</strong></summary>

Rules are matched by prefix. The `*` character is used as the fallback/default rule.

Important: forwarding destination addresses must be verified in Cloudflare before they can be used.

1. Open Cloudflare Dashboard → Domain → Email → Email Routing.
2. Go to the **Destination addresses** tab.
3. Click **Add destination address**, then enter the forwarding destination email.
4. Open the destination inbox and confirm the verification email from Cloudflare.

![Forwarding destination verification](pic/resend/zhuanfa.png)

```bash
# Key-value format
FORWARD_RULES="vip=a@example.com,news=b@example.com,*=fallback@example.com"

# JSON format
FORWARD_RULES='[{"prefix":"vip","email":"a@example.com"},{"prefix":"*","email":"fallback@example.com"}]'

# Disable forwarding
FORWARD_RULES="" or "disabled" or "none"
```
</details>

### Troubleshooting

<details>
<summary><strong>Common issues</strong></summary>

1. **Emails are not received**: check Email Routing, MX records, and the `MAIL_DOMAIN` variable.
2. **Database connection error**: make sure the D1 binding is named `TEMP_MAIL_DB` and the `database_id` is correct.
3. **Login issue**: make sure `ADMIN_PASSWORD` and `JWT_TOKEN` are configured, then clear the browser cache.
4. **Frontend display issue**: check static asset paths and browser console errors.
</details>

<details>
<summary><strong>Debugging</strong></summary>

```bash
# Local development
wrangler dev

# Realtime logs
wrangler tail

# Check database
wrangler d1 execute TEMP_MAIL_DB --command "SELECT * FROM mailboxes LIMIT 10"
```
</details>

### Important Notes

- **Static asset cache**: after updating, run Purge Everything in Cloudflare and hard-refresh your browser.
- **R2/D1 cost**: Cloudflare has free tiers, but it is recommended to clean old emails regularly.
- **Security**: for production, always change the default `ADMIN_PASSWORD` and `JWT_TOKEN`.

### Auto Deployment

This project supports automatic deployment to Cloudflare Workers using GitHub Actions. See [GitHub Actions Deployment](docs/action-deployment.md) for the full guide.

---

## Credits

Thanks to [sarsanta](https://github.com/sarsanta) for contributing the GitHub Actions deployment workflow.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=idinging/freemail&type=Date)](https://www.star-history.com/#idinging/freemail&Date)

## License

Apache-2.0 license
