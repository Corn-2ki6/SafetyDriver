# SafetyDriver — Tài liệu Đặc tả Yêu cầu và Thiết kế
*(Requirement Specification & Design Document)*

## 1. Mục đích tài liệu

Tài liệu này mô tả các yêu cầu chức năng, yêu cầu phi chức năng và thiết kế tổng quan của **SafetyDriver** — ứng dụng hỗ trợ theo dõi các dấu hiệu buồn ngủ có thể quan sát được của tài xế và đưa ra cảnh báo.

Tài liệu gồm 7 phần chính:

1. Yêu cầu chức năng (*Functional Requirements*)
2. Yêu cầu phi chức năng (*Non-Functional Requirements*)
3. Sơ đồ luồng dữ liệu (*Data Flow Diagram – DFD*)
4. Sơ đồ ca sử dụng (*Use Case Diagram*)
5. Sơ đồ lớp (*Class Diagram*)
6. Mô hình dữ liệu (*Data Model*)
7. Mô tả thiết kế giao diện (*Interface Design Description*)

> **Lưu ý khi viết tài liệu:** Cần kiểm tra từng yêu cầu với mã nguồn hiện có trước khi xác định đó là chức năng đã triển khai. Hãy phân biệt rõ chức năng đã có, chức năng đang phát triển và chức năng mới chỉ là đề xuất. Không mặc định rằng ứng dụng có máy chủ, dịch vụ đám mây hoặc cơ sở dữ liệu nếu chưa có căn cứ.

---

## 2. Phân công công việc cho 5 thành viên

| Thành viên | Phần phụ trách chính | Phần phối hợp | Sản phẩm bàn giao |
|---|---|---|---|
| Thành viên 1 | Yêu cầu chức năng | Phối hợp xác định yêu cầu giao diện | Bảng yêu cầu chức năng và mô tả từng chức năng |
| Thành viên 2 | Yêu cầu phi chức năng | Rà soát tính dễ sử dụng và khả năng tiếp cận của giao diện | Bảng yêu cầu phi chức năng và tiêu chí đánh giá |
| Thành viên 3 | Sơ đồ DFD | Phối hợp với thành viên 5 xây dựng mô hình dữ liệu | DFD Level 0, DFD Level 1 và mô tả luồng dữ liệu |
| Thành viên 4 | Sơ đồ Use Case | Đối chiếu với yêu cầu chức năng của thành viên 1 | Use Case Diagram và mô tả các ca sử dụng chính |
| Thành viên 5 | Sơ đồ Class Diagram | Phối hợp với thành viên 3 về mô hình dữ liệu; tổng hợp tài liệu | Class Diagram, mô tả lớp và bản tài liệu đã rà soát |

### Công việc chung

- Cả nhóm thống nhất phạm vi ứng dụng, chức năng hiện có và chức năng dự kiến trước khi viết.
- Thành viên 1 và 2 phối hợp để bảo đảm giao diện đáp ứng đúng chức năng và dễ sử dụng.
- Thành viên 3 và 5 phối hợp để mô hình dữ liệu thống nhất với luồng dữ liệu và cấu trúc phần mềm.
- Thành viên 5 tổng hợp định dạng tài liệu; mỗi thành viên vẫn chịu trách nhiệm về độ chính xác của phần mình phụ trách.
---

# 3. Yêu cầu chức năng (Functional Requirements)

**Người phụ trách: Thành viên 1**

Phần này mô tả **hệ thống cần thực hiện những chức năng gì**. Mỗi yêu cầu nên có mã định danh riêng, ví dụ `FR-01`, và được viết rõ ràng để có thể kiểm tra.

## 3.1. Truy cập camera và giám sát tài xế

- Mô tả cách ứng dụng xin quyền truy cập camera.
- Mô tả cách người dùng bắt đầu và kết thúc quá trình giám sát.
- Xác định cách xử lý khi người dùng từ chối quyền camera hoặc camera không khả dụng.
- Ghi rõ nguồn camera mà phiên bản hiện tại hỗ trợ.

## 3.2. Phát hiện khuôn mặt

- Mô tả cách hệ thống phát hiện khuôn mặt tài xế từ hình ảnh camera.
- Xác định cách xử lý khi không phát hiện được khuôn mặt hoặc khi có nhiều khuôn mặt, nếu trường hợp này nằm trong phạm vi hệ thống.
- Mô tả cách xử lý khi các điểm đặc trưng trên khuôn mặt bị mất trong một khoảng thời gian.

## 3.3. Phát hiện dấu hiệu buồn ngủ

- Mô tả các dấu hiệu mà hệ thống thực sự sử dụng. Ví dụ: trạng thái mắt, tỷ lệ khung hình mắt (*Eye Aspect Ratio – EAR*), dấu hiệu ngáp hoặc tỷ lệ khung hình miệng (*Mouth Aspect Ratio – MAR*), tư thế đầu.
- Giải thích cách hệ thống xử lý các dấu hiệu theo thời gian để nhận diện khả năng buồn ngủ.
- Ghi rõ các ngưỡng, bộ đếm hoặc mô hình phân loại đang được sử dụng trong mã nguồn.

## 3.4. Đánh giá trạng thái tài xế

- Mô tả các trạng thái mà hệ thống có thể hiển thị, chẳng hạn `Normal`, `Potential Drowsiness` hoặc `Face Not Detected`, nếu được hỗ trợ.
- Giải thích điều kiện chuyển đổi giữa các trạng thái.
- Không mô tả kết quả như một chẩn đoán y tế hoặc lời bảo đảm rằng tài xế hoàn toàn an toàn.

## 3.5. Cảnh báo và thông báo

- Mô tả loại cảnh báo được kích hoạt khi phát hiện dấu hiệu buồn ngủ.
- Xác định hình thức cảnh báo được hỗ trợ, ví dụ âm thanh hoặc thông báo trên màn hình.
- Giải thích điều kiện bắt đầu, dừng và đặt lại cảnh báo.
- Mô tả cách xử lý khi âm thanh hoặc quyền thông báo không khả dụng.

## 3.6. Quản lý phiên giám sát

- Mô tả cách bắt đầu và kết thúc một phiên giám sát.
- Xác định thông tin phiên nào được ghi nhận, nếu có.
- Mô tả cách hệ thống xử lý khi ứng dụng bị tạm dừng, gián đoạn hoặc đóng.

## 3.7. Xử lý lỗi và trạng thái hệ thống

- Mô tả cách xử lý khi không có quyền camera, camera gặp lỗi, không phát hiện được khuôn mặt hoặc quá trình xử lý bị lỗi.
- Xác định cách thông báo cho người dùng khi xảy ra sự cố.
- Nêu rõ hệ thống có tự tiếp tục hay yêu cầu người dùng thao tác lại.

## 3.8. Quản lý lịch sử cảnh báo

- Xác định ứng dụng có lưu lịch sử cảnh báo hoặc phiên giám sát hay không.
- Nếu có, mô tả thông tin được lưu, chẳng hạn loại sự kiện và thời gian.
- Mô tả cách xem hoặc xóa lịch sử nếu các chức năng này được triển khai.
- Nếu phiên bản hiện tại chưa lưu lịch sử, hãy ghi đây là chức năng dự kiến, không trình bày như chức năng đã có.

## 3.9. Bảng yêu cầu chức năng

| Mã | Yêu cầu | Mức độ ưu tiên | Trạng thái | Tiêu chí nghiệm thu |
|---|---|---|---|---|
| FR-01 | Ứng dụng yêu cầu quyền camera trước khi bắt đầu giám sát. | Bắt buộc | Cần kiểm tra | Không bắt đầu giám sát nếu chưa có quyền cần thiết. |
| FR-02 | Ứng dụng xử lý hình ảnh camera để phát hiện khuôn mặt tài xế. | Bắt buộc | Cần kiểm tra | Hệ thống thể hiện trạng thái phát hiện khuôn mặt khi nhận được khung hình hợp lệ. |
| FR-03 | Ứng dụng nhận diện dấu hiệu buồn ngủ dựa trên phương pháp được hỗ trợ. | Bắt buộc | Cần kiểm tra | Dữ liệu kiểm thử được xác định trước cho ra trạng thái phù hợp với quy tắc đã mô tả. |
| FR-04 | Ứng dụng phát cảnh báo khi điều kiện buồn ngủ được thỏa mãn. | Bắt buộc | Cần kiểm tra | Sự kiện kiểm thử phù hợp kích hoạt cảnh báo đã cấu hình. |
| FR-05 | Người dùng có thể dừng quá trình giám sát. | Bắt buộc | Cần kiểm tra | Việc xử lý camera dừng sau khi người dùng dừng giám sát. |
| FR-06 | Ứng dụng thông báo lỗi camera hoặc lỗi xử lý. | Nên có | Cần kiểm tra | Lỗi được hỗ trợ tạo ra trạng thái hoặc thông báo rõ ràng. |
| FR-07 | Ứng dụng lưu và hiển thị lịch sử cảnh báo. | Dự kiến / cần xác minh | Cần kiểm tra | Nếu được triển khai, sự kiện đã ghi nhận có thể được truy xuất và hiển thị. |

**Trạng thái đề xuất:** `Đã triển khai`, `Đang triển khai một phần`, `Dự kiến` hoặc `Không hỗ trợ`.

---

# 4. Yêu cầu phi chức năng (Non-Functional Requirements)

**Người phụ trách: Thành viên 2**

Phần này mô tả **hệ thống cần hoạt động tốt như thế nào** và các giới hạn cần đáp ứng. Nên sử dụng tiêu chí đo lường được; nếu chưa có kết quả kiểm thử thì ghi rõ đó là mục tiêu đề xuất.

## 4.1. Hiệu năng (Performance)

- Xác định thời gian xử lý và thời gian phản hồi cảnh báo có thể chấp nhận.
- Xác định tốc độ xử lý khung hình hoặc tần suất xử lý mong muốn nếu có thể đo lường.
- Đánh giá mức sử dụng pin và CPU trên thiết bị mục tiêu.
- Ghi lại thiết bị và điều kiện dùng để đo hiệu năng.

## 4.2. Độ chính xác và độ tin cậy (Accuracy and Reliability)

- Xác định phương pháp đánh giá hiệu quả phát hiện.
- Kiểm thử trong các điều kiện ánh sáng, góc mặt, kính mắt và vị trí camera khác nhau nếu phù hợp.
- Theo dõi trường hợp cảnh báo sai (*false positive*) và bỏ sót dấu hiệu (*false negative*) trên tập kiểm thử được xác định.
- Không công bố tỷ lệ chính xác nếu chưa có kết quả đo lường.

## 4.3. Tính dễ sử dụng (Usability)

- Trạng thái giám sát và cảnh báo phải dễ hiểu.
- Nút bắt đầu và dừng giám sát cần rõ ràng.
- Hướng dẫn phải dễ hiểu khi người dùng từ chối quyền camera hoặc hệ thống không phát hiện được khuôn mặt.
- Văn bản, biểu tượng và trạng thái cảnh báo cần dễ phân biệt.

## 4.4. Khả năng tương thích với thiết bị di động (Mobile Device Compatibility)

- Liệt kê hệ điều hành mục tiêu và phiên bản tối thiểu được hỗ trợ.
- Ghi rõ yêu cầu về thiết bị và camera.
- Kiểm thử kích thước màn hình, quyền camera và hành vi khi ứng dụng chuyển nền hoặc quay lại.
- Xác minh khả năng tương thích của mã nguồn và thư viện hiện tại với nền tảng di động dự kiến.

## 4.5. Quyền riêng tư và bảo mật dữ liệu (Privacy and Data Security)

- Giải thích hình ảnh camera được xử lý ở đâu và có được truyền ra ngoài thiết bị hay không.
- Chỉ lưu dữ liệu cần thiết cho mục tiêu của ứng dụng.
- Nếu lưu lịch sử, xác định vị trí lưu, quyền truy cập và cách xóa dữ liệu.
- Không khẳng định dữ liệu chỉ được lưu cục bộ hoặc không truyền qua mạng khi chưa kiểm tra mã nguồn.

## 4.6. Khả năng bảo trì (Maintainability)

- Phân tách hợp lý các phần xử lý camera, phát hiện khuôn mặt, nhận diện buồn ngủ, cảnh báo, quản lý phiên và lưu trữ dữ liệu.
- Sử dụng cách đặt tên, xử lý lỗi và tài liệu thống nhất.
- Giúp các ngưỡng và thông số cấu hình dễ tìm, dễ kiểm tra.
- Ghi rõ các thư viện phụ thuộc và phiên bản được hỗ trợ.

## 4.7. Bảng yêu cầu phi chức năng

| Mã | Yêu cầu | Cách kiểm tra | Mục tiêu / trạng thái |
|---|---|---|---|
| NFR-01 | Ứng dụng phản hồi kịp thời khi phát hiện điều kiện cảnh báo. | Đo thời gian từ sự kiện đến cảnh báo trên thiết bị mục tiêu. | Cần xác định mục tiêu và kiểm thử |
| NFR-02 | Ứng dụng xử lý được tình huống khuôn mặt tạm thời không được phát hiện mà không bị dừng đột ngột. | Kiểm thử khi khuôn mặt bị che hoặc ra khỏi khung hình. | Bắt buộc |
| NFR-03 | Giao diện thể hiện rõ trạng thái giám sát đang bật hay tắt. | Rà soát khả năng sử dụng và kiểm thử chức năng. | Bắt buộc |
| NFR-04 | Việc xử lý dữ liệu camera phù hợp với mô tả về quyền riêng tư. | Kiểm tra mã nguồn, quyền truy cập, lưu trữ và kết nối mạng. | Cần xác minh |
| NFR-05 | Ứng dụng hoạt động trên các thiết bị mục tiêu đã công bố. | Kiểm thử trên danh sách thiết bị mục tiêu. | Cần xác định danh sách |

---

# 5. Sơ đồ luồng dữ liệu (Data Flow Diagram – DFD)

**Người phụ trách: Thành viên 3**

DFD mô tả dữ liệu đi vào hệ thống, được xử lý như thế nào và đầu ra được chuyển đến đâu.

## 5.1. DFD Level 0 — Sơ đồ ngữ cảnh (Context Diagram)

Biểu diễn SafetyDriver như một tiến trình tổng thể và các thực thể bên ngoài. Các thành phần có thể gồm:

- **Tài xế / Người dùng:** bắt đầu hoặc dừng giám sát, nhận trạng thái và cảnh báo.
- **Camera:** cung cấp khung hình cho ứng dụng.
- **SafetyDriver:** xử lý khung hình, xác định trạng thái giám sát và tạo cảnh báo.

Chỉ đưa vào sơ đồ những thực thể phù hợp với ranh giới hệ thống đã thống nhất. Nếu camera được xem là một giao diện thiết bị bên trong hệ thống thay vì thực thể ngoài, cần thống nhất và giải thích cách mô hình hóa.

## 5.2. DFD Level 1 — Các tiến trình chính

Có thể phân rã hệ thống thành các tiến trình sau:

1. **Thu nhận khung hình camera:** lấy hình ảnh sau khi đã có quyền truy cập.
2. **Phát hiện khuôn mặt và đặc trưng khuôn mặt:** xác định khuôn mặt và các điểm đặc trưng cần thiết.
3. **Phân tích dấu hiệu buồn ngủ:** đánh giá các chỉ số hoặc kết quả mô hình mà hệ thống hỗ trợ.
4. **Xác định trạng thái tài xế:** tạo trạng thái hiện tại dựa trên kết quả phân tích.
5. **Phát cảnh báo:** đưa ra cảnh báo khi điều kiện đã xác định được thỏa mãn.
6. **Ghi nhận sự kiện:** lưu thông tin sự kiện nếu chức năng lưu trữ được triển khai.

Điều chỉnh các tiến trình theo kiến trúc thực tế. Không vẽ kho dữ liệu lâu dài nếu ứng dụng không lưu dữ liệu.

## 5.3. Luồng dữ liệu và kho dữ liệu

Đặt tên rõ ràng cho dữ liệu trên từng luồng. Ví dụ:

- Khung hình camera → phát hiện đặc trưng khuôn mặt.
- Điểm đặc trưng hoặc chỉ số khuôn mặt → phân tích dấu hiệu buồn ngủ.
- Kết quả phân tích → xác định trạng thái tài xế.
- Trạng thái tài xế → xử lý cảnh báo và cập nhật giao diện.
- Sự kiện cảnh báo → kho lịch sử, nếu có lưu trữ.

## 5.4. Checklist kiểm tra DFD

- Mỗi tiến trình có đầu vào và đầu ra hợp lý.
- Tên luồng dữ liệu mô tả thông tin được truyền, không chỉ mô tả hành động chung.
- Các thực thể bên ngoài không trao đổi dữ liệu trực tiếp với nhau mà bỏ qua tiến trình xử lý của hệ thống.
- Tiến trình và kho dữ liệu nhất quán với yêu cầu chức năng.
- DFD Level 0 và Level 1 sử dụng tên gọi và ranh giới hệ thống thống nhất.

**Sản phẩm bàn giao:** DFD Level 0, DFD Level 1 và phần giải thích ngắn cho từng tiến trình, luồng dữ liệu.

---

# 6. Sơ đồ ca sử dụng (Use Case Diagram)

**Người phụ trách: Thành viên 4**

Use Case Diagram mô tả cách người dùng tương tác với SafetyDriver để thực hiện các mục tiêu cụ thể.

## 6.1. Tác nhân hệ thống (System Actors)

- **Tài xế / Người dùng:** tác nhân chính, thao tác với ứng dụng và nhận kết quả.
- **Thiết bị camera:** chỉ đưa vào như tác nhân nếu mô hình UML xem đây là một hệ thống bên ngoài tương tác với SafetyDriver; nếu không, có thể mô hình hóa camera như một thành phần nội bộ.

Không thêm quản trị viên, dịch vụ đám mây hoặc dịch vụ khẩn cấp nếu các vai trò này không nằm trong phạm vi dự án.

## 6.2. Các ca sử dụng chính (Main Use Cases)

Các ca sử dụng tiềm năng, cần xác minh theo chức năng thực tế:

- Cấp quyền camera (*Grant Camera Permission*)
- Bắt đầu giám sát (*Start Monitoring*)
- Dừng giám sát (*Stop Monitoring*)
- Xem trạng thái giám sát (*View Monitoring Status*)
- Nhận cảnh báo buồn ngủ (*Receive Drowsiness Alert*)
- Xử lý lỗi camera hoặc phát hiện (*Handle Camera or Detection Error*)
- Xem lịch sử cảnh báo (*View Alert History*), nếu có
- Xóa lịch sử cảnh báo (*Clear Alert History*), nếu có

## 6.3. Quan hệ giữa tác nhân và ca sử dụng

- Kết nối tác nhân Tài xế / Người dùng với các chức năng người dùng khởi tạo hoặc thông tin người dùng nhận được.
- Chỉ sử dụng quan hệ `<<include>>` khi một ca sử dụng luôn gọi đến ca sử dụng khác như một phần bắt buộc của quy trình.
- Chỉ sử dụng quan hệ `<<extend>>` khi hành vi mở rộng là tùy chọn hoặc phụ thuộc điều kiện.
- Ghi tên ranh giới hệ thống là `SafetyDriver`.

## 6.4. Mô tả các ca sử dụng chính

Sử dụng mẫu sau cho mỗi ca sử dụng quan trọng.

| Trường thông tin | Mô tả |
|---|---|
| Mã ca sử dụng | Mã duy nhất, ví dụ UC-01 |
| Tên | Bắt đầu giám sát |
| Tác nhân chính | Tài xế / Người dùng |
| Điều kiện trước | Ứng dụng đang mở và đã có quyền camera cần thiết. |
| Luồng chính | Người dùng chọn Bắt đầu giám sát; ứng dụng bắt đầu lấy và xử lý khung hình; trạng thái hiện tại được hiển thị. |
| Luồng thay thế / ngoại lệ | Người dùng từ chối quyền, camera không khả dụng hoặc không phát hiện được khuôn mặt. |
| Điều kiện sau | Quá trình giám sát hoạt động hoặc ứng dụng thông báo lý do không thể bắt đầu. |

Viết mô tả chi tiết tối thiểu cho `Start Monitoring`, `Stop Monitoring` và `Receive Drowsiness Alert`. Chỉ bổ sung ca sử dụng lịch sử nếu chức năng này thuộc phạm vi ứng dụng.

---

# 7. Sơ đồ lớp (Class Diagram)

**Người phụ trách: Thành viên 5**

Class Diagram mô tả cấu trúc tĩnh của phần mềm. Các lớp dưới đây chỉ là gợi ý thiết kế, không khẳng định rằng mã nguồn hiện tại đã có các lớp với tên tương tự.

## 7.1. Các lớp dự kiến

- **CameraManager:** quản lý quyền truy cập camera và việc thu nhận khung hình.
- **FaceDetector:** phát hiện khuôn mặt và các điểm đặc trưng cần thiết.
- **DrowsinessDetector:** đánh giá dấu hiệu buồn ngủ hoặc gọi mô hình phát hiện.
- **DriverStateManager:** quản lý hoặc xác định trạng thái giám sát, nếu trách nhiệm này được tách riêng.
- **AlertManager:** kích hoạt và dừng các loại cảnh báo được hỗ trợ.
- **MonitoringSession:** đại diện cho trạng thái và thời lượng một phiên giám sát, nếu có quản lý phiên.
- **HistoryManager:** lưu và truy xuất sự kiện, chỉ khi có lịch sử được lưu trữ.
- **UserInterface / MonitoringScreen:** hiển thị trạng thái và tiếp nhận thao tác người dùng, tùy kiến trúc được chọn.

Hãy gộp, đổi tên hoặc loại bỏ các lớp để khớp với mã nguồn và kiến trúc thực tế. Không tạo lớp chỉ để làm sơ đồ có vẻ đầy đủ hơn.

## 7.2. Thuộc tính và phương thức của lớp

Mỗi lớp chỉ cần các thuộc tính và phương thức liên quan. Ví dụ:

**CameraManager**
- Thuộc tính: trạng thái camera, trạng thái quyền truy cập (nếu lớp này quản lý).
- Phương thức: yêu cầu quyền, bắt đầu thu nhận, dừng thu nhận, lấy khung hình.

**DrowsinessDetector**
- Thuộc tính: ngưỡng cấu hình hoặc tham chiếu đến mô hình, nếu có.
- Phương thức: nhận hoặc trích xuất chỉ số, đánh giá trạng thái, trả về kết quả phát hiện.

**AlertManager**
- Thuộc tính: trạng thái cảnh báo, loại cảnh báo được cấu hình.
- Phương thức: kích hoạt cảnh báo, dừng cảnh báo, đặt lại cảnh báo.

Đây là ví dụ minh họa. Cần điều chỉnh theo trách nhiệm và giao diện thực tế của từng thành phần.

## 7.3. Quan hệ giữa các lớp

Thể hiện những quan hệ phù hợp với thiết kế, ví dụ:

- `CameraManager` cung cấp khung hình cho thành phần phân tích khuôn mặt.
- `FaceDetector` cung cấp điểm đặc trưng hoặc chỉ số cho `DrowsinessDetector`.
- `DrowsinessDetector` trả kết quả cho thành phần xác định trạng thái tài xế.
- Thành phần trạng thái hoặc sự kiện yêu cầu `AlertManager` phát cảnh báo.
- Thành phần phiên hoặc sự kiện tương tác với `HistoryManager` nếu có lưu dữ liệu.

Ghi nhãn quan hệ và bội số (*multiplicity*) khi cần thiết. Dùng mũi tên phụ thuộc khi một thành phần chỉ sử dụng thành phần khác trong thời gian ngắn.

## 7.4. Checklist kiểm tra Class Diagram

- Mỗi lớp có trách nhiệm rõ ràng.
- Tên phương thức thống nhất với mã nguồn hoặc thiết kế đã được duyệt.
- Quan hệ giữa các lớp không mâu thuẫn với DFD.
- Các thực thể dữ liệu thống nhất với Data Model.
- Tránh đưa mọi chức năng vào một lớp duy nhất có quá nhiều trách nhiệm.

**Sản phẩm bàn giao:** Class Diagram và bảng mô tả ngắn trách nhiệm của từng lớp.

---

# 8. Mô hình dữ liệu (Data Model)

**Đồng phụ trách: Thành viên 3 và Thành viên 5**

Mô hình dữ liệu xác định thông tin được lưu và mối quan hệ giữa chúng. Trước tiên, nhóm cần xác định SafetyDriver có thực sự cần lưu dữ liệu lâu dài hay không.

## 8.1. Các thực thể dữ liệu

Các thực thể gợi ý dưới đây chỉ áp dụng khi hệ thống có nhu cầu lưu trữ.

### MonitoringSession — Phiên giám sát

- `session_id`: khóa chính (*Primary Key*).
- `start_time`: thời điểm bắt đầu.
- `end_time`: thời điểm kết thúc.
- `session_status`: trạng thái phiên.

### AlertEvent — Sự kiện cảnh báo

- `event_id`: khóa chính (*Primary Key*).
- `session_id`: khóa ngoại (*Foreign Key*) liên kết với MonitoringSession, nếu lưu phiên.
- `event_type`: loại sự kiện.
- `event_timestamp`: thời điểm sự kiện.
- `event_details`: chi tiết sự kiện, nếu cần và phù hợp.

Đây là ví dụ đề xuất. Loại bỏ thực thể và trường dữ liệu không cần thiết. Tránh lưu hình ảnh camera hoặc dữ liệu khuôn mặt nếu không có yêu cầu rõ ràng, lý do chính đáng và đánh giá quyền riêng tư.

## 8.2. Khóa chính và khóa ngoại

- Xác định khóa chính cho mỗi thực thể được lưu trữ.
- Chỉ xác định khóa ngoại khi tồn tại quan hệ thực sự giữa các bản ghi.
- Nếu `AlertEvent` thuộc về một `MonitoringSession`, sử dụng `session_id` làm khóa ngoại.
- Ghi lại các ràng buộc cần thiết, chẳng hạn trường thời gian không được để trống.

## 8.3. Sơ đồ quan hệ thực thể (Entity Relationship Diagram – ERD)

Nếu ứng dụng lưu phiên và sự kiện, quan hệ có thể là:

- Một `MonitoringSession` có thể chứa không hoặc nhiều `AlertEvent`.
- Mỗi `AlertEvent` thuộc về một `MonitoringSession`.

Nếu ứng dụng chưa có hoặc không cần cơ sở dữ liệu lâu dài, hãy mô tả cấu trúc dữ liệu dùng trong lúc chạy và nêu rõ lưu trữ lâu dài nằm ngoài phạm vi hiện tại, thay vì tự tạo các bảng không cần thiết.

## 8.4. Lưu trữ và thời hạn lưu dữ liệu

Cần mô tả:

- Dữ liệu được lưu ở đâu: bộ nhớ tạm, tệp cục bộ, cơ sở dữ liệu cục bộ hay máy chủ.
- Dữ liệu nào được giữ lại và vì sao.
- Thời hạn lưu trữ.
- Cách xóa dữ liệu.
- Dữ liệu có được truyền ra ngoài thiết bị hay không.

**Sản phẩm bàn giao:** Bảng thực thể và thuộc tính, ERD nếu phù hợp, phần mô tả lưu trữ và thời hạn lưu dữ liệu.

---

# 9. Mô tả thiết kế giao diện (Interface Design Description)

**Phối hợp: Thành viên 1 xác định chức năng; Thành viên 2 rà soát tính dễ sử dụng; Thành viên 5 tổng hợp**

Mô tả giao diện bằng văn bản và/hoặc bản phác thảo (*wireframe*). Chỉ đưa vào những màn hình thuộc phạm vi sản phẩm đã thống nhất.

## 9.1. Tổng quan giao diện

- Xác định thiết bị và nền tảng mục tiêu.
- Giải thích luồng điều hướng chính.
- Mô tả cách giao diện thể hiện trạng thái giám sát, lỗi và cảnh báo.
- Đảm bảo giao diện phản ánh đúng các chức năng ở Mục 3.

## 9.2. Màn hình chính (Home Screen)

Mô tả:

- Tên ứng dụng và giới thiệu ngắn.
- Nút Bắt đầu giám sát.
- Yêu cầu cấp quyền camera hoặc trạng thái quyền.
- Lối truy cập cài đặt hoặc lịch sử nếu có hỗ trợ.

## 9.3. Màn hình giám sát (Monitoring Screen)

Mô tả:

- Khung hình camera nếu giao diện có hiển thị.
- Trạng thái giám sát hiện tại.
- Nút Dừng giám sát rõ ràng.
- Trạng thái camera hoặc phát hiện khuôn mặt.
- Cách hiển thị khi không phát hiện được khuôn mặt.

## 9.4. Giao diện cảnh báo buồn ngủ (Drowsiness Alert Interface)

Mô tả:

- Nội dung và mức độ nổi bật của cảnh báo.
- Cơ chế cảnh báo được hỗ trợ như âm thanh hoặc thông báo trực quan.
- Cách dừng hoặc đặt lại cảnh báo.
- Cách tránh tạo cảm giác rằng hệ thống có thể bảo đảm an toàn tuyệt đối cho tài xế.

## 9.5. Màn hình lịch sử giám sát (Monitoring History Screen)

Chỉ đưa vào nếu ứng dụng lưu lịch sử. Mô tả danh sách sự kiện, thời gian, thông tin hiển thị và thao tác xóa nếu có. Nếu chưa triển khai, đánh dấu đây là chức năng dự kiến hoặc loại khỏi phạm vi hiện tại.

## 9.6. Màn hình cài đặt (Settings Screen)

Chỉ mô tả các cài đặt đã có hoặc được xác định rõ là sẽ phát triển, chẳng hạn tùy chọn cảnh báo hoặc ngưỡng cấu hình. Không đưa thông số kỹ thuật nội bộ ra giao diện người dùng nếu không có lý do phù hợp.

## 9.7. Luồng điều hướng

Luồng ví dụ:

`Home → Grant Camera Permission → Monitoring → (Potential Drowsiness → Alert) → Stop Monitoring`

Bổ sung nhánh xử lý lỗi khi người dùng từ chối quyền hoặc camera không khả dụng. Chỉ thêm nhánh Lịch sử hoặc Cài đặt nếu nằm trong phạm vi ứng dụng.

**Sản phẩm bàn giao:** Mô tả từng màn hình, wireframe/mockup và sơ đồ luồng điều hướng.

---

# 10. Kế hoạch thực hiện đề xuất

| Giai đoạn | Công việc | Người phụ trách |
|---|---|---|
| 1 | Thống nhất phạm vi, chức năng hiện có và chức năng dự kiến | Cả nhóm |
| 2 | Soạn yêu cầu chức năng và phi chức năng | Thành viên 1 và 2 |
| 3 | Xây dựng DFD và Use Case Diagram | Thành viên 3 và 4 |
| 4 | Xây dựng Class Diagram và Data Model | Thành viên 5 và 3 |
| 5 | Hoàn thiện mô tả giao diện và wireframe | Thành viên 1, 2 và 5 |
| 6 | Kiểm tra tính nhất quán, thuật ngữ và mã yêu cầu | Cả nhóm; thành viên 5 tổng hợp |

## 10.1. Checklist trước khi hoàn thành tài liệu

- [ ] Yêu cầu chức năng mô tả hành vi cụ thể và có thể kiểm thử.
- [ ] Yêu cầu phi chức năng có tiêu chí đo lường hoặc được ghi rõ là mục tiêu cần xác định.
- [ ] Phân biệt chức năng đã triển khai, đang phát triển và chưa hỗ trợ.
- [ ] Các tiến trình trong DFD phù hợp với yêu cầu chức năng.
- [ ] Use Case phản ánh mục tiêu thực tế của người dùng và hành vi hệ thống.
- [ ] Trách nhiệm và quan hệ lớp phù hợp với kiến trúc dự kiến.
- [ ] Data Model phản ánh nhu cầu lưu trữ thực tế, không tự giả định có cơ sở dữ liệu.
- [ ] Các màn hình giao diện phù hợp với danh sách chức năng.
- [ ] Nội dung về quyền riêng tư và lưu trữ đã được kiểm tra với mã nguồn.
- [ ] Các sơ đồ có tiêu đề, nhãn dễ đọc và thuật ngữ nhất quán.

## 10.2. Lưu ý về phạm vi và an toàn

SafetyDriver hướng đến việc nhận diện các dấu hiệu quan sát được có thể liên quan đến buồn ngủ và đưa ra cảnh báo. Kết quả có thể bị ảnh hưởng bởi ánh sáng, vị trí camera, việc che khuất khuôn mặt, hiệu năng thiết bị và các điều kiện khác. Không mô tả ứng dụng như công cụ thay thế việc nghỉ ngơi đầy đủ, lái xe có trách nhiệm hoặc đánh giá y tế chuyên môn.
