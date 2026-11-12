# Vision — chạy thử phát hiện khuôn mặt / landmarks

Phục vụ CV-01 và CV-03 trong [outline nhóm](../../../Safetydriver%20plan.md).
Đây là prototype Python để thử mô hình và chốt dữ liệu bàn giao cho mobile.
“Nhận diện” trong task này là tìm khuôn mặt và điểm đặc trưng, **không xác thực danh tính**.
Không đưa Python vào ứng dụng React Native; hướng Android ở [báo cáo bàn giao](../../../docs/vision/README.md).

## Chạy trên Windows (PowerShell, Python 3.12 x64)

Mở terminal tại thư mục repository, sau đó:

```powershell
cd mobile-app/python-prototype/vision
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe download_assets.py --sample
.\.venv\Scripts\python.exe run.py --image inputs/portrait.jpg --annotated outputs/portrait-landmarks.png --jsonl outputs/portrait.jsonl
.\.venv\Scripts\python.exe run.py --camera 0 --display
```

Nhấn **Q** trong cửa sổ preview để thoát. Nếu camera 0 không mở được, đóng ứng dụng đang giữ webcam, kiểm tra quyền camera rồi thử `--camera 1`. Prototype không mở được camera iPhone từ xa tự động.

macOS/Linux: tạo môi trường bằng `python3 -m venv .venv`; thay lệnh Python Windows ở trên bằng `.venv/bin/python`.
Cần mạng để tải thư viện/model lần đầu; suy luận sau đó chạy cục bộ. Phiên bản đã kiểm chứng trong [smoke-results.json](../../../docs/vision/smoke-results.json); Windows/webcam vẫn cần xác nhận trên máy thật.

## Video, hướng ảnh và lưu kết quả

```powershell
.\.venv\Scripts\python.exe run.py --video inputs/demo.mp4 --display --jsonl outputs/video.jsonl --max-frames 100
.\.venv\Scripts\python.exe run.py --image inputs/sideways.jpg --rotation 90 --annotated outputs/upright.png
```

`--rotation` là góc quay thuận chiều kim đồng hồ để đưa ảnh đầu vào về đúng chiều. Video prototype giả định FPS cố định; timestamp tính từ số frame/FPS, không phải bộ đọc PTS cho video biến thiên FPS. Camera dùng đồng hồ monotonic theo phiên. Không mirror đầu vào; nếu giao diện mobile mirror preview thì chỉ mirror lớp hiển thị và overlay.

Mặc định không ghi ảnh/video hay tọa độ ra đĩa. `--jsonl` ghi từng kết quả (478 điểm khi có mặt); `--annotated` chỉ dùng cho ảnh. Không commit video/ảnh người dùng hoặc JSON landmarks cá nhân. Model và các thư mục `inputs`, `outputs`, `.venv` đã được bỏ qua bởi Git.

## Kiểm thử

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe smoke_test.py
```

Smoke test thực sự chạy model CPU trên ảnh công khai, ảnh đen, ảnh xoay đã hiệu chỉnh và chuỗi có mặt → mất mặt → có mặt. Kết quả mặc định ở `outputs/smoke-results.json`. Ảnh chân dung công khai tải từ Google chỉ phục vụ smoke test; không phải tập dữ liệu đánh giá độ chính xác trên tài xế.

Từ thư mục `mobile-app`, kiểm thử hợp đồng TypeScript bằng Node 24:

```sh
node --experimental-strip-types --test tests/vision/contract.test.mjs
```

## Giao diện module

`Detector(model, video=False)` có context manager. `detect(frame, timestamp_ms, rotation)` nhận BGR uint8 H×W×3; trả dictionary JSON tương ứng kiểu `FaceLandmarks` ở `src/features/vision/index.ts`.

| Trường | Ý nghĩa |
|---|---|
| `schemaVersion` | 1 |
| `timestampMs` | Thời điểm của frame, giữ nguyên đồng hồ nguồn; VIDEO phải tăng nghiêm ngặt |
| `width`, `height` | Kích thước sau quay đúng chiều |
| `rotationApplied`, `mirrored` | Góc đã áp dụng; inference không mirror |
| `status` | `FACE_DETECTED`, `NO_FACE`, `INVALID_LANDMARKS` |
| `landmarks` | 478 phần tử `{x,y,z}` theo đúng thứ tự model, hoặc `[]` |
| `regions` | Nhóm mắt/miệng/đầu hoặc `null` nếu không có dữ liệu hợp lệ |
| `inferenceMs` | Thời gian gọi model, không phải FPS tổng hoặc xác suất chính xác |

x/y chuẩn hóa theo chiều rộng/cao; z là chiều sâu tương đối, không phải mét. Không ép tọa độ ngoài biên vào [0,1] vì làm sai hình học. Lỗi frame/model/timestamp phát sinh exception và CLI thoát khác 0; không biến lỗi thành `NO_FACE`. Khi mất mặt, xóa landmarks/regions ngay, không giữ kết quả cũ.

Chỉ cấu hình `num_faces=1`: không chứng minh ảnh chỉ có một người, không gán danh tính tài xế, không bảo đảm không chuyển sang hành khách. Cần kiểm thử ROI/chọn tài xế trước tích hợp xe thật.
