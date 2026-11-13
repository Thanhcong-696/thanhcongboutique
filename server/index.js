import "dotenv/config";
import process from "node:process";
import express from "express";
import sqlLoginDriver from "mssql";
import windowsAuthDriver from "mssql/msnodesqlv8.js";
import bcrypt from "bcryptjs";

const app = express();
const port = Number(process.env.PORT || 3001);
const usesWindowsAuthentication = process.env.DB_AUTHENTICATION === "windows";
const sql = usesWindowsAuthentication ? windowsAuthDriver : sqlLoginDriver;
const instanceName = process.env.DB_INSTANCE?.trim();
const server = process.env.DB_SERVER || "localhost";
const database = process.env.DB_DATABASE || "thanhcong_boutique";
const connectionConfig = {
  ...(!usesWindowsAuthentication
    ? { user: process.env.DB_USER, password: process.env.DB_PASSWORD }
    : {}),
  server,
  database,
  ...(instanceName
    ? {}
    : !usesWindowsAuthentication || process.env.DB_PORT
      ? { port: Number(process.env.DB_PORT || 1433) }
      : {}),
  ...(usesWindowsAuthentication ? { driver: "msnodesqlv8" } : {}),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== "false",
    ...(instanceName ? { instanceName } : {}),
    ...(usesWindowsAuthentication ? { trustedConnection: true } : {}),
  },
  pool: { min: 0, max: 10, idleTimeoutMillis: 30000 },
};

if (usesWindowsAuthentication) {
  const instanceAddress = instanceName
    ? `${server}\\${instanceName}`
    : process.env.DB_PORT
      ? `${server},${Number(process.env.DB_PORT)}`
      : server;
  const odbcValue = value => `{${String(value).replace(/}/g, "}}")}}`;
  connectionConfig.connectionString = [
    `Driver=${odbcValue(process.env.DB_ODBC_DRIVER || "ODBC Driver 18 for SQL Server")}`,
    `Server=${odbcValue(instanceAddress)}`,
    `Database=${odbcValue(database)}`,
    "Trusted_Connection=Yes",
    `Encrypt=${process.env.DB_ENCRYPT === "true" ? "Yes" : "No"}`,
    `TrustServerCertificate=${process.env.DB_TRUST_SERVER_CERTIFICATE === "false" ? "No" : "Yes"}`,
  ].join(";");
}

const poolPromise = sql.connect(connectionConfig);

app.use(express.json({ limit: "1mb" }));

function publicUser(row) {
  return {
    id: row.ma_nguoi_dung,
    username: row.ten_dang_nhap,
    email: row.email,
    role: String(row.vai_tro).toLowerCase(),
    name: row.ho_ten,
    address: row.dia_chi || "",
    phone: row.so_dien_thoai || "",
  };
}

app.get("/api/health", async (_req, res) => {
  try {
    await poolPromise;
    res.json({ status: "ok", database: process.env.DB_DATABASE || "thanhcong_boutique" });
  } catch (error) {
    console.error("SQL Server connection failed:", error.message);
    res.status(503).json({ message: "Không kết nối được SQL Server. Hãy kiểm tra cấu hình .env và chạy migration SQLQuery5.sql." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const username = String(req.body.username || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!username || !email || !password) return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin." });
  if (username.length > 50) return res.status(400).json({ message: "Tên tài khoản tối đa 50 ký tự." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) return res.status(400).json({ message: "Email không hợp lệ." });
  if (password.length < 6) return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });

  try {
    const pool = await poolPromise;
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.request()
      .input("username", sql.NVarChar(50), username)
      .input("email", sql.VarChar(150), email)
      .input("name", sql.NVarChar(100), username)
      .input("password", sql.VarChar(255), passwordHash)
      .query(`
        INSERT INTO dbo.nguoi_dung (ten_dang_nhap, ho_ten, email, mat_khau, vai_tro)
        OUTPUT INSERTED.ma_nguoi_dung, INSERTED.ten_dang_nhap, INSERTED.ho_ten,
               INSERTED.email, INSERTED.vai_tro, INSERTED.dia_chi, INSERTED.so_dien_thoai
        VALUES (@username, @name, @email, @password, 'CUSTOMER');
      `);
    return res.status(201).json(publicUser(result.recordset[0]));
  } catch (error) {
    if (error.number === 2601 || error.number === 2627) {
      return res.status(409).json({ message: "Tên tài khoản hoặc email đã tồn tại." });
    }
    console.error("Registration failed:", error.message);
    return res.status(500).json({ message: "Không thể lưu tài khoản. Hãy kiểm tra SQL Server và migration SQLQuery5.sql." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  if (!username || !password) return res.status(400).json({ message: "Vui lòng nhập tài khoản và mật khẩu." });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("identifier", sql.NVarChar(150), username)
      .query(`
        SELECT TOP (1) ma_nguoi_dung, ten_dang_nhap, ho_ten, email, mat_khau,
               vai_tro, dia_chi, so_dien_thoai
        FROM dbo.nguoi_dung
        WHERE LOWER(ten_dang_nhap) = LOWER(@identifier)
           OR LOWER(email) = LOWER(@identifier);
      `);
    const row = result.recordset[0];
    if (!row || !(await bcrypt.compare(password, row.mat_khau))) {
      return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không đúng." });
    }
    return res.json(publicUser(row));
  } catch (error) {
    console.error("Login failed:", error.message);
    return res.status(503).json({ message: "Không thể đăng nhập qua SQL Server. Hãy kiểm tra cấu hình kết nối." });
  }
});

app.post("/api/auth/change-password", async (req, res) => {
  const username = String(req.body.username || "").trim();
  const oldPassword = String(req.body.oldPassword || "");
  const newPassword = String(req.body.newPassword || "");
  if (!username || !oldPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Thông tin đổi mật khẩu không hợp lệ." });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("username", sql.NVarChar(50), username)
      .query("SELECT ma_nguoi_dung, mat_khau FROM dbo.nguoi_dung WHERE ten_dang_nhap = @username;");
    const row = result.recordset[0];
    if (!row || !(await bcrypt.compare(oldPassword, row.mat_khau))) {
      return res.status(401).json({ message: "Mật khẩu hiện tại không đúng." });
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.request()
      .input("id", sql.Int, row.ma_nguoi_dung)
      .input("password", sql.VarChar(255), passwordHash)
      .query("UPDATE dbo.nguoi_dung SET mat_khau = @password, ngay_cap_nhat = SYSDATETIME() WHERE ma_nguoi_dung = @id;");
    return res.json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    console.error("Password update failed:", error.message);
    return res.status(503).json({ message: "Không thể cập nhật mật khẩu vào SQL Server." });
  }
});

app.listen(port, () => console.log(`API server listening on http://localhost:${port}`));

poolPromise.catch(error => {
  console.error("SQL Server connection failed:", error.message);
});