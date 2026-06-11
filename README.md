# Coca-Cola Interactive Event Engagement System
Một hệ thống trò chơi tương tác đa nền tảng (Web/Mobile) phục vụ cho chiến dịch Marketing/Event của Coca-Cola, kết hợp giữa Trò chơi sút phạt Penalty 3D và Vòng quay may mắn đồng bộ tồn kho thời gian thực.

Hệ thống được thiết kế theo kiến trúc **Serverless** tối ưu chi phí hạ tầng (Zero-Cost Hosting) bằng cách tận dụng Google Sheets làm Cơ sở dữ liệu và Google Apps Script (GAS) làm Backend API.

---

## 1. Cấu Trúc Dự Án (Project Structure)

Dự án bao gồm 3 phân hệ chính và thư mục cấu hình dùng chung:

*   **`GameApp/`**: Game sút phạt Penalty 3D tương tác. Người chơi vuốt bóng (Flick/Drag) để sút qua thủ môn AI có khả năng nhảy cản phá tự động. (React Native / Expo).
*   **`UserApp/`**: Form đăng ký thông tin khách hàng và Vòng quay may mắn (Lucky Wheel). Tự động lấy tồn kho thực tế tại từng chi nhánh để tính toán tỷ lệ trúng thưởng thời gian thực. (React Native / Expo).
*   **`AdminApp/`**: Trang quản trị (Dashboard) cho phép quản lý nhập/xuất kho quà tặng thời gian thực và khôi phục nhanh hệ thống (Wipe database). (Vanilla HTML / CSS / JS).

---

## 2. Công Nghệ Sử Dụng (Tech Stack)
*   **Frontend**: React Native, Expo SDK, Reanimated (Xử lý Animation), Expo AV (Web Audio API).
*   **Admin Dashboard**: HTML5, Vanilla CSS3, JavaScript ES6.
*   **Backend & DB**: Google Apps Script (RESTful API Endpoint), Google Sheets DB (Tích hợp cơ chế khóa luồng `LockService` xử lý bất đồng bộ tranh chấp ghi/đọc dữ liệu).
*   **Hosting**: Vercel.
