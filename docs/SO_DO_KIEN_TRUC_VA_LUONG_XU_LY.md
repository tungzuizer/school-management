# SƠ ĐỒ KIẾN TRÚC HỆ THỐNG VÀ LUỒNG XỬ LÝ DỮ LIỆU CHÍNH (`SCHOOL-MANAGEMENT`)

---

## I. SƠ ĐỒ KIẾN TRÚC HỆ THỐNG TỔNG THỂ (SYSTEM ARCHITECTURE)

Hệ thống Quản lý Nhà trường Thông minh đa điểm trường được thiết kế theo mô hình **Kiến trúc Phân tầng Hiện đại (Modern Layered Architecture)** với nguyên tắc phân định trách nhiệm rõ ràng (Separation of Concerns), an toàn dữ liệu đa trường (Multi-tenant Scoping) và tích hợp các động cơ trí tuệ nhân tạo (AI Engines) theo thời gian thực.

```mermaid
graph TB
    subgraph UI_LAYER["1. TẦNG TRÌNH DIỄN (PRESENTATION LAYER - Next.js 16 + React 19 + TailwindCSS 4)"]
        direction TB
        R1["👑 Ban Giám hiệu (Admin / Principal)"]
        R2["👨🏫 Phó Hiệu trưởng / Tổ trưởng (VP / Subject Head)"]
        R3["👩🏫 Giáo viên Bộ môn & Chủ nhiệm (Teacher)"]
        R4["👨🎓 Học sinh & Phụ huynh (Student / Parent)"]
        R5["🏛️ Cán bộ Phòng GD&ĐT / Xã (Department / Ward)"]
        WIDGET["🤖 Trợ lý AI Nổi (Floating AI Chat Widget) & Dashboards"]
    end

    subgraph SECURITY_LAYER["2. TẦNG BẢO MẬT & ĐIỀU HƯỚNG (SECURITY & BUSINESS GATEWAY)"]
        direction TB
        AUTH["NextAuth v4 (Session & RBAC Middleware)"]
        TENANT["Tenant Scoping Engine (Multi-School & Multi-Campus Isolation)"]
        INTEGRITY_MW["AI Data Integrity & Rule 0 Enforcement"]
    end

    subgraph ENGINE_LAYER["3. TẦNG ĐỘNG CƠ TRÍ TUỆ NHÂN TẠO & XỬ LÝ (AI & INTELLIGENCE ENGINES)"]
        direction TB
        LLM_GW["🤖 OmniRoute Gateway / Gemini 1.5 Flash / 2.5 Flash Lite"]
        GROUNDING["🛡️ Server-Side Grounding Verification Engine"]
        OLS_ENGINE["📈 OLS Linear Regression & RMS Volatility Engine"]
        CSP_ENGINE["📅 Heuristic Constraint Timetable Solver"]
        EXAM_ENGINE["📊 Exam Analytics & Standard Deviation Engine"]
        EVAL_ENGINE["📋 NQ37 Compliance & TT15 Evaluation Engine"]
    end

    subgraph DATA_LAYER["4. TẦNG DỮ LIỆU & LƯU TRỮ ĐÁM MÂY (PERSISTENCE & STORAGE)"]
        direction TB
        PRISMA["Prisma ORM (Schema & Query Optimization)"]
        DB[(Cơ sở dữ liệu Quan hệ PostgreSQL)]
        STORAGE["Lưu trữ Đám mây (Supabase Storage / Cloudflare R2 / S3)"]
    end

    %% Flow connections
    UI_LAYER --> SECURITY_LAYER
    SECURITY_LAYER --> ENGINE_LAYER
    SECURITY_LAYER --> PRISMA
    ENGINE_LAYER --> PRISMA
    PRISMA --> DB
    SECURITY_LAYER --> STORAGE
```

---

## II. BẢNG MA TRẬN LUỒNG XỬ LÝ DỮ LIỆU CỐT LÕI
### `[Dữ liệu đầu vào] → [Xử lý dữ liệu] → [AI xử lý/phân tích] → [Chức năng sản phẩm] → [Kết quả đầu ra]`

| STT | Luồng nghiệp vụ | Dữ liệu đầu vào (Input) | Xử lý dữ liệu (Preprocessing) | AI/Thuật toán phân tích (AI & Analytics Core) | Chức năng sản phẩm (Feature) | Kết quả đầu ra (Output) |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Phân tích Hành trình & Cảnh báo Sớm Học sinh** | • Điểm số theo các kỳ đánh giá ($x_i, y_i$).<br>• Dữ liệu chuyên cần & nghỉ học.<br>• Nhật ký can thiệp học sinh. | • Lọc điểm hợp lệ ($0.0 \le \text{score} \le 10.0$).<br>• Sắp xếp theo trục thời gian.<br>• Kiểm tra điều kiện tối thiểu ($n \ge 3$ kỳ). | **Mô hình Hồi quy Tuyến tính OLS & Độ biến động RMS Thặng dư**:<br>$\text{Slope } a$, $\text{Intercept } b$, $R^2$, $\text{RMS Volatility}$. | **Module Hành trình Học sinh & Cảnh báo Sớm (Student Journey & Early Warning)** | • Nhãn xu hướng: *IMPROVING / DECLINING / VOLATILE / STABLE*.<br>• Điểm cơ sở (Baseline) & Độ lệch ($\Delta$).<br>• Cảnh báo đỏ tự động gửi tới GVCN/BGH. |
| **2** | **Trợ lý AI Điều hành & Tham vấn Chống Ảo giác** | • Câu hỏi/Yêu cầu của BGH/Giáo viên.<br>• Snapshot dữ liệu trường học real-time (sĩ số, điểm trường, cơ sở vật chất, NQ37). | • Tiêm hệ thống nhắc **AI Data Integrity Policy (Rule 0)**.<br>• Chuẩn hóa ngữ cảnh trường học đa điểm trường (Tenant Context). | **Google Gemini LLM** kết hợp **Server-Side Grounding Verification Engine**:<br>Bóc tách `record_id` và đối chiếu thực tế với CSDL. | **Trợ lý AI Ban Giám hiệu & Chat Sư phạm Thông minh (Principal AI & Floating Chat)** | • Kịch bản chỉ đạo 2 phương án kèm điểm số ưu/nhược điểm & căn cứ pháp lý.<br>• Thẻ phản hồi Grounded Response Card minh bạch nguồn gốc dữ liệu. |
| **3** | **Xếp Thời khóa biểu Tự động Đa điểm trường** | • Danh sách lớp, giáo viên, môn học.<br>• Định mức tiết/tuần theo phân phối chương trình.<br>• Danh mục phòng học chuyên dụng, khoảng cách điểm trường. | • Khởi tạo ma trận lịch trống (Timetable Matrix).<br>• Ràng buộc cứng: GV không trùng tiết, phòng không quá tải.<br>• Ràng buộc mềm: Tránh tiết trống lẻ, phân bổ đều buổi. | **Heuristic Constraint Satisfaction Problem (CSP) Solver**:<br>Thuật toán tìm kiếm heuristic kết hợp quay lui thông minh (Backtracking). | **Module Xếp TKB Tự động & Quản lý Phân công (Smart Timetable Scheduler)** | • Lưới Thời khóa biểu toàn trường chuẩn xác 100% không xung đột.<br>• Báo cáo tải trọng công tác giáo viên & lịch luân chuyển điểm trường. |
| **4** | **Phân tích Phổ điểm & Đánh giá Chất lượng Đề thi** | • Bảng điểm chi tiết bài thi các lớp/khối.<br>• Ma trận đề thi & độ khó câu hỏi.<br>• Dữ liệu điểm danh phòng thi. | • Loại trừ dữ liệu vắng thi/bỏ thi.<br>• Chuẩn hóa thang điểm 10.<br>• Nhóm theo khối/lớp/môn. | **Exam Analytics Engine**:<br>Tính toán phân phối tần số (Histogram), Độ lệch chuẩn ($\sigma$), Phương sai, Độ phân hóa (Discrimination Index). | **Module Phân tích Kỳ thi & Chất lượng Giảng dạy (Exam Analytics Dashboard)** | • Biểu đồ phổ điểm trực quan (Normal Distribution vs. Skewed).<br>• Đánh giá mức độ phân hóa học lực học sinh & khuyến nghị điều chỉnh đề thi. |

---

## III. SƠ ĐỒ CHI TIẾT CÁC LUỒNG XỬ LÝ CHÍNH (DETAILED PROCESS FLOWS)

### 1. Luồng Phân tích Hành trình Học sinh (Student Journey & Early Warning Flow)

```mermaid
sequenceDiagram
    autonumber
    actor T as Giáo viên / Hệ thống
    participant DB as CSDL Điểm số & Chuyên cần
    participant PRE as Bộ Chuẩn hóa Dữ liệu (Journey Pipeline)
    participant OLS as Động cơ OLS & RMS Volatility
    participant UI as Dashboard Cảnh báo Sớm

    T->>DB: Ghi nhận điểm số định kỳ / import Excel
    DB->>PRE: Nạp chuỗi điểm theo thời gian (x_i, y_i)
    PRE->>PRE: Validate thang điểm, lọc dữ liệu rỗng
    alt Số kỳ n < 3
        PRE->>UI: Gắn nhãn INSUFFICIENT_DATA (Chưa đủ kỳ đánh giá)
    else Số kỳ n >= 3
        PRE->>OLS: Truyền danh sách điểm hợp lệ
        OLS->>OLS: Tính Hệ số góc (Slope), Intercept, R²
        OLS->>OLS: Tính Độ biến động thặng dư (RMS Volatility)
        OLS->>OLS: Phân loại: IMPROVING / DECLINING / VOLATILE / STABLE
        OLS->>UI: Trả về kết quả phân tích & Danh sách học sinh nguy cơ
    end
```

---

### 2. Luồng Trợ lý AI Điều hành & Kiểm chứng Toàn vẹn Dữ liệu (AI Grounding Flow)

```mermaid
sequenceDiagram
    autonumber
    actor P as Ban Giám hiệu
    participant GW as Next.js Server Action
    participant POL as AI Data Integrity Policy (Rule 0)
    participant LLM as Google Gemini API / OmniRoute
    participant GVE as Grounding Verification Engine
    participant DB as PostgreSQL Database
    participant UI as Grounded Response Card

    P->>GW: Gửi câu hỏi / Yêu cầu chỉ đạo điều hành
    GW->>POL: Đóng gói Context trường học + Tiêm Rule 0 (Cấm bịa đặt)
    POL->>LLM: Gửi Prompt có cấu trúc Fact - Inference
    LLM->>GVE: Trả về văn bản kèm trích dẫn [id=record_id]
    GVE->>GVE: Bóc tách toàn bộ Record IDs trong câu trả lời
    GVE->>DB: Truy vấn kiểm tra sự tồn tại trong phạm vi SchoolId/CampusId
    DB-->>GVE: Kết quả xác thực (Verified / Unverified)
    alt Có Record ID bịa đặt hoặc sai phân quyền
        GVE->>UI: Cảnh báo REJECTED_HALLUCINATION (Chặn dữ liệu giả)
    else Tất cả Record ID hợp lệ
        GVE->>UI: Hiển thị Thẻ phản hồi Grounded đầy đủ Dữ kiện & Suy luận
    end
```

---

### 3. Luồng Xếp Thời khóa biểu Thông minh (Smart Timetable Solver Flow)

```mermaid
flowchart TD
    A[Bắt đầu: Nhập kế hoạch giáo dục & Phân công chuyên môn] --> B[Nạp danh sách Lớp, Giáo viên, Môn học, Phòng học]
    B --> C[Thiết lập Ma trận Tiết trống: 5 ngày x 2 buổi x 4-5 tiết]
    C --> D[Thiết lập Ràng buộc Cứng: Không trùng GV, không trùng Phòng]
    D --> E[Thiết lập Ràng buộc Mềm: Cân đối số tiết, tránh tiết trống lẻ]
    E --> F[Heuristic CSP Solver: Phân bổ tiết ưu tiên môn chính & phòng đặc thù]
    F --> G{Có phát sinh xung đột?}
    G -- Có --> H[Quay lui Backtracking & Hoán vị vị trí tiết]
    H --> F
    G -- Không --> I[Tối ưu hóa phân bố tải trọng tuần của giáo viên]
    I --> J[Xuất Thời khóa biểu hoàn chỉnh & Lịch di chuyển điểm trường]
```

---

## IV. TỔNG KẾT VÀ GIÁ TRỊ VẬN HÀNH

1. **Tính Tự động hóa & Khép kín**: Toàn bộ chuỗi từ nhập liệu thô, chuẩn hóa, phân tích thông minh đến hiển thị cảnh báo đều diễn ra tự động với độ trễ dưới 2 giây.
2. **Minh bạch & An toàn Tuyệt đối**: Không phụ thuộc hoàn toàn vào "hộp đen" AI; mọi nhận định của LLM đều được kiểm chứng chéo với CSDL thực tế; các quyết định cảnh báo điểm số đều dựa trên nền tảng toán học OLS tường minh.
3. **Thích ứng Đặc thù Giáo dục Việt Nam**: Hỗ trợ toàn diện mô hình trường liên cấp, trường nhiều điểm trường xa, đáp ứng đầy đủ Thông tư 15/2020/TT-BGDĐT và Nghị quyết 37/2025/NQ-HĐND.
