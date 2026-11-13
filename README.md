# THANHCONG.BOUTIQUE

Ứng dụng dùng React/Vite ở giao diện, Express ở API và SQL Server để lưu tài khoản. Mật khẩu được mã hóa trước khi lưu.

## Use Case phân quyền

Tài liệu tác nhân, sơ đồ Use Case, ma trận quyền và luồng nghiệp vụ cho khách hàng, nhân viên và admin nằm trong [USECASE_PHAN_QUYEN.md](./USECASE_PHAN_QUYEN.md).

## Cấu hình SQL Server

1. Database phải có schema trong `SQLQuery2.sql`. Script này **xóa và tạo lại** database `thanhcong_boutique`; chỉ chạy khi tạo mới và không có dữ liệu cần giữ.
2. Chạy `SQLQuery5.sql` để thêm cột tên đăng nhập và chỉ mục duy nhất mà API đăng ký/đăng nhập cần. Đây là migration an toàn cho database hiện có.
3. Sao chép `.env.example` thành `.env`. Mặc định, API dùng Windows Authentication với tài khoản Windows đang chạy Node.js:

   ```env
   PORT=3001
   DB_AUTHENTICATION=windows
   DB_SERVER=localhost
   DB_DATABASE=thanhcong_boutique
   DB_ODBC_DRIVER=ODBC Driver 18 for SQL Server
   DB_ENCRYPT=false
   DB_TRUST_SERVER_CERTIFICATE=true
   ```

   Windows cần cài Microsoft ODBC Driver 17 hoặc 18. Nếu dùng SQL Login, đặt `DB_AUTHENTICATION=sql` và tự điền `DB_USER`/`DB_PASSWORD` trong `.env`. Có thể cấu hình `DB_INSTANCE` cho named instance hoặc `DB_PORT` cho cổng TCP. Không đưa thông tin đăng nhập thật vào Git.

## Chạy ứng dụng

```powershell
npm install
npm run dev
```

Lệnh này chạy API ở `http://localhost:3001` và giao diện Vite. Kiểm tra API/SQL Server tại `http://localhost:3001/api/health`; khi kết nối thành công, phản hồi có `status: "ok"`. Sau đó đăng ký trong giao diện; API sẽ lưu tài khoản vào `dbo.nguoi_dung`. Nếu không kết nối được, kiểm tra `.env`, trạng thái SQL Server, quyền tài khoản SQL và đã chạy migration `SQLQuery5.sql`.
