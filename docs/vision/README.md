# Bàn giao Vision: chạy thử khuôn mặt / landmarks

## Đối chiếu outline và mã nguồn

Căn cứ `Safetydriver plan.md` trên main tại commit `0d22d2b27fab4b078db239d5de0b67037ec2b8cd`, nhiệm vụ thuộc Thành viên 3 — Computer Vision. Trước thay đổi, `mobile-app/src/features/vision` và `python-prototype` chỉ có `.gitkeep`; giao diện mobile dùng dữ liệu mẫu.

| Outline | Bàn giao trong nhánh này | Giới hạn nghiệm thu |
|---|---|---|
| CV-01 — prototype, đầu vào/đầu ra, hướng dẫn chạy | Python module tách khỏi GUI; CLI ảnh/video/webcam; yêu cầu phiên bản; test tái lập | Đã chạy Linux CPU; webcam Windows chưa chạy trực tiếp |
| CV-02 — xác minh hướng MediaPipe Android | Phân tích API chính thức, luồng Kotlin ↔ camera ↔ RN bên dưới | Chưa có native bridge hoặc build/device Android; chưa nghiệm thu runtime mobile |
| CV-03 — chuẩn hóa landmarks | 478 điểm, nhóm mắt/miệng/đầu, trạng thái thiếu dữ liệu; hợp đồng TypeScript và kiểm thử | Nhóm miệng tối thiểu chưa định nghĩa công thức MAR; phải thống nhất ở CV-04 |
| CV-04 — EAR/MAR/pitch | Chỉ cung cấp điểm đầu vào | Chưa triển khai trong task chạy thử này |
| CV-05 — độ bền | Ca mất mặt và xoay đúng chiều | Kính, che mặt, ánh sáng yếu, nhiều người, góc nghiêng cần dữ liệu và thiết bị thực |

Prototype desktop tham khảo không phải runtime mobile. Bản này dùng MediaPipe **Tasks FaceLandmarker**, không phụ thuộc GUI desktop hoặc API `solutions.face_mesh` cũ. Không dùng thông tin cá nhân từ tài liệu mẫu môn khác.

## Kết quả đã chạy

Bằng chứng máy đọc được: [smoke-results.json](smoke-results.json).

- 8 kiểm thử Python: dữ liệu thiếu/NaN, chọn nhóm điểm, quay ảnh, timestamp và đóng tài nguyên: đạt.
- 2 kiểm thử Node/TypeScript: phân biệt mất mặt với dữ liệu sai; nhóm điểm và tránh giữ dữ liệu cũ: đạt.
- 7 ca inference bằng model thật: ảnh chân dung, ảnh đen, ảnh xoay hiệu chỉnh và 4 frame VIDEO có mặt/mất mặt/tái xuất hiện: đạt.
- Kiểm tra TypeScript strict (6.0.3) và `pip check`: đạt. CLI giải mã video MJPG tổng hợp 4 frame, giữ timestamp 0/100/200/300 ms và trả mã lỗi 1 với ảnh không đọc được: đạt.
- Ảnh có mặt trả 478 điểm; ảnh đen trả `NO_FACE`, `[]`, `null`.

Đây là kiểm thử chức năng trên một ảnh công khai và dữ liệu tổng hợp, không phải “độ chính xác 100%”, không đại diện giao thông, Android hoặc cảnh báo buồn ngủ. Thời gian inference trong JSON chỉ mô tả lần chạy CPU đó.

## Các nhóm điểm bàn giao

Trái/phải theo phía người được chụp, đầu vào không mirror. Index bắt đầu từ 0.

| Nhóm | Index theo thứ tự | Sử dụng dự kiến |
|---|---|---|
| Mắt trái | 362, 385, 387, 263, 373, 380 | Hai khóe và hai cặp mí; làm đầu vào EAR |
| Mắt phải | 33, 160, 158, 133, 153, 144 | Tương tự |
| Miệng | 61, 13, 291, 14 | Khóe, tâm môi trong trên, khóe, tâm môi trong dưới |
| Đầu | 1, 152, 33, 263, 61, 291 | Mũi, cằm, khóe mắt, khóe miệng; anchor cho bước pose |

EAR/MAR phải dùng tọa độ pixel hoặc hiệu chỉnh tỉ lệ width/height trước tính khoảng cách; không tính trực tiếp x/y chuẩn hóa khi ảnh không vuông. Anchor không tự cho ra pitch: còn cần mô hình 3D tương ứng, camera intrinsics và quy ước trục. Không thay pitch thiếu bằng 0. Không dùng blendshape hoặc thời gian inference làm độ tin cậy buồn ngủ.

## Hướng tích hợp mobile (CV-02)

Outline chọn React Native + TypeScript, VisionCamera và Kotlin/MediaPipe Android. Tài liệu MediaPipe xác nhận Android hỗ trợ `FaceLandmarker`, `MPImage`, chế độ `LIVE_STREAM`, listener kết quả/lỗi và timestamp tăng dần. Đây là bằng chứng API khả thi, chưa là bằng chứng build thành công trên Expo/RN của repo.

Luồng đề xuất để TV2/TV3 thống nhất:

1. Camera cấp `FrameInput` đã được TV2 đề xuất tại nhánh `feature/camera-permission`: `timestampMs`, `width`, `height`, `orientation`, `pixelFormat`, `handle`. Giữ frame ở native, không đưa byte ảnh qua JS.
2. Adapter Kotlin đọc buffer theo pixel format/stride thực tế, đổi YUV→RGB nếu cần, đưa về đúng chiều **một lần** và không mirror inference. Quản lý vòng đời frame đúng API camera; không giữ buffer sau khi chủ sở hữu giải phóng.
3. Dùng MediaPipe Tasks Android và model version 1 có checksum như prototype. Chọn CPU trước để xác minh; GPU là bước đo/đánh giá sau. Phiên bản Maven, Gradle, minSdk và tương thích RN/Expo cần chốt bằng build thật, không dùng `latest.release` cho bản nghiệm thu.
4. Một detector cho một phiên, `LIVE_STREAM` với kết quả bất đồng bộ; timestamp cùng đồng hồ nguồn và tăng nghiêm ngặt. Chỉ một frame đang xử lý hoặc chính sách bỏ frame khi bận; không xếp hàng tăng độ trễ. Đóng detector khi dừng/background và bỏ callback của phiên cũ.
5. Trả cấu trúc `FaceLandmarks` trong `src/features/vision/index.ts`. Empty landmarks là `NO_FACE`; dữ liệu không đủ 478/không hữu hạn là `INVALID_LANDMARKS`. Lỗi native phải đi qua kênh lỗi riêng và dừng/reset pipeline, không giả lập mất mặt.
6. UI scale/crop tọa độ theo preview; mirror overlay chỉ khi preview mirror. TV4 nhận landmarks hợp lệ hoặc mất dữ liệu để reset timer; chưa thay số liệu mẫu bằng dữ liệu giả có vẻ thật.

`main` hiện là Expo UI; Expo Go không chứa native MediaPipe module tùy chỉnh. Cần development build/native Android và cài thư viện vào build. Không chạy Python bên trong Expo Go, không lấy việc demo Python thành công để kết luận mobile đã hoạt động. iOS là nhánh tích hợp riêng; phần bàn giao này không chứng nhận iPhone.

Không cherry-pick nguyên nhánh Camera vào đây vì nhánh đó còn độc lập; hợp đồng Vision bổ sung metadata đầu ra, giữ tên `timestampMs` và đơn vị phù hợp TV2. Cần thống nhất `orientation` là góc quay để đưa frame về đúng chiều và xử lý camera trước/sau trước khi nối thật.

## Kịch bản demo để nộp nhóm trưởng

1. Chạy ảnh mẫu theo [hướng dẫn](../../mobile-app/python-prototype/vision/README.md): màn hình/ảnh kết quả có `FACE_DETECTED` và 478 điểm.
2. Chạy webcam với `--display`: mặt ở giữa, quay nhẹ; đưa mặt ra khỏi khung rồi trở lại. Ghi nhận mất mặt không còn điểm cũ. Chỉ ghi hình khi người xuất hiện đồng ý.
3. Chạy tests và `smoke_test.py`; nộp mã nguồn, JSON kết quả, ảnh chụp màn hình demo của chính mình nếu cần.
4. Báo cáo: “Đã chạy thử phát hiện mặt/landmarks bằng MediaPipe, chuẩn hóa đầu ra cho mobile. Chưa nghiệm thu trên Android và chưa triển khai kết luận buồn ngủ.”

## Các ca còn phải chạy trên thiết bị

| Ca | Tiêu chí cần ghi nhận |
|---|---|
| Android camera trước, dọc/ngang | Overlay đúng vị trí, đúng bên mắt, không quay/mirror hai lần |
| Mất mặt 3 giây rồi quay lại | Dữ liệu và timer cũ được xóa; bắt lại mặt đúng |
| Kính, che mắt/miệng, thiếu sáng, nghiêng đầu | Không coi điểm suy đoán là đo lường đáng tin; cần quy tắc chất lượng bổ sung |
| Hai người trong khung | Không chuyển nhầm hành khách; chốt vùng tài xế/chiến lược chọn mặt |
| Background/foreground, từ chối quyền | Dừng tài nguyên, không callback cũ; thông báo lỗi phù hợp |
| Phiên 10–15 phút | Đo FPS đầu-cuối, p50/p95 latency, frame drop, bộ nhớ, nhiệt và pin trên máy cụ thể |

## Nguồn kỹ thuật

- [Outline của nhóm](../../Safetydriver%20plan.md).
- [MediaPipe Face Landmarker, Python và Android](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker).
- [Mã mẫu Android chính thức](https://github.com/google-ai-edge/mediapipe-samples/tree/main/examples/face_landmarker/android).
- [Expo: thêm native code](https://docs.expo.dev/workflow/customizing/).
- Model và ảnh smoke-test: URL + SHA256 được cố định trong `download_assets.py`; tải riêng, không commit binary hay ảnh chân dung.
