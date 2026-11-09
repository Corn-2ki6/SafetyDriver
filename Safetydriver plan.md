# SAFETYDRIVER

## Kế hoạch triển khai dự án và phân công công việc cho nhóm 5 thành viên

**Công nghệ định hướng:** React Native + TypeScript cho ứng dụng di động; React Native VisionCamera cho camera; Kotlin/Android Native cho phần tích hợp camera/AI cần native; MediaPipe Face Landmarker và LiteRT nếu tương thích; SQLite cho dữ liệu cục bộ. Python được dùng để nghiên cứu, thử nghiệm và đánh giá thuật toán/mô hình, không phải runtime chính của ứng dụng React Native.

**Mục tiêu:** Xây dựng phiên bản MVP của SafetyDriver trên thiết bị di
động, cho phép người dùng bắt đầu/dừng giám sát, tiếp nhận hình ảnh từ
camera, phân tích dấu hiệu buồn ngủ, phát cảnh báo và lưu lịch sử cần
thiết.

**Nguyên tắc:** Mỗi task phải có đầu ra cụ thể, cách kiểm thử và điều
kiện nghiệm thu. Kiểm tra từng module trước khi tích hợp toàn bộ ứng
dụng.

------------------------------------------------------------------------

# PHẦN I. PHẠM VI VÀ NGUYÊN TẮC

## 1. Mục tiêu MVP

1.  Người dùng có thể cấp quyền camera, bắt đầu và dừng giám sát.
2.  Ứng dụng tiếp nhận khung hình và phát hiện khuôn mặt.
3.  Hệ thống trích xuất các đặc trưng liên quan đến dấu hiệu buồn ngủ
    như EAR, MAR và pitch nếu phương pháp được tích hợp hỗ trợ.
4.  Hệ thống đánh giá trạng thái người lái dựa trên logic đã xác định
    hoặc mô hình ML đã được kiểm tra.
5.  Ứng dụng phát cảnh báo khi điều kiện đã quy định được đáp ứng.
6.  Hệ thống xử lý các trường hợp không có khuôn mặt, camera bị gián
    đoạn hoặc dữ liệu đầu vào không hợp lệ.
7.  Ứng dụng lưu phiên giám sát và sự kiện cảnh báo vào SQLite nếu chức
    năng lưu trữ thuộc phạm vi MVP.
8.  Nhóm kiểm thử trên điện thoại thật và đánh giá hiệu năng.

SafetyDriver là công cụ hỗ trợ cảnh báo, không thay thế sự chú ý của
người lái. Không công bố độ chính xác hoặc khả năng ngăn ngừa tai nạn
khi chưa có kết quả đánh giá thực tế.

## 2. Công nghệ đề xuất

### Kiến trúc được chọn

Nhóm ưu tiên **React Native + TypeScript cho ứng dụng di động**, kết hợp
**native Android bằng Kotlin cho những phần camera hoặc suy luận AI cần
hiệu năng và API hệ điều hành**. Python vẫn được sử dụng trong giai đoạn
nghiên cứu và kiểm chứng thuật toán, nhưng không được giả định là có thể
chạy trực tiếp bên trong React Native.

Luồng xử lý mục tiêu:

`React Native UI → MonitoringController → Camera/VisionCamera → FaceDetector
(MediaPipe/native) → FeatureExtractor (EAR/MAR/pitch nếu hỗ trợ) →
DrowsinessState → ML runtime tương thích nếu có → AlertSys → SQLite`

Các module có thể được cài đặt ở TypeScript hoặc native Kotlin tùy yêu cầu
kỹ thuật. Cần thống nhất giao diện dữ liệu giữa các module trước khi tích hợp.

### Vai trò của Python

- Dùng Python để thử nghiệm thuật toán hiện có, tính EAR/MAR/pitch, chuẩn
  bị dữ liệu và đánh giá mô hình trên máy tính.
- Viết test hoặc script so sánh kết quả Python với kết quả triển khai trên
  điện thoại.
- Nếu có mô hình ML, kiểm tra định dạng, các đặc trưng đầu vào, tiền xử lý
  và khả năng chuyển đổi sang runtime di động tương thích.
- Không nhúng giả định rằng file `.py` hoặc thư viện Python trên máy tính
  sẽ chạy trực tiếp trong ứng dụng React Native.
- Chỉ xem xét backend chạy Python nếu thật sự cần xử lý phía máy chủ. Với
  giám sát buồn ngủ theo thời gian thực, ưu tiên xử lý trên thiết bị để
  giảm độ trễ và tránh truyền video ra ngoài khi không cần thiết.


| Thành phần | Công nghệ định hướng | Vai trò |
|---|---|---|
| Giao diện ứng dụng | React Native + TypeScript | Màn hình, điều hướng, trạng thái và thao tác người dùng |
| Camera | React Native VisionCamera | Xin quyền, mở camera và tiếp nhận khung hình |
| Tích hợp native | Kotlin / Android Native | Xử lý phần cần API Android hoặc tích hợp AI native |
| Phát hiện khuôn mặt | MediaPipe Face Landmarker hoặc giải pháp tương thích | Phát hiện khuôn mặt và trích xuất landmarks |
| Thử nghiệm thuật toán | Python + OpenCV/MediaPipe nếu phù hợp | Prototyping, kiểm chứng và đánh giá thuật toán trên máy tính |
| Suy luận ML trên điện thoại | LiteRT hoặc runtime tương thích với mô hình | Chạy mô hình đã xác minh tương thích; không giả định mô hình đã có |
| Cơ sở dữ liệu cục bộ | SQLite thông qua thư viện tương thích React Native/native | Lưu phiên giám sát và sự kiện cần thiết |
| Quản lý mã nguồn | Git + GitHub | Phối hợp phát triển |
| Kiểm thử | Jest, React Native Testing Library, test native và thiết bị thật | Kiểm tra logic, tích hợp và hiệu năng |
Cần xác minh phiên bản thư viện và khả năng tích hợp camera, MediaPipe,
mô hình ML trên thiết bị mục tiêu trước khi chốt kiến trúc.

## 3. Quy trình cho mỗi task

**Phân tích yêu cầu → Thiết kế → Lập trình → Kiểm thử → Review → Tích
hợp → Nghiệm thu.**

Mỗi task cần xác định người phụ trách, đầu vào, đầu ra, cách kiểm thử và
điều kiện nghiệm thu. Không đánh dấu hoàn thành chỉ vì code đã được viết
hoặc giao diện đã hiển thị.

------------------------------------------------------------------------

# PHẦN II. PHÂN CÔNG CHO 5 THÀNH VIÊN

## Thành viên 1 --- Mobile UI/UX và tích hợp giao diện

### Task UI-01: Thiết kế giao diện tổng thể

**Mục tiêu:** Xác định cách người dùng tương tác với ứng dụng.

**Công việc:** - Xây dựng sơ đồ điều hướng giữa các màn hình. - Thiết kế
màn hình chính, màn hình giám sát và các trạng thái lỗi. - Xác định
trạng thái giao diện: chưa giám sát, đang giám sát, đang xử lý, nghi ngờ
buồn ngủ, không đủ dữ liệu và lỗi. - Thiết kế thông báo khi người dùng
chưa cấp quyền camera. - Làm rõ thao tác bắt đầu và dừng giám sát.

**Đầu ra:** Sơ đồ điều hướng, bản thiết kế giao diện và danh sách trạng
thái UI.

**Nghiệm thu:** Thành viên khác có thể dựa vào thiết kế để xác định
luồng thao tác và trạng thái hiển thị.

### Task UI-02: Khởi tạo ứng dụng React Native + TypeScript

**Công việc:** - Tạo màn hình chính. - Tạo khu vực trạng thái giám
sát. - Tạo nút bắt đầu và dừng. - Tạo khu vực cảnh báo và lỗi. - Tách
các thành phần thành component có thể tái sử dụng.

**Đầu ra:** Ứng dụng chạy được với giao diện cơ bản.

**Kiểm thử:** Chạy ứng dụng, kiểm tra điều hướng và xác nhận thành phần
hiển thị đúng.

### Task UI-03: Kết nối giao diện với MonitoringController

**Công việc:** - Kết nối thao tác bắt đầu/dừng với controller. - Hiển
thị trạng thái thực tế do controller trả về. - Hiển thị lỗi camera và
thông báo không phát hiện được khuôn mặt. - Không hiển thị trạng thái
đang giám sát nếu camera chưa khởi tạo thành công.

**Đầu ra:** Giao diện điều khiển và phản ánh đúng trạng thái ứng dụng.

**Kiểm thử:** Thử bắt đầu, dừng, từ chối quyền camera và mô phỏng lỗi.

### Task UI-04: Hoàn thiện trải nghiệm sử dụng

**Công việc:** - Chuẩn hóa thông báo và trạng thái. - Kiểm tra trên kích
thước màn hình mục tiêu. - Kiểm tra khi ứng dụng chuyển xuống nền hoặc
người dùng rời màn hình. - Phối hợp sửa lỗi giao diện.

**Nghiệm thu:** Người dùng có thể bắt đầu, theo dõi trạng thái và dừng
giám sát dễ dàng.

------------------------------------------------------------------------

## Thành viên 2 --- Camera và tích hợp Android Native

### Task CAM-01: Xác minh khả năng tích hợp công nghệ

**Công việc:** - Xác định hệ điều hành mục tiêu. - Kiểm tra phiên bản
React Native và VisionCamera tương thích. - Kiểm tra khả năng lấy khung
hình để xử lý. - Xác minh phương án tích hợp MediaPipe và ML. - Ghi lại
giới hạn thiết bị, hệ điều hành và thư viện.

**Đầu ra:** Bản thử nghiệm chứng minh camera có thể mở và cung cấp hình
ảnh.

**Nghiệm thu:** Nhóm thống nhất được kiến trúc camera và phương án tích
hợp xử lý hình ảnh.

### Task CAM-02: Xin quyền và mở camera

**Công việc:** - Xử lý trạng thái quyền camera. - Hiển thị hướng dẫn khi
chưa cấp quyền. - Mở camera khi bắt đầu giám sát. - Xử lý trường hợp
camera không khả dụng. - Giải phóng camera khi dừng giám sát.

**Đầu ra:** Module camera dùng được độc lập với giao diện.

**Kiểm thử:** Chấp nhận quyền, từ chối quyền, lỗi mở camera, dừng và mở
lại camera.

### Task CAM-03: Tiếp nhận và quản lý khung hình

**Công việc:** - Lấy khung hình theo cơ chế thư viện hỗ trợ. - Xác định
định dạng, kích thước và hướng khung hình. - Tránh xử lý đồng thời quá
nhiều khung hình. - Xử lý hoặc bỏ qua khung hình không hợp lệ. - Không
để xử lý hình ảnh làm treo giao diện.

**Đầu ra:** Module camera cung cấp dữ liệu cho FaceDetector.

**Kiểm thử:** Kiểm tra luồng hình ảnh, đổi hướng thiết bị và gián đoạn
ứng dụng.

### Task CAM-04: Xử lý vòng đời camera

**Công việc:** - Xử lý khi dừng giám sát. - Xử lý khi ứng dụng chuyển
xuống nền và quay lại tiền cảnh. - Giải phóng tài nguyên đúng lúc. -
Phối hợp với MonitoringController để cập nhật trạng thái.

**Nghiệm thu:** Camera được giải phóng đúng cách và ứng dụng phục hồi
theo quy tắc đã thiết kế.

------------------------------------------------------------------------

## Thành viên 3 --- Computer Vision, Python prototyping và trích xuất đặc trưng

### Task CV-01: Tạo bản thử nghiệm thuật toán bằng Python

**Công việc:** - Kiểm tra code Python hiện có của dự án. - Tách phần xử
lý hình ảnh/đặc trưng thành module có thể kiểm thử. - Xác định đầu vào,
đầu ra, phụ thuộc thư viện và giới hạn của code hiện tại. - Tạo bộ dữ liệu
thử nghiệm có thể tái sử dụng để so sánh với bản di động.

**Đầu ra:** Bản thử nghiệm Python có hướng dẫn chạy, đầu vào/đầu ra rõ
ràng và các test case cơ bản.

**Lưu ý:** Đây là công cụ nghiên cứu và đối chiếu trên máy tính, không phải
bằng chứng rằng mã Python đã chạy được bên trong ứng dụng di động.

### Task CV-02: Chọn và xác minh giải pháp nhận diện trên điện thoại

**Công việc:** - Xác minh khả năng tích hợp MediaPipe Face Landmarker
trên nền tảng Android mục tiêu. - Xác định có cần native module Kotlin
hay không. - Chuẩn hóa định dạng khung hình và kết quả landmarks. - Xử lý
trường hợp không phát hiện khuôn mặt. - Ghi rõ phiên bản thư viện và
giới hạn thiết bị.

**Đầu ra:** Bản thử nghiệm nhận diện chạy trên Android hoặc bằng chứng
kỹ thuật về phương án tích hợp đã chọn.

### Task CV-03: Trích xuất điểm đặc trưng

**Công việc:** - Xác định landmarks cho vùng mắt. - Xác định landmarks
cho vùng miệng. - Xác định các điểm cần thiết để ước lượng tư thế đầu. -
Xử lý trường hợp landmark thiếu hoặc không hợp lệ. - Thống nhất cách
biểu diễn dữ liệu.

**Đầu ra:** Các hàm hoặc module trả về dữ liệu đặc trưng có cấu trúc.

**Kiểm thử:** Xác nhận điểm được chọn nằm đúng vùng khuôn mặt và không
gây lỗi khi dữ liệu thiếu.

### Task CV-04: Tính EAR, MAR và pitch

**Công việc:** - Tính EAR từ các điểm vùng mắt. - Tính MAR từ các điểm
vùng miệng. - Ước lượng pitch bằng phương pháp đã chọn. - Xử lý dữ liệu
không hợp lệ. - Ghi lại phương pháp tính và giả định sử dụng.

**Đầu ra:** Hàm trích xuất đặc trưng có thể kiểm thử độc lập và cung cấp
dữ liệu cho DrowsinessState.

**Kiểm thử:** Dùng dữ liệu thử với trạng thái mắt, miệng và tư thế đầu
khác nhau.

EAR, MAR và pitch là đặc trưng hỗ trợ đánh giá, không tự động chứng minh
người lái đang buồn ngủ.

### Task CV-05: Đánh giá độ ổn định và đối chiếu kết quả

**Công việc:** - Kiểm tra khi khuôn mặt bị che khuất. - Kiểm tra khi
người lái quay đầu. - Kiểm tra khi ánh sáng thay đổi. - Xác định khi nào
không nên đưa đặc trưng vào mô hình ML. - Thống nhất cách báo lỗi hoặc
trả về trạng thái không đủ dữ liệu.

**Đầu ra:** Quy tắc xử lý dữ liệu không hợp lệ và báo cáo so sánh kết
quả Python với kết quả chạy trên thiết bị, nếu cả hai phiên bản đã có.

**Nghiệm thu:** Module không coi dữ liệu thiếu là kết quả đo hợp lệ;
mọi khác biệt giữa bản thử nghiệm và bản di động được ghi nhận.

------------------------------------------------------------------------

## Thành viên 4 --- DrowsinessState, ML và logic cảnh báo

### Task AI-01: Xác định logic đánh giá trạng thái

**Công việc:** - Xác định trạng thái cần có: chưa giám sát, đang giám
sát, bình thường theo kết quả đánh giá, nghi ngờ buồn ngủ, không đủ dữ
liệu và lỗi. - Xác định dữ liệu nhận từ module đặc trưng. - Quy định
cách xử lý chỉ số không hợp lệ. - Xác định cách theo dõi trạng thái qua
nhiều khung hình. - Phân biệt trạng thái đánh giá với trạng thái kỹ
thuật của ứng dụng.

**Đầu ra:** Tài liệu logic trạng thái và sơ đồ chuyển đổi trạng thái.

**Kiểm thử:** Xác định được trạng thái đầu ra cho các tình huống đã quy
định.

### Task AI-02: Xác minh mô hình ML và khả năng chạy trên điện thoại

**Công việc:** - Kiểm tra nhóm đã có mô hình được huấn luyện hay chưa.
- Nếu mô hình được phát triển/thử nghiệm bằng Python, ghi lại phiên bản,
đặc trưng đầu vào, tiền xử lý và cách diễn giải đầu ra. - Xác định định
dạng mô hình hiện có. - Đánh giá khả năng chuyển đổi sang LiteRT hoặc
runtime Android phù hợp. - Kiểm tra kết quả trên bộ dữ liệu thử nghiệm
trước và sau chuyển đổi nếu việc chuyển đổi khả thi.

**Đầu ra:** Báo cáo khả năng tích hợp và bản thử nghiệm suy luận trên Android nếu khả thi. Python có thể tiếp tục được dùng làm chuẩn đối chiếu.

**Nghiệm thu:** Mô hình nhận dữ liệu đúng định dạng và trả kết quả có
thể diễn giải.

Nếu chưa có mô hình phù hợp, nhóm cần ghi rõ giới hạn. Có thể dùng logic
ngưỡng để thử nghiệm luồng xử lý, nhưng không tạo kết quả ML giả để thay
thế mô hình chưa triển khai.

### Task AI-03: Tích hợp DrowsinessState với ML

**Công việc:** - Nhận EAR, MAR, pitch hoặc danh sách đặc trưng phù
hợp. - Kiểm tra dữ liệu trước khi gửi mô hình. - Gọi hàm dự đoán khi mô
hình sẵn sàng. - Tiếp nhận kết quả và xử lý độ tin cậy theo quy tắc đã
thống nhất. - Kết hợp kết quả ML với trạng thái theo thời gian. - Xử lý
trường hợp mô hình chưa sẵn sàng hoặc kết quả không hợp lệ.

**Đầu ra:** DrowsinessState cập nhật trạng thái từ dữ liệu đầu vào và
kết quả dự đoán.

**Kiểm thử:** Dùng dữ liệu hợp lệ, dữ liệu thiếu và kết quả dự đoán
không đủ tin cậy.

### Task AI-04: Xây dựng AlertSys

**Công việc:** - Xác định điều kiện kích hoạt cảnh báo. - Hạn chế cảnh
báo lặp quá thường xuyên. - Xây dựng chức năng kích hoạt và đặt lại cảnh
báo. - Phối hợp hiển thị cảnh báo trên giao diện. - Phối hợp ghi nhận sự
kiện vào SQLite. - Xử lý khi điều kiện cảnh báo không còn đáp ứng.

**Đầu ra:** Module cảnh báo được gọi từ MonitoringController.

**Kiểm thử:** Kiểm tra có cảnh báo, không có cảnh báo, điều kiện kéo dài
và điều kiện kết thúc.

------------------------------------------------------------------------

## Thành viên 5 --- SQLite, lịch sử, kiểm thử tích hợp và tài liệu

### Task DB-01: Chốt Data Model

**Mục tiêu:** Xác định dữ liệu cần lưu trong phiên bản MVP.

Mô hình đề xuất gồm ba thực thể:

-   **MonitoringSession:** Mã phiên, thời điểm bắt đầu, thời điểm kết
    thúc và trạng thái phiên.
-   **SnapshotLog:** Mã bản ghi, mã phiên, thời điểm ghi nhận, EAR, MAR,
    pitch và trạng thái.
-   **AlertEvent:** Mã sự kiện, mã phiên, thời điểm xảy ra, loại cảnh
    báo, mức độ và độ tin cậy nếu có.

**Công việc:** - Xác định khóa chính và khóa ngoại. - Xác định thuộc
tính bắt buộc và thuộc tính có thể để trống. - Thống nhất kiểu dữ liệu
và định dạng thời gian. - Quy định cách xử lý khi không có EAR, MAR hoặc
pitch. - Xác định chính sách lưu trữ và xóa dữ liệu.

**Đầu ra:** ERD và đặc tả các bảng.

### Task DB-02: Tích hợp SQLite với ứng dụng di động

**Công việc:** - Chọn thư viện SQLite tương thích với phiên bản React
Native hoặc dùng lớp native khi cần. - Khởi tạo database. - Tạo bảng theo
ERD. - Xây dựng thao tác tạo phiên. - Ghi nhận bản ghi và sự kiện cảnh
báo. - Truy vấn lịch sử. - Xử lý lỗi lưu dữ liệu và bản ghi không hợp lệ.

**Lưu ý:** Không dùng thư viện SQLite dành cho Python như thể nó tự động
hoạt động trong ứng dụng React Native.

**Đầu ra:** Database hoạt động trên thiết bị và được ứng dụng truy cập.

**Kiểm thử:** Tạo phiên, ghi dữ liệu, đóng ứng dụng, mở lại và kiểm tra
dữ liệu theo chính sách lưu trữ.

### Task DB-03: Tích hợp ghi nhận sự kiện

**Công việc:** - Nhận sự kiện từ MonitoringController và AlertSys. - Gắn
mỗi bản ghi với đúng `session_id`. - Kiểm tra tính hợp lệ trước khi
lưu. - Tránh bản ghi trùng lặp không cần thiết. - Xác định tần suất ghi
SnapshotLog để tránh lưu quá nhiều dữ liệu.

**Đầu ra:** Các phiên, bản ghi và sự kiện có thể truy vấn theo quan hệ
đã thiết kế.

### Task QA-01: Xây dựng kế hoạch kiểm thử

Các nhóm kiểm thử: - Quyền camera và trạng thái camera. - Bắt đầu/dừng
giám sát. - Phát hiện khuôn mặt. - Dữ liệu đặc trưng không hợp lệ. -
Đánh giá trạng thái và tích hợp ML. - Phát cảnh báo. - Lưu và truy vấn
SQLite. - Hiệu năng và lỗi khi chạy lâu.

**Đầu ra:** Danh sách test case có mã, điều kiện đầu vào, bước thực
hiện, kết quả mong đợi và kết quả thực tế.

### Task QA-02: Kiểm thử tích hợp

**Công việc:** - Kiểm tra luồng camera → FaceDetector → trích xuất đặc
trưng → DrowsinessState → AlertSys. - Kiểm tra việc ghi sự kiện vào
SQLite. - Kiểm tra giao diện phản ánh đúng trạng thái. - Kiểm tra lỗi có
được truyền và xử lý phù hợp. - Ghi nhận lỗi, giao cho người phụ trách
và kiểm tra lại sau khi sửa.

**Đầu ra:** Báo cáo kiểm thử tích hợp và danh sách lỗi.

### Task QA-03: Đánh giá hiệu năng và hoàn thiện tài liệu

**Công việc:** - Đo tốc độ xử lý trên thiết bị mục tiêu. - Đo độ trễ từ
khi điều kiện cảnh báo được xác nhận đến khi cảnh báo thực sự phát. -
Theo dõi lỗi camera, tình trạng treo và mức sử dụng tài nguyên nếu có
công cụ đo phù hợp. - Ghi lại thiết bị, phiên bản hệ điều hành và điều
kiện thử nghiệm. - Tổng hợp hướng dẫn cài đặt, hướng dẫn sử dụng, kiến
trúc, ERD và kết quả kiểm thử.

**Đầu ra:** Báo cáo nghiệm thu có số liệu đo thực tế và điều kiện thử
nghiệm.

------------------------------------------------------------------------

# PHẦN III. QUY ƯỚC TÍCH HỢP PYTHON VÀ ỨNG DỤNG DI ĐỘNG

## 1. Ranh giới giữa các môi trường

- **Ứng dụng điện thoại:** React Native + TypeScript, kết hợp Kotlin khi
  cần API Android hoặc xử lý native.
- **Python:** dùng để thử nghiệm thuật toán, chuẩn bị/kiểm tra dữ liệu,
  đánh giá mô hình và tạo kết quả tham chiếu trong quá trình phát triển.
- **Mô hình ML:** chỉ được tích hợp vào app sau khi xác minh định dạng,
  tiền xử lý, đầu vào/đầu ra và runtime trên Android.
- **Không bắt buộc có máy chủ:** ưu tiên xử lý trên thiết bị. Chỉ xây
  dựng backend Python nếu có yêu cầu sản phẩm cụ thể cần xử lý phía máy
  chủ; không truyền video lên máy chủ theo mặc định.

## 2. Hợp đồng dữ liệu giữa các module

Nhóm cần thống nhất trước các cấu trúc dữ liệu tối thiểu:

- `FrameInput`: khung hình hoặc tham chiếu đến khung hình, timestamp và
  thông tin hướng/kích thước cần thiết.
- `FaceLandmarks`: danh sách landmarks cùng trạng thái phát hiện khuôn
  mặt.
- `FeatureVector`: EAR, MAR, pitch và các đặc trưng khác nếu hợp lệ;
  giá trị thiếu phải được đánh dấu rõ, không thay bằng số giả.
- `DrowsinessResult`: trạng thái, độ tin cậy nếu có, timestamp và lý do
  không đủ dữ liệu nếu áp dụng.
- `AlertEvent`: loại cảnh báo, mức độ, timestamp và mã phiên giám sát.

Tên và kiểu dữ liệu cuối cùng có thể điều chỉnh theo triển khai, nhưng
phải được thống nhất và ghi trong tài liệu giao tiếp module.

## 3. Điều kiện trước khi tích hợp

1. Bản Python thử nghiệm có test case và mô tả phụ thuộc.
2. Bản Android có kiểm tra camera và phương án nhận diện đã xác minh.
3. Có kết luận rõ mô hình ML có thể chạy trên điện thoại hay chưa.
4. Có bộ đầu vào thử nghiệm chung để so sánh kết quả giữa các phiên bản.
5. Không coi bản demo bằng video/file mẫu là kiểm chứng đầy đủ cho camera
   thời gian thực trên điện thoại.

---

# PHẦN IV. CÁC GIAI ĐOẠN TRIỂN KHAI

## Giai đoạn 1 --- Chuẩn bị và xác minh công nghệ

Thành viên 1 thiết kế giao diện và khởi tạo ứng dụng React Native.
Thành viên 2 xác minh VisionCamera và camera trên thiết bị thật. Thành
viên 3 kiểm tra code Python hiện có, tạo bản thử nghiệm thuật toán và
xác minh phương án nhận diện trên Android. Thành viên 4 kiểm tra mô hình
ML, khả năng chạy trên thiết bị và logic trạng thái. Thành viên 5 chốt
ERD, lựa chọn phương án SQLite tương thích và lập kế hoạch kiểm thử.

**Điều kiện hoàn thành:** - Ứng dụng React Native chạy trên thiết bị mục
tiêu. - Camera mở được và lấy được khung hình. - Có phương án cụ thể để
tích hợp nhận diện khuôn mặt trên Android. - Code Python hiện có đã được
đánh giá, không mặc định sẽ chạy trực tiếp trong app. - Đã xác định mô
hình ML có thể chạy trên thiết bị hay chưa. - Các thành viên thống nhất
giao diện dữ liệu giữa các module.

## Giai đoạn 2 --- Camera và bộ khung giao diện

Thành viên 1 hoàn thiện giao diện cơ bản. Thành viên 2 hoàn thiện quyền
camera, tiếp nhận khung hình và xử lý vòng đời. Thành viên 3 xây dựng
module nhận diện độc lập. Thành viên 4 xây dựng logic trạng thái bằng dữ
liệu thử. Thành viên 5 tạo database và kiểm tra thao tác lưu/truy vấn.

**Điều kiện hoàn thành:** Người dùng có thể bắt đầu/dừng camera; các
module được kiểm thử độc lập; cấu trúc database đã được tạo.

## Giai đoạn 3 --- Tích hợp nhận diện và đặc trưng

Thành viên 2 phối hợp với thành viên 3 để truyền dữ liệu camera sang
module nhận diện. Thành viên 3 hoàn thiện landmarks và EAR/MAR/pitch.
Thành viên 4 xác định cách nhận dữ liệu và cập nhật trạng thái. Thành
viên 1 hiển thị kết quả nhận diện. Thành viên 5 bổ sung test case cho
các tình huống lỗi.

**Điều kiện hoàn thành:** Luồng camera → phát hiện khuôn mặt → trích
xuất đặc trưng hoạt động và xử lý được trường hợp không có khuôn mặt.

## Giai đoạn 4 --- Đánh giá trạng thái và cảnh báo

Thành viên 4 tích hợp ML nếu khả thi, hoàn thiện DrowsinessState và
AlertSys. Thành viên 1 kết nối trạng thái và cảnh báo với giao diện.
Thành viên 2 xử lý gián đoạn camera. Thành viên 3 kiểm tra độ ổn định
của đặc trưng. Thành viên 5 tích hợp ghi nhận sự kiện.

**Điều kiện hoàn thành:** Hệ thống đi được từ dữ liệu đầu vào đến trạng
thái đánh giá và cảnh báo theo quy tắc đã xác định.

## Giai đoạn 5 --- Tích hợp dữ liệu và kiểm thử toàn hệ thống

Nhóm kết nối các module, sửa lỗi giao tiếp, kiểm tra SQLite và xác minh
trạng thái UI. Thành viên 5 điều phối kiểm thử tích hợp; các thành viên
khác sửa lỗi thuộc module của mình.

**Điều kiện hoàn thành:** Luồng chính hoạt động xuyên suốt và các lỗi
nghiêm trọng được xử lý.

## Giai đoạn 6 --- Kiểm thử thiết bị thật và đóng gói

Nhóm kiểm thử trên thiết bị mục tiêu, đo hiệu năng, hoàn thiện giao
diện, xác minh dữ liệu được lưu đúng và chuẩn bị bản cài đặt thử nghiệm.

**Điều kiện hoàn thành:** Có bản MVP cài đặt được, báo cáo kiểm thử,
hướng dẫn sử dụng và danh sách giới hạn còn tồn tại.

------------------------------------------------------------------------

# PHẦN V. QUY TẮC GIT VÀ PHỐI HỢP NHÓM

## 1. Cấu trúc nhánh

Sử dụng `main` cho phiên bản ổn định và `develop` để tích hợp các module
đang phát triển. Mỗi task được thực hiện trên nhánh riêng, ví dụ:

-   `feature/ui-main-screen`
-   `feature/camera-permission`
-   `feature/face-landmarks`
-   `feature/drowsiness-state`
-   `feature/sqlite-session`
-   `test/integration-camera-ml`

Tên nhánh có thể thay đổi theo quy ước nhóm, nhưng phải rõ ràng và dễ
nhận biết.

## 2. Quy trình làm việc

1.  Nhận task và đọc điều kiện nghiệm thu.
2.  Tạo nhánh từ nhánh tích hợp đã thống nhất.
3.  Phát triển và kiểm thử module độc lập.
4.  Commit với nội dung rõ ràng.
5.  Tạo Pull Request.
6.  Thành viên khác review code và kiểm tra kết quả.
7.  Chỉ merge khi kiểm thử đạt và không làm hỏng chức năng hiện có.

Các module cần được tích hợp thường xuyên để phát hiện sớm vấn đề tương
thích.

## 3. Quy tắc xử lý lỗi

Mỗi lỗi cần có mã lỗi, mô tả, bước tái hiện, kết quả mong đợi, kết quả
thực tế, mức độ nghiêm trọng, người phụ trách và trạng thái xử lý.

Các lỗi khiến ứng dụng không thể mở camera, không thể dừng giám sát hoặc
phát cảnh báo sai cần được ưu tiên xử lý.

------------------------------------------------------------------------

# PHẦN VI. ĐIỀU KIỆN NGHIỆM THU TOÀN DỰ ÁN

Dự án được xem là hoàn thành MVP khi đáp ứng các điều kiện sau:

1.  **Chức năng:** Người dùng có thể bắt đầu/dừng giám sát, camera hoạt
    động và hệ thống xử lý hình ảnh để tạo kết quả đánh giá theo phương
    pháp đã triển khai.
2.  **Xử lý lỗi:** Ứng dụng xử lý được trường hợp từ chối quyền camera,
    không có khuôn mặt, khung hình không hợp lệ và gián đoạn camera mà
    không dừng bất thường.
3.  **Cảnh báo:** Cảnh báo được kích hoạt theo điều kiện đã xác định, có
    thể đặt lại và không lặp vô hạn do lỗi logic.
4.  **Dữ liệu:** Nếu SQLite thuộc phạm vi MVP, phiên giám sát và các sự
    kiện cần thiết được lưu, truy vấn và liên kết đúng.
5.  **Hiệu năng:** Có số liệu đo trên thiết bị cụ thể, ghi rõ điều kiện
    thử nghiệm và không sử dụng kết quả chưa đo làm số liệu chính thức.
6.  **Kiểm thử:** Có test case, kết quả kiểm thử, danh sách lỗi và bằng
    chứng cho các chức năng quan trọng.
7.  **Tài liệu:** Có sơ đồ kiến trúc, Class Diagram, ERD, hướng dẫn cài
    đặt, hướng dẫn sử dụng và mô tả giới hạn của phiên bản.
8.  **Quyền riêng tư:** Nhóm xác định rõ dữ liệu hình ảnh được xử lý ở
    đâu, có lưu khung hình hay không và có truyền dữ liệu ra ngoài thiết
    bị hay không.

------------------------------------------------------------------------

# PHẦN VII. QUẢN LÝ TASK VÀ NGHIỆM THU

Nhóm nên quản lý task trên GitHub Projects hoặc công cụ tương đương với
các trạng thái:

**Backlog → Ready → In Progress → In Review → Testing → Done.**

Một task chỉ được chuyển sang `Done` khi có đủ đầu ra, kiểm thử và
review. Nếu task chưa hoàn thành do phụ thuộc thư viện hoặc mô hình chưa
khả thi, cần ghi rõ trở ngại và phương án thay thế.

Cuối mỗi giai đoạn, nhóm đánh giá các task đã hoàn thành, vấn đề còn tồn
tại, khả năng tích hợp giữa các module và công việc cần ưu tiên tiếp
theo.

**Kết quả cuối cùng mong muốn:** Nhóm có một phiên bản MVP SafetyDriver
chạy trên thiết bị di động mục tiêu, thực hiện luồng giám sát cơ bản, có
cơ chế đánh giá và cảnh báo theo phạm vi đã triển khai, có dữ liệu kiểm
thử thực tế và có tài liệu đủ rõ để tiếp tục phát triển.
