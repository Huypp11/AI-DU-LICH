# Cẩm Nang Du Lịch — Chatbot tư vấn du lịch

Hệ thống gồm: **trích xuất sở thích** (từ tin nhắn hiện tại) -> **hệ gợi ý tự xây dựng** (cosine similarity + ngân sách + mùa, có giải thích) -> **Tavily** (dữ liệu web) -> **Gemini** (diễn đạt câu trả lời).

## 1. Cài server
```bash
cd server
npm install
copy .env.example .env     # Windows (Mac/Linux: cp)
# mở .env và điền GEMINI_API_KEY, TAVILY_API_KEY
npm run dev                # http://localhost:3002
```

## 2. Cài client (terminal khác)
```bash
cd client
npm install
npm run dev                # http://localhost:5173
```

## 3. Chạy đánh giá (không cần API key)
```bash
cd server
npm run eval
```
In ra bảng Precision@3 và tỷ lệ vượt ngân sách của: Ngẫu nhiên, Phổ biến nhất, Hệ gợi ý của nhóm, cùng danh sách câu sai để phân tích lỗi.

## Công thức xếp hạng
score = (0.6*sim + 0.25*budget + 0.15*season) / tổng trọng số các thành phần có dữ liệu
- sim: cosine giữa vector sở thích người dùng và vector đặc trưng điểm đến
- budget: 1 nếu chi phí/ngày <= ngân sách/ngày, giảm tuyến tính nếu vượt
- season: 1 nếu tháng đi nằm trong mùa đẹp, ngược lại 0.4

Ngân sách/ngày = tổng ngân sách / số ngày / số người (mặc định 1 người, cặp đôi = 2).

## Ý tưởng mở rộng cho báo cáo
- Tăng bộ test lên 30-40 câu, nhờ người khác gán nhãn
- Thêm cấu hình "chỉ Gemini" vào script eval để so sánh ablation
- Thử TOPSIS/AHP thay cho trọng số cố định, so sánh Precision@3

## 4. Lập lịch trình bằng tìm kiếm (module AI chính)
Khi người dùng nêu số ngày, hệ thống lập lịch trình cho điểm đến xếp hạng cao nhất (có dữ liệu địa điểm: Đà Nẵng, Hội An, Đà Lạt, Phú Quốc, Hà Nội, Sa Pa).

**Bài toán:** chọn và xếp địa điểm vào N ngày, tối đa tổng giá trị (rating + 2 x số nhãn khớp sở thích), với ràng buộc: mỗi ngày <= 8 giờ (gồm di chuyển: cùng khu 0.3h, khác khu 1h), tổng chi phí hoạt động <= 30% ngân sách.

**Không gian trạng thái:** duyệt từng địa điểm theo thứ tự, mỗi địa điểm có (N+1) lựa chọn: xếp vào ngày d hoặc bỏ qua.
- `planner.js > greedy`: baseline tham lam theo giá trị/giờ.
- `planner.js > dfs`: DFS có cắt nhánh. Cận trên = min(tổng giá trị còn lại, giờ còn lại x giá trị/giờ tối đa); nếu giá trị hiện tại + cận trên <= lời giải tốt nhất thì bỏ nhánh. Có phá đối xứng giữa các ngày trống.

Đơn giản hóa cần nêu trong báo cáo: trong một ngày, các địa điểm đi theo thứ tự nhóm khu vực cố định (không tối ưu thứ tự).

```bash
cd server
npm run eval:plan
```
In bảng so sánh Tham lam / DFS cắt nhánh / DFS vét cạn: giá trị lịch trình, số nút duyệt, thời gian chạy.
