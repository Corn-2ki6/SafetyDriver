# Trạng thái UI và cách UI nhận trạng thái

Tài liệu mô tả đúng mã nguồn hiện tại trên nhánh `test/tv5-vision`. Khi sửa
`App.tsx`, hãy cập nhật tài liệu này.

## 1. Ai giữ trạng thái

`App.tsx` là controller duy nhất. Nó giữ toàn bộ trạng thái bằng `useState` và
truyền xuống màn hình qua **props**. Màn hình không tự đọc camera, vision hay
storage, và không giữ trạng thái giám sát riêng.

```
SafetyDriverCameraView (native, CameraX + MediaPipe)
  │  onFrame / onCameraReady / onCameraError
  ▼
CameraPreview ──► MonitorScreen / AlertScreen ──► App.tsx
                                                   │ parseVisionFrame(frame)        features/vision
                                                   │ DrowsinessTracker.update(...)  features/drowsiness
                                                   │ AlertSys.trigger(...)          features/alerts
                                                   │ saveAlertEvent(...)            storage
                                                   ▼
                                     setState / setMetrics / setFaceFound / setAlertInfo
                                                   │ props
                                                   ▼
                                               màn hình
```

Sự kiện camera đi **lên** qua callback (`onCameraReady`, `onCameraError`,
`onCameraFrame`). Trạng thái đi **xuống** qua props. UI chỉ phụ thuộc vào kiểu
dữ liệu trong `src/types` (`Metrics`, `Settings`, `AlertEvent`) và
`CameraFrameEvent` của module camera.

## 2. Các trạng thái (`AppLifecycleState` trong `App.tsx`)

| Trạng thái | Màn hình | Người dùng thấy |
| --- | --- | --- |
| `idle` | `HomeScreen` | Trang chủ, camera tắt, nút "Bắt đầu giám sát" |
| `starting` | `MonitorScreen` (`starting = true`) | "Đang kết nối camera", nhãn "Đang khởi tạo" |
| `monitoring` | `MonitorScreen` | Xem bảng `faceFound` bên dưới |
| `noFace` | `MonitorScreen` (`faceFound = false`) | Nhãn "Không thấy khuôn mặt", hướng dẫn chỉnh vị trí |
| `alert` | `AlertScreen` | Cảnh báo toàn màn hình, viền đỏ nhấp nháy, **ẩn thanh tab** |
| `error` | `ErrorScreen` | Thông báo lỗi (`errorMessage`), nút "Thử lại" |

Trong `monitoring`, `faceFound` quyết định nhãn trạng thái:

| `faceFound` | Khi nào | Nhãn |
| --- | --- | --- |
| `true` | Frame có `status = 'FACE_DETECTED'` | "Đã nhận diện khuôn mặt" |
| `null` | Chưa có frame, frame `INVALID_LANDMARKS`, hoặc bản web (không phân tích khuôn mặt) | "Đang chờ kết quả nhận diện" |
| `false` | Frame `NO_FACE` (lúc này trạng thái là `noFace`) | "Không thấy khuôn mặt" |

Tab **Lịch sử** và **Cài đặt** không phụ thuộc trạng thái giám sát. Rời tab
Giám sát khi đang giám sát sẽ gọi `stop()` và đưa trạng thái về `idle`.

## 3. Chuyển trạng thái

| Từ | Sự kiện | Sang |
| --- | --- | --- |
| `idle`, `error` | Nhấn bắt đầu / "Thử lại", Android cấp quyền camera | `starting` |
| `idle`, `error` | Android từ chối quyền camera | `error` |
| `starting` | `onCameraReady` | `monitoring` |
| `starting`, `monitoring`, `noFace`, `alert` | `onCameraError`, hoặc frame sai hợp đồng dữ liệu | `error` |
| đang giám sát | Frame cho kết quả `noFace` | `noFace` |
| đang giám sát | Frame cho kết quả `drowsy` | `alert` |
| `alert` | Kết quả `awake` **và** mắt mở liên tục ≥ 3 giây | `monitoring` |
| `monitoring`, `noFace` | Kết quả `awake` hoặc `unknown` | `monitoring` |
| mọi trạng thái đang giám sát | "Dừng giám sát" hoặc đổi tab | `idle` |

Frame đến sau khi đã dừng (`idle`) hoặc đã lỗi (`error`) bị bỏ qua, không khởi
động lại giám sát.

Khi vào `alert` và bật "Lưu lịch sử cảnh báo", `App.tsx` gọi
`AlertSys.trigger` (chống lặp 3 giây cho cùng loại cảnh báo) rồi
`saveAlertEvent`.

## 4. Dữ liệu mỗi màn hình nhận

| Màn hình | Props dữ liệu | Callback |
| --- | --- | --- |
| `HomeScreen` | — | `onStart` |
| `MonitorScreen` | `faceFound`, `starting`, `elapsedSec`, `metrics`, `settings` | `onStop`, `onCameraReady`, `onCameraError`, `onCameraFrame` |
| `AlertScreen` | `metrics`, `settings`, `alertDetail` | `onStop`, `onCameraReady`, `onCameraError`, `onCameraFrame` |
| `ErrorScreen` | `code`, `message`, `at` | `onRetry` |
| `HistoryScreen` | `events` (mới nhất trước) | — |
| `SettingsScreen` | `settings` | `onChange` |

Mọi số đo trong `Metrics` có kiểu `number | null`. `null` nghĩa là thiếu hoặc
không hợp lệ; UI hiển thị "—", không thay bằng số trông hợp lệ.

## 5. Giới hạn hiện tại

- `pitchDeg` (tư thế đầu) luôn là `null`: tracker chưa tính.
- Mã lỗi trên `ErrorScreen` cố định là `CAMERA_UNAVAILABLE`; nguyên nhân thật
  nằm trong `message`.
- Chưa phát âm thanh cảnh báo.
- Bản web chỉ hiện preview camera, không có EAR/MAR.
