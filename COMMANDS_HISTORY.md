# LỊCH SỬ CÁC CÂU LỆNH ĐÃ THỰC THI (COMMAND HISTORY)

Tài liệu lưu trữ toàn bộ các câu lệnh đã thực thi trong quá trình nâng cấp, bảo trì và tích hợp hệ thống Quản lý Trường học (School Management).

---

## 1. 🌐 CẤU HÌNH & BẬT TUNNEL NGROK CHO OMNIROUTE (MÁY LOCAL)

```powershell
# 1.1 Kiểm tra sự tồn tại của ứng dụng ngrok trên máy
Get-Command ngrok -ErrorAction SilentlyContinue

# 1.2 Bật ngrok chuyển tiếp cổng 20128 của OmniRoute ra URL công khai (Chạy ẩn)
Start-Process -FilePath "ngrok" -ArgumentList "http 127.0.0.1:20128" -WindowStyle Hidden

# 1.3 Lấy URL công khai thời gian thực đang chạy của ngrok từ API 4040
(Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels").tunnels.public_url
# Kết quả thu được: https://epicedial-fixtureless-imogene.ngrok-free.dev
```

---

## 2. 🗄️ CẤU HÌNH CƠ SỞ DỮ LIỆU & PRISMA ORM

```powershell
# 2.1 Cập nhật Prisma Schema & Tạo client mới
npx prisma generate

# 2.2 Đẩy bảng mới (SystemSetting) lên CSDL PostgreSQL (Neon DB)
npx prisma db push --skip-generate

# 2.3 Cập nhật trực tiếp bản ghi cấu hình OmniRoute trong CSDL Neon qua npx tsx
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.systemSetting.upsert({
    where: { key: 'OMNIROUTE_API_BASE' },
    update: { value: 'https://epicedial-fixtureless-imogene.ngrok-free.dev/v1' },
    create: { key: 'OMNIROUTE_API_BASE', value: 'https://epicedial-fixtureless-imogene.ngrok-free.dev/v1' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'OMNIROUTE_API_KEY' },
    update: { value: 'CHANGEME' },
    create: { key: 'OMNIROUTE_API_KEY', value: 'CHANGEME' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'OMNIROUTE_MODEL' },
    update: { value: 'antigravity/gemini-2.5-flash-lite' },
    create: { key: 'OMNIROUTE_MODEL', value: 'antigravity/gemini-2.5-flash-lite' }
  });
}
main();
"
```

---

## 3. 🧪 KIỂM TRẢ KẾT NỐI API OMNIROUTE (POWERSELL REST METHOD)

```powershell
# 3.1 Kiểm tra danh sách Mô hình AI (Models) qua Tunnel Ngrok
Invoke-RestMethod -Uri "https://epicedial-fixtureless-imogene.ngrok-free.dev/v1/models" `
  -Headers @{ 
    "Authorization" = "Bearer CHANGEME"; 
    "ngrok-skip-browser-warning" = "true" 
  } -Method Get

# 3.2 Gửi yêu cầu sinh văn bản Chat Completion thực tế (non-stream)
$body = @{
  model = "antigravity/gemini-2.5-flash-lite"
  stream = $false
  messages = @(
    @{ role = "user"; content = "Xin chào, hãy trả lời 'Tất cả AI hoạt động tốt!'." }
  )
} | ConvertTo-Json -Depth 5

$res = Invoke-RestMethod -Uri "https://epicedial-fixtureless-imogene.ngrok-free.dev/v1/chat/completions" `
  -Headers @{
    "Authorization" = "Bearer CHANGEME"
    "Content-Type" = "application/json"
    "ngrok-skip-browser-warning" = "true"
  } -Method Post -Body $body

$res.choices[0].message.content
```

---

## 4. 📦 CÁC LỆNH GIT CONTROL (STAGING, COMMIT & PUSH VERCEL)

### Giai đoạn 1: Trung Tâm Phê Duyệt & Từ Chối (`/admin/approvals`)
```bash
git add src/app/admin/approvals/actions.ts src/app/admin/approvals/page.tsx src/app/admin/layout.tsx src/app/vice-principal/layout.tsx
git commit -m "feat: add unified Approval & Rejection Center (/admin/approvals) with dual approve/reject buttons and rejection reason modal"
git push origin main

# Fix lỗi TypeScript union type trên trang Approvals
git add src/app/admin/approvals/page.tsx
git commit -m "fix: resolve TypeScript type narrowing for driveFileUrl in Approvals page"
git push origin main
```

### Giai đoạn 2: Tích hợp OmniRoute AI Provider Dùng Chung & Trang Cấu Hình AI (`/admin/ai-config`)
```bash
# 2.1 Tích hợp Provider cho toàn bộ các module AI
git add src/lib/ai-provider.ts src/app/admin/principal-ai/actions.ts src/app/admin/substitute-dispatch/actions.ts src/app/admin/daily-summary/actions.ts src/app/teacher/daily-report/actions.ts src/app/teacher/homeroom/actions.ts
git commit -m "feat: integrate universal OmniRoute AI provider across all AI decision, substitute dispatch, daily report, and homeroom modules"
git push origin main

# 2.2 Xây dựng trang Cấu hình Web GUI AI
git add prisma/schema.prisma src/lib/ai-provider.ts src/app/admin/ai-config/actions.ts src/app/admin/ai-config/page.tsx src/app/admin/layout.tsx src/app/vice-principal/layout.tsx
git commit -m "feat: add Web GUI OmniRoute AI Configuration page (/admin/ai-config) with live connection testing and DB persistence"
git push origin main

# 2.3 Sửa khối ngoặc thừa trong action handlers
git add src/app/admin/daily-summary/actions.ts src/app/admin/principal-ai/actions.ts src/app/teacher/homeroom/actions.ts
git commit -m "fix: cleanup orphan try-catch blocks in daily-summary and principal-ai action handlers for 0-error Vercel build"
git push origin main

# 2.4 Đặt tham số cấu hình ngrok mặc định & bypass header
git add src/lib/ai-provider.ts src/app/admin/ai-config/page.tsx
git commit -m "feat: configure OmniRoute API defaults in code with custom key and model (antigravity/gemini-2.5-flash-lite)"
git commit -m "fix: resolve TypeScript type error for testResult in AI config page"
git commit -m "fix: import missing Bot icon in VicePrincipal layout"
git commit -m "fix: add detailed error detection and ngrok/localtunnel guidance when connecting local OmniRoute (127.0.0.1) from Vercel Cloud"
git commit -m "feat: add bypass-tunnel-reminder header and custom User-Agent to bypass localtunnel anti-phishing warning screen"
git commit -m "feat: set live localtunnel URL (https://spotty-donkeys-smile.loca.lt/v1) and OmniRoute key as default"
git commit -m "feat: switch default tunnel to active ngrok URL (https://epicedial-fixtureless-imogene.ngrok-free.dev/v1) with bypass headers"
git commit -m "fix: pass stream: false in aiChatCompletion request body for clean JSON response from OmniRoute"
git commit -m "feat: update default OmniRoute API key/password to CHANGEME"
git push origin main
```

### Giai đoạn 3: Tích hợp Dữ liệu Điểm danh Real-Time CSDL & Tối ưu Phản hồi AI
```bash
# 3.1 Nâng cấp câu truy vấn CSDL điểm danh thời gian thực cho Principal AI
git add src/app/admin/principal-ai/actions.ts
git commit -m "feat: integrate real-time daily attendance database context (present, absent, late counts) into Principal AI decision engine"
git push origin main

# 3.2 Tối ưu prompt trả lời đúng trọng tâm và sạch nhãn định dạng
git add src/app/admin/principal-ai/page.tsx src/app/admin/principal-ai/actions.ts
git commit -m "fix: render full real AI text output and conditionally show option cards only when strategic decisions are requested"
git commit -m "fix: clean prompt structure to return direct laser-focused markdown AI answers without raw template tags"
git commit -m "fix: resolve TypeScript type for null recommendation in Principal AI page"
git push origin main
```

---

## 5. 🔍 KIỂM TRA TRẠNG THÁI WORKING TREE
```bash
git status
git log -n 5 --oneline
```
