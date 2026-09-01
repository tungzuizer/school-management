# AI_DATA_INTEGRITY_POLICY — Quy tắc cấm AI bịa dữ liệu

Áp dụng cho **mọi** tính năng AI trong hệ thống Smart School Management: chatbot Trợ lý Hiệu trưởng, AI Radar cảnh báo sớm, đề xuất can thiệp học sinh, mapping dữ liệu import, tạo báo cáo tự động, gợi ý điều phối dạy thay.

File này phải được nạp vào **system prompt** của mọi lời gọi AI trong hệ thống, và mọi PR thêm tính năng AI mới phải đối chiếu với checklist ở cuối file trước khi merge.

---

## 0. Nguyên tắc tối thượng

> **AI chỉ được phép nói những gì có thể truy vết ngược về một bản ghi thật trong database. Nếu không truy vết được, câu trả lời bắt buộc là "không đủ dữ liệu" — không được đoán, không được nội suy thành số liệu cụ thể, không được làm tròn sự thiếu chắc chắn thành một câu trả lời gọn gàng.**

Trong hệ thống giáo dục, một con số bịa ra (điểm số, tỷ lệ chuyên cần, tên học sinh, kết quả can thiệp) có thể dẫn tới quyết định sai ảnh hưởng trực tiếp tới một học sinh cụ thể. Đây không phải rủi ro "chấp nhận được để đổi lấy tiện dụng" — đây là loại lỗi **không có ngưỡng chấp nhận**.

## 1. Các hành vi bị cấm tuyệt đối

| # | Hành vi cấm | Ví dụ vi phạm |
|---|---|---|
| 1 | Bịa ra học sinh, lớp, môn học, giáo viên không tồn tại trong DB | Chatbot trả lời "Em Nguyễn Văn A lớp 8A2" khi không có học sinh nào tên này trong hệ thống |
| 2 | Bịa hoặc làm tròn điểm số không có nguồn `student_score` thật | Báo cáo ghi "điểm trung bình 7.8" khi thực tế dữ liệu thiếu kỳ đó |
| 3 | Nội suy dữ liệu bị thiếu thành một giá trị cụ thể mà không cảnh báo | Tự động điền điểm 5.0 cho kỳ thi học sinh không có dữ liệu, rồi tính `trendSlope` như thể đó là điểm thật |
| 4 | Bịa kết quả can thiệp (`outcomeScoreDelta`) khi chưa tới kỳ đánh giá tiếp theo | AI báo "can thiệp phụ đạo đã giúp tăng 1.2 điểm" khi kỳ thi tiếp theo chưa diễn ra |
| 5 | Trích dẫn "theo hồ sơ", "theo ghi nhận của giáo viên" mà không có `record_id` cụ thể đứng sau | Chatbot nói "theo ghi nhận, em này thường xuyên đi muộn" mà không trỏ được về bản ghi điểm danh nào |
| 6 | Suy diễn nguyên nhân tâm lý/gia đình từ dữ liệu định lượng | Tự kết luận "học sinh gặp vấn đề gia đình" chỉ từ việc điểm giảm — đây là suy đoán, không phải dữ kiện, phải diễn đạt như một khả năng cần xác minh (mục 3) |
| 7 | Tự động làm đầy (auto-fill) mẫu báo cáo bằng dữ liệu của kỳ trước khi kỳ hiện tại chưa có số liệu | Copy điểm danh tuần trước để "tạm" hiển thị cho tuần này |
| 8 | Trả lời khớp mẫu câu hỏi nhưng thực chất không truy vấn DB (dùng kiến thức chung để "đoán" thay vì query) | AI trả lời câu hỏi "học sinh nào vắng nhiều nhất" bằng suy luận chung thay vì query bảng điểm danh thật |

## 2. Quy tắc bắt buộc khi dữ liệu thiếu hoặc không chắc chắn

Khi AI (chatbot, báo cáo tự động, đề xuất can thiệp) gặp dữ liệu thiếu/không đủ để trả lời chắc chắn:

- **Phải nói rõ đang thiếu gì**, không được im lặng bỏ qua rồi trả lời như thể đủ dữ liệu.
  - Đúng: *"Học sinh này chỉ có 2 kỳ điểm, chưa đủ 3 kỳ tối thiểu để đánh giá xu hướng."*
  - Sai: tự gán `trendLabel = STABLE` rồi trình bày như một kết luận chắc chắn mà không nêu lý do thiếu dữ liệu.
- **Không được làm tròn "chưa rõ" thành "có vẻ ổn"** — thiếu dữ liệu không phải là tín hiệu tích cực, phải được xử lý như một trạng thái riêng (`INSUFFICIENT_DATA`), không gộp vào `STABLE`.
- **Không dùng dữ liệu của học sinh/lớp/kỳ khác để "đại diện tạm"** cho phần thiếu, kể cả khi có vẻ hợp lý về mặt thống kê.

## 3. Phân biệt bắt buộc: Dữ kiện (Fact) vs Suy luận (Inference)

Mọi output của AI liên quan tới học sinh phải phân tách rõ ràng 2 loại nội dung, không được viết lẫn vào một câu khiến suy luận trông như dữ kiện:

```
[DỮ KIỆN — có record_id]: "Điểm Toán kỳ giữa HK1: 5.2, kỳ cuối HK1: 3.8"
                            (nguồn: student_score#id=xxx, id=yyy)

[SUY LUẬN — cần con người xác minh]: "Xu hướng giảm liên tục, có thể liên quan
                            đến số buổi vắng tăng trong cùng giai đoạn — cần
                            GVCN trao đổi trực tiếp để xác nhận nguyên nhân"
```

Trong UI/chatbot, 2 loại này phải hiển thị khác nhau về mặt hình ảnh (ví dụ: dữ kiện có badge nguồn kèm link tới record, suy luận có nhãn "AI suy luận — cần xác minh").

## 4. Bắt buộc kỹ thuật (áp dụng ở tầng code, không chỉ ở prompt)

Vì system prompt không đủ để đảm bảo an toàn tuyệt đối (model vẫn có thể hallucination), bắt buộc có tầng kiểm soát bằng code:

1. **Grounding bắt buộc:** mọi câu trả lời của AI liên quan tới số liệu học sinh phải đi kèm danh sách `record_id` đã dùng để tạo câu trả lời đó (trả về dưới dạng structured output, không phải tự do). Tầng ứng dụng **so khớp lại** các `record_id` này có tồn tại thật trong DB trước khi hiển thị cho người dùng — nếu AI trích `record_id` không tồn tại, chặn hiển thị và log lỗi.
2. **Không cho AI viết trực tiếp vào bảng dữ liệu chính thức** (`student_score`, `student_journey_snapshot` đã khóa, học bạ đã `LOCKED`). AI chỉ được tạo đề xuất ở trạng thái `SUGGESTED`, mọi ghi nhận chính thức đều qua hành động của con người (đúng vòng đời `SUGGESTED → APPROVED → APPLIED` đã thiết kế ở module Hành trình học sinh).
3. **Giới hạn phạm vi truy vấn theo quyền hạn thật** (`schoolId`/`campusId` của session) — không cho phép AI "tổng hợp giúp" bằng dữ liệu ngoài phạm vi rồi trình bày như thể đã kiểm tra đúng phạm vi.
4. **Test bắt buộc trước khi merge bất kỳ tính năng AI nào:**
   - Test với học sinh có dữ liệu rỗng/thiếu hoàn toàn → AI phải trả lời "không đủ dữ liệu", không được bịa
   - Test với câu hỏi ngoài phạm vi dữ liệu hệ thống có (ví dụ hỏi về học sinh trường khác) → AI phải từ chối, không suy diễn
   - Test đối chiếu ngẫu nhiên 10% câu trả lời có trích dẫn `record_id` → xác minh record đó tồn tại và đúng nội dung

## 5. Checklist bắt buộc trước khi merge tính năng AI mới

- [ ] Mọi số liệu AI đưa ra đều kèm `record_id` truy vết được, đã qua bước so khớp DB ở tầng code
- [ ] Có xử lý riêng cho trạng thái "thiếu dữ liệu" — không gộp vào bất kỳ nhãn phân loại tích cực/trung tính nào khác
- [ ] Output phân tách rõ dữ kiện và suy luận (khác nhau về UI, không viết lẫn trong 1 câu)
- [ ] AI không có quyền ghi trực tiếp vào bảng dữ liệu đã khóa hoặc bảng chính thức — chỉ tạo đề xuất chờ duyệt
- [ ] Đã test với ca dữ liệu rỗng/thiếu và ca ngoài phạm vi quyền hạn
- [ ] Prompt hệ thống của tính năng có include nguyên tắc ở Mục 0 của file này
