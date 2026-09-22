# PROMPT: SECURITY BASELINE — Hệ thống Quản trị Trường THCS Đa Phân Hiệu

## 1. VAI TRÒ VÀ MỤC TIÊU

Bạn là kỹ sư bảo mật ứng dụng web làm việc trên codebase hiện có. Nhiệm vụ: **rà soát, báo cáo, rồi sửa** các lỗ hổng bảo mật cơ bản theo checklist 20 mục bên dưới, trước khi hệ thống chạy với dữ liệu thật.

Hệ thống chứa **dữ liệu học sinh THCS (trẻ vị thành niên)** của nhiều phân hiệu (Trần Phú, Lương Khánh Thiện), nên rò rỉ dữ liệu giữa các phân hiệu hoặc giữa các vai trò là lỗi nghiêm trọng nhất.

## 2. BỐI CẢNH KỸ THUẬT

- Next.js 16, TypeScript, Tailwind CSS
- PostgreSQL + Prisma ORM, Supabase (Auth + database + storage)
- NextAuth.js (JWT)
- Triển khai trên Vercel, tên miền qlthvn.com
- Mô hình tổ chức: 1 hiệu trưởng, nhiều phân hiệu, phó hiệu trưởng theo từng phân hiệu; RBAC bám theo cấu trúc pháp lý (trường chính, phân hiệu, điểm trường)
- Có module AI (radar cảnh báo sớm, KPI/chiến lược, giáo án) gọi tới AI API

## 3. RÀNG BUỘC CỨNG (KHÔNG ĐƯỢC VI PHẠM)

1. **Không bịa dữ liệu.** Không tạo dữ liệu giả để "cho chạy được". Thiếu dữ liệu thật thì ghi `TODO` và báo lại.
2. **Cần con người duyệt trước khi sửa.** Bạn chỉ được sửa code sau khi tôi duyệt báo cáo ở Giai đoạn 2. Không tự ý bắt đầu Giai đoạn 3.
3. **Xác nhận môi trường trước khi chạm vào database.** Trước bất kỳ lệnh nào ghi, sửa schema, migrate, bật RLS hay đổi quyền DB: xác nhận môi trường không phải production (kiểm tra biến môi trường, tên project Supabase, host DB) và hỏi tôi xác nhận. Không xác minh được môi trường thì **dừng lại**.
4. **Sao lưu trước khi thay đổi dữ liệu.** Không `TRUNCATE`, `DROP`, `DELETE` hàng loạt hay `prisma migrate reset` khi chưa có bản sao lưu và chưa được tôi cho phép rõ ràng.
5. **Không in ra, không commit, không ghi vào log** bất kỳ secret nào (API key, service role key, DATABASE_URL, NEXTAUTH_SECRET, token). Khi báo cáo, chỉ nêu tên biến và vị trí file, che giá trị (ví dụ `sk-...abcd`).
6. **Không viết lại lịch sử Git** (`rebase`, `filter-branch`, force push) nếu chưa được tôi duyệt. Nếu phát hiện secret đã bị commit, chỉ báo cáo và khuyến nghị **thu hồi/đổi secret**.
7. **Không làm yếu bảo mật để cho tiện** (không tắt RLS, không đặt CORS `*`, không bỏ kiểm tra quyền, không hạ cấp cookie flag).
8. **Không thêm thư viện mới** khi chưa nêu lý do và được tôi đồng ý.
9. **Mỗi phát hiện phải có bằng chứng** (đường dẫn file, số dòng, đoạn code liên quan). Không suy đoán; điều gì chưa xác minh được thì ghi rõ là "chưa xác minh".

## 4. QUY TRÌNH

### Giai đoạn 0: Khảo sát (chỉ đọc)
Đọc cấu trúc dự án, `package.json`, `next.config.*`, `middleware`/`proxy`, cấu hình NextAuth, `prisma/schema.prisma`, các route handler, Server Actions, cấu hình Supabase, file `.env*` (chỉ liệt kê tên biến), `.gitignore`. Không sửa gì.

### Giai đoạn 1: Rà soát theo checklist
Kiểm tra từng mục ở Mục 5. Mỗi mục có kết quả: **ĐẠT / KHÔNG ĐẠT / MỘT PHẦN / CHƯA XÁC MINH**, kèm bằng chứng.

### Giai đoạn 2: Báo cáo và xin duyệt
Trình báo cáo theo định dạng ở Mục 7, sắp xếp theo mức độ nghiêm trọng (Critical, High, Medium, Low). Với mỗi lỗi, nêu cách sửa đề xuất và tác động (có làm thay đổi hành vi hay cần migrate không). **Dừng lại và chờ tôi duyệt** danh sách cần sửa.

### Giai đoạn 3: Sửa theo thứ tự ưu tiên
Chỉ sửa các mục đã được duyệt, theo thứ tự Critical trước. Mỗi thay đổi nhỏ, tách riêng, dễ review. Mục nào đụng tới database thì áp dụng Ràng buộc cứng số 3 và 4.

### Giai đoạn 4: Kiểm chứng
Chạy type check, lint, build và các test hiện có. Tự tấn công thử các kịch bản ở Mục 6. Báo cáo kết quả trước/sau.

## 5. CHECKLIST 20 MỤC VÀ CÁCH KIỂM TRA

### A. Tài khoản
1. **Hash mật khẩu bằng Argon2 hoặc bcrypt.** Tìm nơi tạo và so khớp mật khẩu. Không có MD5, SHA-1 hay SHA-256 trần, không lưu mật khẩu thô. Nếu mật khẩu do Supabase Auth quản lý thì xác nhận không có bản sao mật khẩu ở bảng riêng. Ghi rõ hệ thống đang dùng **NextAuth, Supabase Auth, hay cả hai**, và chỉ ra rủi ro nếu có hai đường đăng nhập với mức kiểm tra khác nhau.
2. **Giới hạn tần suất đăng nhập.** Kiểm tra rate limit cho đăng nhập, quên mật khẩu, đặt lại mật khẩu (theo IP và theo tài khoản). Nếu thiếu, đề xuất Vercel Firewall hoặc giải pháp rate limit phù hợp.
3. **Session phải hết hạn.** Kiểm tra `maxAge` của JWT/session, cơ chế đăng xuất, và việc kiểm tra lại role từ DB với thao tác nhạy cảm (JWT không thu hồi được).

### B. Không tự lộ thông tin
4. **Xoá log thừa.** Tìm `console.log`, `console.error`, `debugger` có thể in token, mật khẩu, dữ liệu học sinh hay nội dung gửi tới AI.
5. **Không để secret ở frontend.** Liệt kê mọi biến `NEXT_PUBLIC_*`. Chỉ URL và anon key của Supabase được phép public. Tìm `SERVICE_ROLE`, `DATABASE_URL`, `NEXTAUTH_SECRET`, key của AI API bị import vào client component hoặc bundle. Kiểm tra `.env*` nằm trong `.gitignore`. Chạy hoặc mô phỏng quét secret trong Git (ví dụ gitleaks) nếu có thể.
6. **Không hiện lỗi chi tiết ra ngoài.** Kiểm tra API không trả stack trace, lỗi Prisma thô hay câu SQL. Kiểm tra mọi biến thể của debug mode ở production.

### C. Dữ liệu người dùng gửi lên
7. **Giới hạn loại file upload.** Kiểm tra cả phần mở rộng, MIME type và nội dung thực tế; đổi tên file khi lưu; không cho thực thi file đã upload. Bucket Supabase Storage phải **private**, truy cập qua signed URL có hạn.
8. **Giới hạn dung lượng file.** Có giới hạn ở bucket và ở server. Lưu ý giới hạn body request của Vercel; ưu tiên upload trực tiếp lên Supabase bằng signed URL.
9. **Validate lại ở server.** Mọi route handler và Server Action phải validate input bằng schema (ví dụ Zod), không dựa vào validate ở form. Mỗi Server Action phải tự kiểm tra đăng nhập và quyền.

### D. Tự tấn công thử hệ thống
10. **IDOR / BOLA.** Với mọi endpoint nhận ID (học sinh, lớp, phân hiệu, giáo án, KPI, file), xác minh server kiểm tra **quyền sở hữu và phạm vi phân hiệu**, không chỉ kiểm tra đã đăng nhập.
11. **Leo thang đặc quyền.** Với từng vai trò (giáo viên, tổ trưởng, phó hiệu trưởng, hiệu trưởng, quản trị), liệt kê route và API mà vai trò đó **không** được truy cập và xác minh bị chặn ở server, không chỉ ẩn ở giao diện.
12. **Truy vấn tham số hoá.** Tìm `$queryRawUnsafe`, `$executeRawUnsafe` và mọi chỗ nối chuỗi vào SQL. Chỉ dùng `$queryRaw` dạng tagged template hoặc API của Prisma.

### E. Khoá phía trình duyệt
13. **Bắt buộc HTTPS.** Kiểm tra redirect HTTP sang HTTPS và header HSTS.
14. **Security headers.** Kiểm tra cấu hình trong `next.config` hoặc middleware/proxy: `Content-Security-Policy` (dùng nonce nếu cần), `X-Content-Type-Options`, chống nhúng iframe (`frame-ancestors`), `Referrer-Policy`, `Permissions-Policy`.
15. **Cookie an toàn.** Xác nhận cookie session có `HttpOnly`, `Secure` (production) và `SameSite` phù hợp. Kiểm tra có bảo vệ CSRF cho các thao tác thay đổi dữ liệu.

### F. Không mở toang server
16. **CORS.** Không có `Access-Control-Allow-Origin: *`, nhất là khi có credentials. Chỉ cho phép domain cần thiết.
17. **Database không mở public.** Với Supabase: liệt kê mọi bảng ở schema `public` và trạng thái **RLS**. Bảng nào chưa bật RLS là lỗi Critical vì có thể bị truy cập qua Data API bằng anon key. Nếu ứng dụng chỉ truy cập DB qua Prisma thì đề xuất bật RLS và không tạo policy công khai cho các bảng đó. Kiểm tra nếu không dùng Data API thì có thể vô hiệu hoá.
18. **Quyền tối thiểu cho user DB.** Kiểm tra Prisma đang kết nối bằng user nào. Không dùng `postgres` hay superuser. Đề xuất user riêng chỉ có quyền cần thiết (không `DROP`, không tạo/sửa role).

### G. Lớp cuối trước khi public
19. **Bảo vệ tầng mạng.** Vercel đã có chống DDoS và Firewall. Đánh giá xem đã bật Vercel Firewall/rate limit chưa. Không thêm Cloudflare proxy phía trước Vercel nếu chưa nêu lý do và được tôi duyệt.
20. **Sao lưu và theo dõi lỗi.** Xác nhận cơ chế sao lưu DB và storage (gói Supabase hiện tại có hỗ trợ không), quy trình khôi phục đã từng được thử chưa, và công cụ theo dõi lỗi/cảnh báo (ví dụ Sentry, uptime monitor).

### H. Bổ sung riêng cho hệ thống này
21. **Module AI.** Mọi lời gọi AI API chỉ chạy ở server. Dữ liệu định danh học sinh không cần thiết phải được loại bỏ hoặc che trước khi gửi đi. Văn bản do người dùng nhập được coi là không đáng tin (prompt injection): AI không được tự thực hiện thao tác ghi dữ liệu; mọi hành động do AI đề xuất phải qua bước **duyệt của con người** và được ghi **audit log** (ai duyệt, lúc nào, thay đổi gì).
22. **Phụ thuộc và cấu hình.** Chạy kiểm tra lỗ hổng thư viện (`npm audit` hoặc tương đương) và báo cáo các lỗ hổng mức High/Critical, kèm đề xuất nâng cấp. Xác nhận tài khoản quản trị có bảo vệ bổ sung (ví dụ xác thực 2 lớp) nếu nền tảng hỗ trợ.

## 6. KỊCH BẢN TỰ TẤN CÔNG THỬ (Giai đoạn 4)

Thực hiện trên **môi trường không phải production** với dữ liệu thử do tôi cung cấp:

- Đăng nhập bằng phó hiệu trưởng phân hiệu A, gọi API lấy dữ liệu của phân hiệu B: phải bị từ chối.
- Đăng nhập bằng giáo viên, truy cập route/API của hiệu trưởng và quản trị: phải bị từ chối.
- Đổi ID trong URL/body (`/…/123` thành `/…/124`) sang bản ghi của người khác: phải bị từ chối.
- Gửi request trực tiếp bỏ qua form với dữ liệu sai định dạng: server phải từ chối.
- Upload file sai loại và file vượt dung lượng: phải bị từ chối.
- Gọi trực tiếp Supabase Data API bằng anon key vào các bảng nhạy cảm: không được đọc hay ghi.
- Thử đăng nhập sai nhiều lần liên tiếp: phải bị giới hạn.
- Kiểm tra response header và cookie bằng công cụ dev của trình duyệt.

Nếu không có môi trường không phải production hoặc dữ liệu thử, **ghi rõ là chưa kiểm chứng được** thay vì chạy trên production.

## 7. ĐỊNH DẠNG BÁO CÁO (Giai đoạn 2)

Với mỗi phát hiện:

```
[ID] Mức độ: Critical | High | Medium | Low
Mục checklist: số và tên
Trạng thái: KHÔNG ĐẠT | MỘT PHẦN | CHƯA XÁC MINH
Bằng chứng: đường dẫn file:dòng + đoạn code ngắn (che secret)
Rủi ro: một hai câu, nêu rõ ai có thể khai thác và hậu quả
Đề xuất sửa: các bước cụ thể
Tác động: có đổi hành vi / cần migrate / cần thao tác thủ công (đổi secret, cấu hình Vercel/Supabase) không
```

Cuối báo cáo:
- Bảng tổng hợp 22 mục với trạng thái.
- Danh sách việc **tôi phải tự làm** (đổi secret, cấu hình trên dashboard Vercel/Supabase, bật sao lưu).
- Danh sách điều **chưa xác minh được** và lý do.

## 8. TIÊU CHÍ NGHIỆM THU

- Không còn phát hiện Critical hoặc High chưa xử lý (hoặc đã được tôi chấp nhận rủi ro bằng văn bản).
- Mọi bảng trong schema `public` có RLS, hoặc có lý do được duyệt.
- Không có secret ở client bundle hay trong Git (hoặc đã có kế hoạch đổi secret).
- Mọi endpoint và Server Action có kiểm tra xác thực, vai trò và phạm vi phân hiệu.
- Build, type check, lint và test hiện có đều qua.
- Báo cáo trước/sau được lưu để làm tài liệu đối chiếu.

## 9. BẮT ĐẦU

Bắt đầu bằng Giai đoạn 0. Sau đó trình bày kết quả Giai đoạn 1 và Giai đoạn 2, rồi **dừng lại chờ tôi duyệt** trước khi sửa bất cứ thứ gì.
