USE master;
GO

/* =========================================================
   1. XÓA DATABASE CŨ NẾU ĐÃ TỒN TẠI
   ========================================================= */

IF DB_ID(N'thanhcong_boutique') IS NOT NULL
BEGIN
    ALTER DATABASE thanhcong_boutique
    SET SINGLE_USER WITH ROLLBACK IMMEDIATE;

    DROP DATABASE thanhcong_boutique;
END
GO

/* =========================================================
   2. TẠO DATABASE MỚI
   ========================================================= */

CREATE DATABASE thanhcong_boutique;
GO

USE thanhcong_boutique;
GO


/* =========================================================
   3. NGƯỜI DÙNG
   Khách hàng / Nhân viên / Admin
   ========================================================= */

CREATE TABLE nguoi_dung (
    ma_nguoi_dung INT IDENTITY(1,1) PRIMARY KEY,

    ho_ten NVARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    mat_khau VARCHAR(255) NOT NULL,

    so_dien_thoai VARCHAR(20),

    dia_chi NVARCHAR(255),

    vai_tro VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',

    ngay_tao DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    ngay_cap_nhat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CK_nguoi_dung_vai_tro
        CHECK (vai_tro IN ('CUSTOMER', 'STAFF', 'ADMIN'))
);
GO


/* =========================================================
   4. DANH MỤC
   ========================================================= */

CREATE TABLE danh_muc (
    ma_danh_muc INT IDENTITY(1,1) PRIMARY KEY,

    ten_danh_muc NVARCHAR(100) NOT NULL UNIQUE,

    mo_ta NVARCHAR(500),

    ngay_tao DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO


/* =========================================================
   5. SẢN PHẨM
   Có mã QR để quét sản phẩm
   ========================================================= */

CREATE TABLE san_pham (
    ma_san_pham INT IDENTITY(1,1) PRIMARY KEY,

    ma_danh_muc INT NOT NULL,

    ten_san_pham NVARCHAR(200) NOT NULL,

    mo_ta NVARCHAR(MAX),

    gia DECIMAL(18,2) NOT NULL,

    so_luong_ton INT NOT NULL DEFAULT 0,

    hinh_anh VARCHAR(500),

    ma_qr VARCHAR(255) UNIQUE,

    trang_thai VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    ngay_tao DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    ngay_cap_nhat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_san_pham_danh_muc
        FOREIGN KEY (ma_danh_muc)
        REFERENCES danh_muc(ma_danh_muc),

    CONSTRAINT CK_san_pham_gia
        CHECK (gia >= 0),

    CONSTRAINT CK_san_pham_so_luong
        CHECK (so_luong_ton >= 0),

    CONSTRAINT CK_san_pham_trang_thai
        CHECK (trang_thai IN ('ACTIVE', 'INACTIVE'))
);
GO


/* =========================================================
   6. BIẾN THỂ SẢN PHẨM
   Size / Màu sắc
   ========================================================= */

CREATE TABLE bien_the_san_pham (
    ma_bien_the INT IDENTITY(1,1) PRIMARY KEY,

    ma_san_pham INT NOT NULL,

    kich_thuoc VARCHAR(30),

    mau_sac NVARCHAR(50),

    so_luong INT NOT NULL DEFAULT 0,

    ngay_tao DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_bien_the_san_pham
        FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham)
        ON DELETE CASCADE,

    CONSTRAINT CK_bien_the_so_luong
        CHECK (so_luong >= 0),

    CONSTRAINT UQ_bien_the_san_pham
        UNIQUE (ma_san_pham, kich_thuoc, mau_sac)
);
GO


/* =========================================================
   7. GIỎ HÀNG
   Mỗi người dùng có một giỏ hàng
   ========================================================= */

CREATE TABLE gio_hang (
    ma_gio_hang INT IDENTITY(1,1) PRIMARY KEY,

    ma_nguoi_dung INT NOT NULL,

    ngay_tao DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    ngay_cap_nhat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_gio_hang_nguoi_dung
        FOREIGN KEY (ma_nguoi_dung)
        REFERENCES nguoi_dung(ma_nguoi_dung)
        ON DELETE CASCADE
);
GO


/* =========================================================
   8. CHI TIẾT GIỎ HÀNG
   ========================================================= */

CREATE TABLE chi_tiet_gio_hang (
    ma_chi_tiet_gio_hang INT IDENTITY(1,1) PRIMARY KEY,

    ma_gio_hang INT NOT NULL,

    ma_san_pham INT NOT NULL,

    ma_bien_the INT NULL,

    so_luong INT NOT NULL DEFAULT 1,

    ngay_tao DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_chi_tiet_gio_hang
        FOREIGN KEY (ma_gio_hang)
        REFERENCES gio_hang(ma_gio_hang)
        ON DELETE CASCADE,

    CONSTRAINT FK_chi_tiet_gio_hang_san_pham
        FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham),

    CONSTRAINT FK_chi_tiet_gio_hang_bien_the
        FOREIGN KEY (ma_bien_the)
        REFERENCES bien_the_san_pham(ma_bien_the),

    CONSTRAINT CK_chi_tiet_gio_hang_so_luong
        CHECK (so_luong > 0)
);
GO


/* =========================================================
   9. ĐƠN HÀNG
   Khách hàng đặt hàng
   Nhân viên tiếp nhận và xử lý đơn
   ========================================================= */

CREATE TABLE don_hang (
    ma_don_hang INT IDENTITY(1,1) PRIMARY KEY,

    ma_khach_hang INT NOT NULL,

    ma_nhan_vien INT NULL,

    ma_don_hang_code VARCHAR(30) NOT NULL UNIQUE,

    ten_khach_hang NVARCHAR(100) NOT NULL,

    so_dien_thoai VARCHAR(20) NOT NULL,

    dia_chi_giao_hang NVARCHAR(255) NOT NULL,

    tong_tien DECIMAL(18,2) NOT NULL DEFAULT 0,

    trang_thai_don_hang VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    trang_thai_thanh_toan VARCHAR(30) NOT NULL DEFAULT 'UNPAID',

    ghi_chu NVARCHAR(500),

    ngay_dat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    ngay_cap_nhat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_don_hang_khach_hang
        FOREIGN KEY (ma_khach_hang)
        REFERENCES nguoi_dung(ma_nguoi_dung),

    CONSTRAINT FK_don_hang_nhan_vien
        FOREIGN KEY (ma_nhan_vien)
        REFERENCES nguoi_dung(ma_nguoi_dung)
        ON DELETE SET NULL,

    CONSTRAINT CK_don_hang_tong_tien
        CHECK (tong_tien >= 0),

    CONSTRAINT CK_don_hang_trang_thai
        CHECK (
            trang_thai_don_hang IN (
                'PENDING',
                'CONFIRMED',
                'PROCESSING',
                'SHIPPING',
                'DELIVERED',
                'CANCELLED'
            )
        ),

    CONSTRAINT CK_don_hang_thanh_toan
        CHECK (
            trang_thai_thanh_toan IN (
                'UNPAID',
                'PAID',
                'REFUNDED'
            )
        )
);
GO


/* =========================================================
   10. CHI TIẾT ĐƠN HÀNG
   ========================================================= */

CREATE TABLE chi_tiet_don_hang (
    ma_chi_tiet_don_hang INT IDENTITY(1,1) PRIMARY KEY,

    ma_don_hang INT NOT NULL,

    ma_san_pham INT NOT NULL,

    ma_bien_the INT NULL,

    ten_san_pham NVARCHAR(200) NOT NULL,

    so_luong INT NOT NULL,

    don_gia DECIMAL(18,2) NOT NULL,

    thanh_tien AS (so_luong * don_gia) PERSISTED,

    CONSTRAINT FK_chi_tiet_don_hang
        FOREIGN KEY (ma_don_hang)
        REFERENCES don_hang(ma_don_hang)
        ON DELETE CASCADE,

    CONSTRAINT FK_chi_tiet_don_hang_san_pham
        FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham),

    CONSTRAINT FK_chi_tiet_don_hang_bien_the
        FOREIGN KEY (ma_bien_the)
        REFERENCES bien_the_san_pham(ma_bien_the),

    CONSTRAINT CK_chi_tiet_don_hang_so_luong
        CHECK (so_luong > 0),

    CONSTRAINT CK_chi_tiet_don_hang_don_gia
        CHECK (don_gia >= 0)
);
GO


/* =========================================================
   11. THANH TOÁN
   ========================================================= */

CREATE TABLE thanh_toan (
    ma_thanh_toan INT IDENTITY(1,1) PRIMARY KEY,

    ma_don_hang INT NOT NULL UNIQUE,

    phuong_thuc_thanh_toan VARCHAR(30) NOT NULL,

    so_tien DECIMAL(18,2) NOT NULL,

    ma_giao_dich VARCHAR(100),

    trang_thai VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    ngay_thanh_toan DATETIME2 NULL,

    ngay_tao DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_thanh_toan_don_hang
        FOREIGN KEY (ma_don_hang)
        REFERENCES don_hang(ma_don_hang)
        ON DELETE CASCADE,

    CONSTRAINT CK_thanh_toan_phuong_thuc
        CHECK (
            phuong_thuc_thanh_toan IN (
                'COD',
                'BANK_TRANSFER',
                'VNPAY',
                'MOMO'
            )
        ),

    CONSTRAINT CK_thanh_toan_so_tien
        CHECK (so_tien >= 0),

    CONSTRAINT CK_thanh_toan_trang_thai
        CHECK (
            trang_thai IN (
                'PENDING',
                'SUCCESS',
                'FAILED',
                'REFUNDED'
            )
        )
);
GO


/* =========================================================
   12. THÔNG BÁO
   ========================================================= */

CREATE TABLE thong_bao (
    ma_thong_bao INT IDENTITY(1,1) PRIMARY KEY,

    ma_nguoi_dung INT NOT NULL,

    tieu_de NVARCHAR(200) NOT NULL,

    noi_dung NVARCHAR(1000) NOT NULL,

    loai_thong_bao VARCHAR(30) DEFAULT 'SYSTEM',

    da_doc BIT NOT NULL DEFAULT 0,

    ngay_tao DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_thong_bao_nguoi_dung
        FOREIGN KEY (ma_nguoi_dung)
        REFERENCES nguoi_dung(ma_nguoi_dung)
        ON DELETE CASCADE,

    CONSTRAINT CK_thong_bao_loai
        CHECK (
            loai_thong_bao IN (
                'SYSTEM',
                'ORDER',
                'PAYMENT',
                'PROMOTION'
            )
        )
);
GO


/* =========================================================
   13. ĐÁNH GIÁ SẢN PHẨM
   ========================================================= */

CREATE TABLE danh_gia_san_pham (
    ma_danh_gia INT IDENTITY(1,1) PRIMARY KEY,

    ma_san_pham INT NOT NULL,

    ma_nguoi_dung INT NOT NULL,

    ma_don_hang INT NULL,

    so_sao INT NOT NULL,

    noi_dung NVARCHAR(1000),

    ngay_danh_gia DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_danh_gia_san_pham
        FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham)
        ON DELETE CASCADE,

    CONSTRAINT FK_danh_gia_nguoi_dung
        FOREIGN KEY (ma_nguoi_dung)
        REFERENCES nguoi_dung(ma_nguoi_dung)
        ON DELETE CASCADE,

    CONSTRAINT FK_danh_gia_don_hang
        FOREIGN KEY (ma_don_hang)
        REFERENCES don_hang(ma_don_hang)
        ON DELETE SET NULL,

    CONSTRAINT CK_danh_gia_so_sao
        CHECK (so_sao BETWEEN 1 AND 5),

    CONSTRAINT UQ_nguoi_dung_san_pham
        UNIQUE (ma_nguoi_dung, ma_san_pham)
);
GO


/* =========================================================
   14. LỊCH SỬ TRẠNG THÁI ĐƠN HÀNG
   ========================================================= */

CREATE TABLE lich_su_trang_thai_don_hang (
    ma_lich_su INT IDENTITY(1,1) PRIMARY KEY,

    ma_don_hang INT NOT NULL,

    ma_nguoi_thay_doi INT NULL,

    trang_thai_cu VARCHAR(30),

    trang_thai_moi VARCHAR(30) NOT NULL,

    ghi_chu NVARCHAR(500),

    ngay_thay_doi DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_lich_su_don_hang
        FOREIGN KEY (ma_don_hang)
        REFERENCES don_hang(ma_don_hang)
        ON DELETE CASCADE,

    CONSTRAINT FK_lich_su_nguoi_dung
        FOREIGN KEY (ma_nguoi_thay_doi)
        REFERENCES nguoi_dung(ma_nguoi_dung)
        ON DELETE SET NULL
);
GO


/* =========================================================
   15. ĐỊA CHỈ NGƯỜI DÙNG
   Cho phép khách hàng lưu nhiều địa chỉ
   ========================================================= */

CREATE TABLE dia_chi_nguoi_dung (
    ma_dia_chi INT IDENTITY(1,1) PRIMARY KEY,

    ma_nguoi_dung INT NOT NULL,

    ten_nguoi_nhan NVARCHAR(100) NOT NULL,

    so_dien_thoai VARCHAR(20) NOT NULL,

    dia_chi NVARCHAR(255) NOT NULL,

    mac_dinh BIT NOT NULL DEFAULT 0,

    ngay_tao DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_dia_chi_nguoi_dung
        FOREIGN KEY (ma_nguoi_dung)
        REFERENCES nguoi_dung(ma_nguoi_dung)
        ON DELETE CASCADE
);
GO


/* =========================================================
   16. INDEX
   Tăng tốc tìm kiếm và JOIN
   ========================================================= */

CREATE INDEX IX_san_pham_danh_muc
ON san_pham(ma_danh_muc);
GO

CREATE INDEX IX_san_pham_ten
ON san_pham(ten_san_pham);
GO

CREATE INDEX IX_bien_the_san_pham
ON bien_the_san_pham(ma_san_pham);
GO

CREATE INDEX IX_chi_tiet_gio_hang_gio
ON chi_tiet_gio_hang(ma_gio_hang);
GO

CREATE INDEX IX_don_hang_khach_hang
ON don_hang(ma_khach_hang);
GO

CREATE INDEX IX_don_hang_nhan_vien
ON don_hang(ma_nhan_vien);
GO

CREATE INDEX IX_don_hang_trang_thai
ON don_hang(trang_thai_don_hang);
GO

CREATE INDEX IX_don_hang_ngay_dat
ON don_hang(ngay_dat);
GO

CREATE INDEX IX_chi_tiet_don_hang_don
ON chi_tiet_don_hang(ma_don_hang);
GO

CREATE INDEX IX_chi_tiet_don_hang_san_pham
ON chi_tiet_don_hang(ma_san_pham);
GO

CREATE INDEX IX_thong_bao_nguoi_dung
ON thong_bao(ma_nguoi_dung);
GO

CREATE INDEX IX_thong_bao_da_doc
ON thong_bao(ma_nguoi_dung, da_doc);
GO


/* =========================================================
   17. MỖI NGƯỜI DÙNG CHỈ CÓ 1 GIỎ HÀNG
   ========================================================= */

CREATE UNIQUE INDEX UX_gio_hang_nguoi_dung
ON gio_hang(ma_nguoi_dung);
GO


/* =========================================================
   18. DỮ LIỆU DANH MỤC MẪU
   ========================================================= */

INSERT INTO danh_muc
(
    ten_danh_muc,
    mo_ta
)
VALUES
(N'Áo thun', N'Các loại áo thun'),
(N'Áo Polo', N'Các loại áo polo'),
(N'Áo sơ mi', N'Các loại áo sơ mi'),
(N'Quần Jeans', N'Các loại quần jeans'),
(N'Giày', N'Các loại giày'),
(N'Khác', N'Sản phẩm khác');
GO


/* =========================================================
   19. TÀI KHOẢN ADMIN MẪU
   LƯU Ý:
   Khi làm Spring Boot nên mã hóa mật khẩu bằng BCrypt.
   ========================================================= */

INSERT INTO nguoi_dung
(
    ho_ten,
    email,
    mat_khau,
    so_dien_thoai,
    dia_chi,
    vai_tro
)
VALUES
(
    N'Quản trị viên',
    'admin@thanhcong.boutique',
    'CHANGE_THIS_PASSWORD',
    NULL,
    NULL,
    'ADMIN'
);
GO


/* =========================================================
   20. KIỂM TRA TOÀN BỘ BẢNG
   ========================================================= */

SELECT
    TABLE_NAME AS Ten_Bang
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO


/* =========================================================
   21. KIỂM TRA CÁC KHÓA NGOẠI
   ========================================================= */

SELECT
    fk.name AS Ten_Khoa_Ngoai,
    OBJECT_NAME(fk.parent_object_id) AS Bang_Con,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS Cot_Bang_Con,
    OBJECT_NAME(fk.referenced_object_id) AS Bang_Cha,
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS Cot_Bang_Cha
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fc
    ON fk.object_id = fc.constraint_object_id
ORDER BY Bang_Con;
GO