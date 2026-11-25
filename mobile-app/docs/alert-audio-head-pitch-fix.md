# SafetyDriver — Fix cảnh báo âm thanh và pitch/gục đầu (Android)

## Phạm vi thay đổi

Bản sửa dành cho **Android native build** của SafetyDriver, không thêm Python vào runtime và không thêm backend.

- **Âm thanh:** `SafetyDriverCameraModule.kt` tạo tiếng bíp cảnh báo lặp lại bằng `ToneGenerator` trên Android (`STREAM_ALARM`), không yêu cầu asset WAV hay `expo-av` (không tương thích Expo SDK 58). `App.tsx` gọi module khi trạng thái thành `alert`, dừng khi về `monitoring`/`idle`/`error`, tắt tiếng, đóng ứng dụng hoặc xuống nền. Tôn trọng `settings.volume`. `AlertScreen` không nói là đang phát âm thanh trên nền tảng không hỗ trợ.
- **Pitch:** Kotlin bật `outputFacialTransformationMatrixes`. FloatArray 4x4 dạng column-major được chuyển sang mảng lồng row-major trước khi gửi qua JS. `CameraFrameEvent.poseMatrix` là tùy chọn; dữ liệu không hợp lệ được giữ `null`. `parseVisionFrame` chỉ chuyển dữ liệu ma trận có 4 hàng 4 cột hữu hạn.
- **Drowsiness:** `DrowsinessTracker` dùng lại `extractFeatures` tính EAR, MAR và pitch; thiếu pose sẽ không tạo pitch giả. Bộ phát hiện cúi đầu dùng góc pitch so với mốc trung tính đầu phiên và yêu cầu duy trì theo thời gian. `evaluateDrowsiness` trả `alertKind: 'headNod'` riêng, không nhầm với ngáp/nhắm mắt.
- **Lịch sử:** `AlertSys` và `AlertStorage` đã hỗ trợ `headNod`; không thay cấu trúc lưu trữ.

## Quy tắc gục đầu hiện tại — CẦN XÁC MINH THỰC NGHIỆM

1. Bắt đầu giám sát khi nhìn thẳng và giữ đầu ổn định **ít nhất 800 ms / 4 khung hình** để thiết lập góc trung tính của phiên.
2. Góc pitch so với mốc trung tính theo **chiều âm** giảm **ít nhất 18°**, duy trì **ít nhất 800 ms** sau khi hiệu chuẩn thì mới tạo `headNod`.
3. Mất mặt, pose không hợp lệ, sai thứ tự timestamp hoặc gián đoạn khung hình trên 500 ms đặt lại bộ tích lũy; không giữ pitch cũ.
4. Dấu hiệu mắt và ngáp vẫn được đánh giá độc lập. Nếu nhiều dấu hiệu cùng thỏa, ưu tiên loại sự kiện `eyesClosed`, rồi `headNod`, rồi `yawn`.

**Cảnh báo:** Quy ước hướng âm/dương và các ngưỡng 18°/800 ms là bản thử nghiệm, **chưa được hiệu chỉnh trên điện thoại thật**. Nếu thử cúi đầu mà pitch lại tăng, phải xác minh ma trận và đổi dấu chiều nhận diện trước nghiệm thu. Không dùng độ lớn tuyệt đối của pitch hoặc `Math.abs(pitch)` để kết luận ngủ gật.

## Kiểm tra tự động

Tại `mobile-app`:

```powershell
npm ci
npm run check
```

`npm run check` thực hiện TypeScript strict, kiểm thử Vision và các test trạng thái TV4, bao gồm cúi/ngẩng, thiếu pose, gián đoạn và ưu tiên loại cảnh báo.

Để chạy Android (bắt buộc do có thay đổi Kotlin):

```powershell
npm run android
```

**Không dùng Expo Go hoặc web để kiểm thử âm thanh native hoặc pitch từ camera**. Build lại APK sau khi cập nhật nhánh.

## Checklist nghiệm thu thủ công (thực hiện khi đỗ xe, không thử lúc lái)

- [ ] Cấp quyền camera, quan sát EAR/MAR/pitch; góc pitch hiển thị giá trị thực thay vì luôn `—`.
- [ ] Nhìn thẳng khoảng 1 giây sau khi bắt đầu; cúi đầu chậm và giữ, quan sát **chiều dấu pitch**. Nếu sai dấu, chặn nghiệm thu đến khi hiệu chỉnh.
- [ ] Cúi đầu đủ 18° so với góc trung tính và giữ >= 800 ms: hiển thị cảnh báo gục đầu; âm báo phát.
- [ ] Ngẩng đầu hoặc cúi thoáng qua: không tạo `headNod` mới.
- [ ] Nhắm mắt đủ thời gian `settings.eyesClosedSec` khi thử nghiệm: âm báo phát cùng cảnh báo trực quan.
- [ ] Dừng giám sát, hồi phục trạng thái, lỗi camera, đổi tab hoặc đưa app xuống nền: âm báo dừng.
- [ ] Đặt âm lượng cài đặt về 0: không phát tiếng và UI báo đã tắt.
- [ ] Đổi âm lượng khi đang cảnh báo: tiếng bíp đổi mức; kiểm tra chế độ im lặng/âm lượng hệ thống trên máy thật.
- [ ] Che khuôn mặt hoặc ngắt camera: pitch thành `—`; không phát cảnh báo gục đầu mới.
- [ ] Kiểm tra lịch sử có event `headNod` khi bật lưu lịch sử; kiểm tra chống ghi trùng.

## Giới hạn nghiệm thu

Bài test tổng hợp và Android compile chỉ chứng minh mã chạy theo hợp đồng/biên dịch. Chúng **không** chứng minh hướng pitch, cường độ tiếng nghe thực, độ chính xác với lái xe, hay ngưỡng phát hiện phù hợp cho mọi thiết bị. Cần ghi model điện thoại, Android version, kết quả đo và video/screenshot kiểm thử riêng tư được đồng ý trước khi đánh dấu `Done`.
