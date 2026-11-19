# Bài nộp Thành viên 3 — Computer Vision

Ngày bàn giao: 19/11/2026. Kiểm thử thực hiện ngày 18/11/2026. Đề tài: SafetyDriver mobile.

## Phạm vi theo yêu cầu nhóm trưởng

| Yêu cầu trong ảnh giao việc | File bàn giao | Kết quả |
|---|---|---|
| Kiểm tra code Python hiện có | Báo cáo kiểm tra bên dưới; `detector.py` | Giữ prototype tách khỏi GUI; bổ sung đặc trưng vào pipeline |
| Xác minh phát hiện khuôn mặt và landmarks | `detector.py`, `smoke_test.py` | Chạy model MediaPipe thật; 478 điểm, mất mặt và tái xuất hiện |
| Xây dựng EAR/MAR/pitch nếu hỗ trợ | `features.py`, `src/features/vision/features.ts` | Hàm độc lập, kiểm thử công thức, ma trận và dữ liệu thiếu |
| Test có mặt, không mặt, thiếu dữ liệu | `tests/test_detector.py`, `tests/test_features.py`, tests Node | Có kiểm thử tự động, JSON bằng chứng |
| Module kiểm thử được và ví dụ đầu vào/đầu ra | [Ví dụ đầu vào](examples/feature-cases.json), [đầu ra](examples/feature-outputs.json) | Có dữ liệu hình học tổng hợp, đáp án tính tay và hướng dẫn tái lập |

Theo `Safetydriver plan.md`, phần này bao phủ prototype CV-01, hợp đồng CV-03, đặc trưng CV-04; CV-02 có bằng chứng API và phương án Android; CV-05 có các phép thử tổng hợp và giới hạn. **Chưa có nghiệm thu runtime Android/iPhone hay so sánh với camera thiết bị thật.** Python là công cụ thử nghiệm/đối chiếu, không phải runtime React Native.

## Kiểm tra mã nguồn trước khi bổ sung

Đã đọc nhánh `feature/vision-landmarks` tại commit `9fe8990` và main `ae338cc`:

- Detector dùng MediaPipe Tasks, giới hạn một mặt, có IMAGE/VIDEO, timestamp và quay ảnh; trả nhóm mắt/miệng/đầu; đã có test mất mặt và dữ liệu sai.
- Còn thiếu hàm tính EAR/MAR/pitch; tính năng xuất ma trận tư thế đang tắt. Đã bật ma trận và bổ sung `features.py` có thể gọi độc lập.
- Giữ nguyên index landmarks, tên `timestampMs`, đầu vào BGR uint8 và chính sách không ghi hình mặc định. `poseMatrix`/`features` là trường bổ sung, `schemaVersion=1` được giữ vì các trường cũ không đổi; TS cho phép producer cũ chưa có hai trường mới.
- DrowsinessState trên main nhận `Metrics` nullable. Bàn giao EAR/MAR/pitch theo đúng tên `ear`, `mar`, `pitchDeg`; chưa nối camera/native hoặc thay đổi luật TV4.
- Không lấy thông tin cá nhân của tài liệu mẫu môn khác. Không commit ảnh/video người dùng, model binary hoặc môi trường ảo.

## Cấu trúc và cách chạy

- [Hướng dẫn Windows chi tiết](../../mobile-app/python-prototype/vision/README.md).
- Python: `mobile-app/python-prototype/vision/`.
- TypeScript: `mobile-app/src/features/vision/`.
- Kiểm thử JS/TS: `mobile-app/tests/vision/`.

Trong thư mục `mobile-app/python-prototype/vision`, dùng Python 3.12:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe download_assets.py --sample
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe smoke_test.py
.\.venv\Scripts\python.exe run.py --image inputs/portrait.jpg --annotated outputs/portrait.png --jsonl outputs/portrait.jsonl
.\.venv\Scripts\python.exe run.py --camera 0 --display
```

Nhấn Q để đóng preview. Trên Linux/macOS dùng `.venv/bin/python`. Có thể chạy video bằng `--video inputs/demo.mp4`; prototype giả định video FPS cố định. Webcam và Windows chưa được truy cập để xác nhận trực tiếp trong lần bàn giao này.

Tại thư mục `mobile-app`, Node 24:

```sh
node --experimental-strip-types --test tests/vision/*.test.mjs
node --experimental-strip-types tests/vision/parity.mjs
```

Lệnh parity dùng `outputs/portrait.jsonl` do Python vừa tạo. Có thể truyền đường dẫn JSONL khác làm đối số đầu tiên. Đây là so sánh công thức trên cùng dữ liệu, không phải chạy model native trên điện thoại.

## Công thức và quy ước

Đầu vào đã quay về đúng chiều, không mirror. x/y chuẩn hóa đổi về pixel `(x*width, y*height)` trước tính khoảng cách Euclid; z không dùng để tính EAR/MAR. Trái/phải theo người được chụp.

| Đặc trưng | Điểm và công thức |
|---|---|
| EAR trái | `p1..p6=[362,385,387,263,373,380]`; `(d(p2,p6)+d(p3,p5))/(2*d(p1,p4))` |
| EAR phải | Cùng công thức với `[33,160,158,133,153,144]` |
| EAR tổng | Trung bình hai mắt, chỉ có khi cả hai EAR hợp lệ |
| MAR | Phiên bản 4 điểm: `d(13,14)/d(61,291)`, độ mở môi trong / chiều rộng miệng |
| Pitch | Từ ma trận MediaPipe canonical→observed, lấy rotation R; quy ước `R=Rz*Ry*Rx`, `pitchDeg=atan2(R[2,1],R[2,2])*180/pi` |

MAR có nhiều định nghĩa. Phiên bản này cố định bốn điểm; **không mặc nhiên dùng lại ngưỡng 0.6 ở Settings hoặc ngưỡng của công thức MAR khác**. TV4 cần hiệu chỉnh ngưỡng trên dữ liệu thực phù hợp. Các ca tổng hợp mở/nhắm mắt kiểm tra toán học, không chứng minh nhận dạng nhắm mắt trên người thật.

Ma trận pose là mảng lồng 4×4 theo hàng. Loại bỏ uniform positive scale; từ chối shear, reflection, scale không đều, NaN/Inf, sai hàng affine, hoặc gimbal lock. `pitchDeg` là góc Rx có dấu theo hệ canonical của model; 0° tương ứng rotation identity. Đây không phải góc đầu đã hiệu chuẩn so với xe. Cần lấy tư thế trung tính và xác minh chiều cúi/ngẩng trên điện thoại trước sử dụng ngưỡng. Native adapter phải chuyển đúng layout, không đưa thẳng mảng column-major vào hàm này.

Không tự dựng mô hình mặt 3D hoặc camera intrinsics giả để làm PnP; phương pháp đã chọn sử dụng đầu ra ma trận được MediaPipe hỗ trợ.

## Hợp đồng đầu ra và dữ liệu thiếu

`Detector.detect(...)` trả metadata frame, `status`, `landmarks`, `regions`, `poseMatrix` và `features`.
`extract_features(points,width,height,matrix)` / `extractFeatures(...)` trả:

```json
{
  "earLeft": null,
  "earRight": null,
  "ear": null,
  "mar": null,
  "pitchDeg": null,
  "issues": ["NO_FACE"]
}
```

- `[]` là không có mặt; `None`/`null`, thiếu 478 điểm, NaN/Inf là `INVALID_LANDMARKS`. Không coi missing là một mặt có số đo 0.
- Mẫu số mắt/miệng ≤ 1e-6 pixel: trường liên quan là `null`. Mắt nhắm thật trong dữ liệu hình học hợp lệ có thể cho EAR=0; khác với dữ liệu thiếu.
- Điểm cần đo ngoài ảnh: vô hiệu nhóm đó, không clamp tọa độ. Thiếu pose vẫn có thể giữ EAR/MAR hợp lệ.
- Mất mặt xóa toàn bộ đặc trưng ngay; không giữ số của frame trước.
- `issues=[]` chỉ nghĩa là hợp lệ về hình học và cấu trúc; **không phải chứng nhận chất lượng ảnh hoặc độ tin cậy của model**.
- Frame sai/model lỗi/timestamp không tăng: exception hoặc mã thoát CLI khác 0; không đổi lỗi thành `NO_FACE`.

Ví dụ tích hợp TV4 sau khi camera/native sẵn sàng:

```ts
const features = extractFeatures(result.landmarks, result.width, result.height, result.poseMatrix);
const metrics = {
  ear: features.ear, mar: features.mar, pitchDeg: features.pitchDeg,
  fps: null, eyesClosedSec: null, eyesOpenSec: null, noFaceSec: null,
};
```

Timer thuộc MonitoringController/TV4, không được lấy EAR một frame để giả lập số giây nhắm mắt. `INVALID_LANDMARKS`/lỗi frame phải báo unknown/error và reset timer; chỉ `NO_FACE` mới là mất mặt. Không đưa `features` trực tiếp vào TV4 như thể đã có đủ timer. TV4 hiện chưa dùng pitch; cần thống nhất trước khi bổ sung luật.

## Bằng chứng kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| Python unittest | 15 tests đạt: 8 detector + 7 feature tests |
| Node tests | 6 tests đạt; có dùng chung bộ đáp án tính tay với Python |
| TypeScript strict | Module Vision kiểm tra bằng TypeScript 6.0.3 đạt |
| Model thật | 7 ca đạt: chân dung, đen, xoay hiệu chỉnh, VIDEO liên tiếp/mất mặt/tái xuất hiện |
| Python ↔ TS | Cùng output model; sai lệch tối đa ghi trong [parity-results.json](parity-results.json), dưới 1e-9 |
| Thư viện | Python 3.12.14, MediaPipe 0.10.32, OpenCV contrib 4.11.0.86, NumPy 2.2.6; pip check đạt |

[smoke-results.json](smoke-results.json) có thời gian chạy, phiên bản, checksum model/ảnh và giá trị đặc trưng thực tế. Ảnh mẫu cho EAR khoảng 0.2044, MAR 0.1737, pitch 3.8938°; đây là đầu ra model trên một ảnh công khai, không có nhãn buồn ngủ và không dùng để kết luận trạng thái tài xế.

## Thử độ bền và giới hạn đã phát hiện

Chạy `python robustness_test.py` sau khi tải ảnh mẫu; xem [robustness-results.json](robustness-results.json).

- Đã quan sát các biến đổi: ánh sáng 20%, tăng sáng bão hòa, che vùng mắt, xoay ảnh 25°.
- Ở lần chạy này cả bốn ảnh vẫn trả mặt và đặc trưng. Trường hợp che mắt vẫn trả EAR: model có thể suy đoán vị trí bị che. Không có nhãn chuẩn để khẳng định số đo đúng.
- Chưa có bộ kiểm định chất lượng/che khuất tự động. Khi biết mặt bị che, thiếu sáng nặng hoặc tracking không tin cậy, pipeline tích hợp phải bỏ feature khỏi đánh giá và yêu cầu điều chỉnh camera; không suy diễn “issues rỗng” thành an toàn.
- Xoay ảnh 2D không thay thế thử người quay đầu 3D. Chưa thử kính, nhiều người, góc yaw lớn, camera trước/sau, nhiệt/pin hoặc độ trễ dài hạn.
- `num_faces=1` không bảo đảm khung hình chỉ có một người và không gán đúng danh tính tài xế. Cần ROI/chiến lược chọn người trước triển khai thật.

## Hướng mobile và phần nghiệm thu tiếp theo

Tài liệu chính thức MediaPipe có Android `FaceLandmarker`, `MPImage`, `LIVE_STREAM` và ma trận tư thế. Dùng Kotlin/native nhận buffer camera, đổi pixel format/stride, quay một lần và chuyển cấu trúc kết quả sang RN; không truyền ảnh base64 qua JS cho mỗi frame. Giữ timestamp monotonic, giới hạn frame đang xử lý, đóng detector khi dừng/background và bỏ callback phiên cũ.

Expo Go không chứa native module MediaPipe tùy chỉnh; cần development/native build. Phiên bản Maven/Gradle và tích hợp VisionCamera phải xác minh bằng build thiết bị, không chọn `latest.release` cho bản nghiệm thu. Không chạy Python trong Expo Go. Overlay phải xử lý scale/crop/mirror tương ứng preview.

Bài nộp này hoàn thành **module prototype và bàn giao đặc trưng theo ảnh giao việc**. Chưa chứng nhận ứng dụng mobile hoạt động hoàn chỉnh hoặc độ chính xác 100%. Nhóm cần kiểm thử Android và đối chiếu camera thực trước nghiệm thu CV-02/CV-05 ở mức thiết bị.

## Nguồn và tài liệu

- [Outline nhóm](../../Safetydriver%20plan.md).
- [MediaPipe Face Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker): model 478 điểm, output transformation matrix.
- [Android sample chính thức](https://github.com/google-ai-edge/mediapipe-samples/tree/main/examples/face_landmarker/android).
- [Expo custom native code](https://docs.expo.dev/workflow/customizing/).
- Model version 1 và ảnh thử công khai: URL/checksum cố định trong `download_assets.py`.
