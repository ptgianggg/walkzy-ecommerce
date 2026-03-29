# Walkzy – Nền tảng mua sắm thời trang & phụ kiện trực tuyến Fullstack

## Giới thiệu

Walkzy là một nền tảng thương mại điện tử chuyên cung cấp thời trang và phụ kiện, được xây dựng với kiến trúc hiện đại, hỗ trợ đa nền tảng bao gồm Web và Mobile. Dự án được thiết kế để cung cấp trải nghiệm mua sắm liền mạch, bảo mật và hiệu quả cho người dùng yêu thích thời trang.

He thong bao gom:

- Backend: Node.js, Express, Mongoose.
- Frontend (Web): React.js.
- Mobile (App): React Native (Expo).
- Database: MongoDB.

## Các Tính Năng Chính Của Hệ Thống Walkzy

1. Hệ Thống Người Dùng & Bảo Mật
   - Xác thực đa phương thức: Đăng ký, đăng nhập hệ thống và tích hợp Google OAuth 2.0.
   - Phân quyền nâng cao (RBAC): Quản lý vai trò (Admin, Staff, User) và chi tiết các quyền hạn truy cập (Permissions).
   - Quản lý tài khoản: Cập nhật thông tin cá nhân, thay đổi ảnh đại diện và quản lý địa chỉ nhận hàng.
2. Quản Lý Sản Phẩm & Mua Sắm
   - Danh mục đa tầng: Phân loại theo Category, Model, Brand và Collection.
   - Thuộc tính biến thể: Quản lý sản phẩm theo kích thước (Size), màu sắc (Color) và các thuộc tính tùy chỉnh khác.
   - Tìm kiếm thông minh: Tìm kiếm sản phẩm theo tên sử dụng thuật toán so sánh chuỗi (String Similarity).
   - Hệ thống đánh giá: Người dùng có thể đánh giá (Review) và chấm điểm sao cho sản phẩm.
   - Danh sách yêu thích (Wishlist): Lưu trữ sản phẩm yêu thích để xem lại sau.
   - Thông báo khi có hàng: Người dùng có thể đăng ký nhận tin khi sản phẩm hết hàng được nhập về.
3. Quy Trình Đơn Hàng & Thanh Toán
   - Giỏ hàng trực tuyến: Thêm/sửa/xóa sản phẩm, tự động tính toán giá trị đơn hàng.
   - Thanh toán đa nền tảng: Tích hợp cổng thanh toán quốc tế PayPal và ví điện tử MoMo.
   - Quản lý mã giảm giá: Áp dụng Voucher giảm giá trực tiếp và Voucher vận chuyển (Shipping Voucher).
   - Vận chuyển thông minh: Tích hợp các đơn vị vận chuyển, tính phí ship tự động và theo dõi trạng thái đơn hàng (Tracking).
4. Tương Tác & Chăm Sóc Khách Hàng
   - Chat thời gian thực: Hệ thống Chat trực tiếp giữa khách hàng và Admin thông qua Socket.io.
   - Yêu cầu hỗ trợ (Support Request): Khách hàng có thể gửi yêu cầu hỗ trợ và nhận phản hồi từ hệ thống.
   - Hệ thống trả lời nhanh: Admin có thể sử dụng các câu trả lời mẫu (Canned Replies) để hỗ trợ khách hàng nhanh hơn.
   - Thông báo (Notification): Gửi thông báo tự động về trạng thái đơn hàng hoặc các chương trình khuyến mãi.
5. Quản Trị Kho & Nhà Cung Cấp (Hệ Thống ERP thu nhỏ)
   - Quản lý kho hàng (Warehouse): Theo dõi tồn kho thực tế, vị trí lưu kho.
   - Nhập hàng (Purchase Order): Lập phiếu nhập hàng từ các nhà cung cấp (Supplier).
   - Lịch sử kho: Ghi lại mọi biến động nhập/xuất hàng hóa để tránh thất thoát.
6. Marketing & Báo Cáo (Analytics)
   - Flash Sale & Khuyến mãi: Tạo các chiến dịch giảm giá theo thời gian.
   - Quản lý Banner: Thay đổi hình ảnh quảng bá trên Website một cách linh hoạt.
   - Phân tích dữ liệu: Tổng hợp doanh thu, thống kê đơn hàng và biểu đồ tăng trưởng (Analytics Dashboard).
7. Tính Năng Khác
   - Tích hợp Bản đồ: Hiển thị vị trí hoặc demo bản đồ trong hệ thống.
   - Xuất dữ liệu: Hỗ trợ xuất danh sách, hóa đơn ra file Excel.
   - Tích hợp AI: Sử dụng Google Gemini API để tư vấn sản phẩm, so sánh giá và hỗ trợ khách hàng thông minh.

## Kiến trúc hệ thống

Mô hình hoạt động:
`Frontend (Web/Mobile) <---> RESTful API (Backend) <---> Database (MongoDB)`

Tất cả các giao tiếp giữa client và server đều được bảo mật thông qua JSON Web Token (JWT).

## Cách chạy project

### Backend

1. Di chuyển vào thư mục backend: `cd Backend`
2. Cài đặt thư viện: `npm install`
3. Cấu hình file `.env` (Tham khảo `.env.example` nếu có)
4. Chạy server: `npm start`
   - Server mặc định sẽ chạy tại: `http://localhost:3001`

### Frontend

1. Di chuyển vào thư mục frontend: `cd Frontend`
2. Cài đặt thư viện: `npm install`
3. Chạy ứng dụng: `npm start`
   - Ứng dụng mặc định sẽ chạy tại: `http://localhost:3000`

### Mobile App

1. Di chuyển vào thư mục mobile: `cd MobileApp`
2. Cài đặt thư viện: `npm install`
3. Chạy ứng dụng: `npx expo start`
