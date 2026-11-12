# Module Camera (TV2) — CAM-01 → CAM-04

## Đã có trong thư mục này
| File | Vai trò |
|---|---|
| `CameraManager.ts` | Quyền camera, bắt đầu/dừng, nhận frame, lỗi, vòng đời (nền/tiền cảnh) |
| `CameraPlatform.ts` | Interface adapter mỏng bọc thư viện camera thật (VisionCamera/Kotlin) |
| `frameValidation.ts` | Kiểm tra frame, bỏ frame lỗi, không thay bằng giá trị giả |
| `../../types/camera.ts` | Kiểu dữ liệu dùng chung (`FrameInput`, `CameraState`, `CameraError`…) — cần cả nhóm đồng ý |

**Chưa có:** adapter `VisionCameraPlatform` chạy trên điện thoại thật. Chỉ viết sau khi
hoàn thành CAM-01 (xác minh phiên bản React Native + VisionCamera trên máy thật), vì dự án
chưa khởi tạo app React Native.

## Quy tắc đã chọn (cần TV1/TV5 xác nhận)
- Lỗi camera/quyền → `status = 'error'`, **không tự khởi động lại**; người dùng bấm Bắt đầu lại.
- Xuống nền → giải phóng camera (`paused`); về tiền cảnh → tự mở lại nếu trước đó đang giám sát.
- Frame đến khi handler còn bận → bỏ frame (đếm trong `getStats().droppedBusy`).
- `FrameInput.handle` là tham chiếu frame gốc, không copy sang JS.

## Cách dùng (cho TV1 / TV3)
```ts
const camera = new CameraManager(platform);
camera.subscribe((s) => /* cập nhật UI theo s.status, s.error */);
camera.setFrameHandler((frame) => faceDetector.process(frame)); // TV3
await camera.start();   // nút Bắt đầu
await camera.stop();    // nút Dừng
// AppState: 'active' -> camera.onForeground(), ngược lại -> camera.onBackground()
```

## Checklist kiểm tra trên điện thoại thật (ghi kết quả vào báo cáo CAM-01)
Thiết bị: ______ | Android: ____ | RN: ____ | VisionCamera: ____

- [ ] Lần đầu mở: hiện hộp thoại xin quyền; **Cho phép** → camera chạy
- [ ] **Từ chối** → hiện thông báo, camera không mở
- [ ] **Từ chối vĩnh viễn** → có hướng dẫn mở Cài đặt
- [ ] Bấm **Dừng** → đèn camera tắt trong ≤ 1 giây (NFR-06)
- [ ] Bắt đầu → Dừng → Bắt đầu lại 10 lần, không treo/rò camera
- [ ] Mở app khác dùng camera (VD: Camera hệ thống) → app báo lỗi rõ ràng, không crash
- [ ] Xuống nền (Home) rồi quay lại → camera giải phóng rồi tự mở lại
- [ ] Khoá màn hình rồi mở lại
- [ ] Xoay màn hình/đổi hướng → `orientation` đúng
- [ ] Đo FPS thật khi chỉ nhận frame (mục tiêu ≥ 15 FPS, NFR-01): ____ FPS
- [ ] Chạy liên tục 30 phút không treo/thoát (NFR-02): ____
- [ ] Ghi lại giới hạn thiết bị/hệ điều hành/thư viện: ____
