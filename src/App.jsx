import React, { useEffect, useMemo, useState } from "react";

const CATEGORIES = ["Tất cả", "Tee shirt", "Polo", "Somi", "Jeans", "Shoes", "Khác"];
const ORDER_STATUSES = ["Chờ xác nhận", "Đã xác nhận", "Đang giao hàng", "Đã giao hàng", "Đã hủy"];
const PAYMENT_METHODS = ["COD - Thanh toán khi nhận hàng", "Chuyển khoản ngân hàng"];

const DEFAULT_PRODUCTS = [
  { id: 1, name: "Áo thun Basic", category: "Tee shirt", price: 199000, stock: 20, description: "Áo thun basic trẻ trung, dễ phối đồ.", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80" },
  { id: 2, name: "Áo Polo Classic", category: "Polo", price: 259000, stock: 18, description: "Áo polo lịch sự, dễ phối đồ.", image: "https://images.unsplash.com/photo-1625910513413-5fc45a0f7f52?auto=format&fit=crop&w=800&q=80" },
  { id: 3, name: "Áo sơ mi trắng", category: "Somi", price: 299000, stock: 15, description: "Áo sơ mi trắng thanh lịch.", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80" },
  { id: 4, name: "Quần jean xanh", category: "Jeans", price: 399000, stock: 12, description: "Quần jean xanh phong cách hiện đại.", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80" },
  { id: 5, name: "Giày Sneaker Classic", category: "Shoes", price: 699000, stock: 9, description: "Giày sneaker dễ phối với nhiều phong cách.", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80" },
  { id: 6, name: "Áo Hoodie", category: "Khác", price: 449000, stock: 10, description: "Áo hoodie phù hợp thời tiết se lạnh.", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80" },
];

const DEFAULT_ACCOUNTS = [
  { id: "admin", username: "admin", email: "admin@thanhcong.com", password: "123456", role: "admin", name: "Quản trị viên", address: "", phone: "" },
  { id: "staff", username: "staff", email: "staff@thanhcong.com", password: "123456", role: "staff", name: "Nhân viên", address: "", phone: "" },
  { id: "manager", username: "manager", email: "manager@thanhcong.com", password: "123456", role: "manager", name: "Quản lý cửa hàng", address: "", phone: "" },
];

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function money(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " ₫";
}

function makeId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function roleName(role) {
  return role === "admin" ? "Quản trị viên" : role === "manager" ? "Quản lý" : role === "staff" ? "Nhân viên" : "Khách hàng";
}

function App() {
  const parseRoute = () => {
    const route = window.location.hash.replace(/^#/, "") || "home";
    const match = route.match(/^product\/(\d+)$/);
    if (match) return { page: "product-detail", productId: Number(match[1]) };
    return { page: route, productId: null };
  };
  const initialRoute = parseRoute();
  const [page, setPage] = useState(initialRoute.page);
  const [selectedProductId, setSelectedProductId] = useState(initialRoute.productId);
  const navigate = (nextPage, replace = false) => {
    if (replace) window.history.replaceState({ page: nextPage }, "", `#${nextPage}`);
    else window.history.pushState({ page: nextPage }, "", `#${nextPage}`);
    const route = parseRoute();
    setPage(route.page);
    if (route.productId) setSelectedProductId(route.productId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goBack = () => window.history.length > 1 && window.location.hash ? window.history.back() : navigate("home", true);

  useEffect(() => {
    const syncPage = () => {
      const route = parseRoute();
      setPage(route.page);
      if (route.productId) setSelectedProductId(route.productId);
    };
    window.addEventListener("popstate", syncPage);
    window.addEventListener("hashchange", syncPage);
    if (!window.location.hash) window.history.replaceState({ page: "home" }, "", "#home");
    return () => { window.removeEventListener("popstate", syncPage); window.removeEventListener("hashchange", syncPage); };
  }, []);

  const [users, setUsers] = useState(() => {
    const saved = readStorage("users", []);
    const result = [...saved];
    DEFAULT_ACCOUNTS.forEach(a => { if (!result.some(u => u.id === a.id)) result.push(a); });
    return result;
  });
  const [currentUser, setCurrentUser] = useState(() => readStorage("currentUser", null));
  const [authMode, setAuthMode] = useState("login");
  const [authData, setAuthData] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [accountForm, setAccountForm] = useState({ name: "", email: "", phone: "", address: "", oldPassword: "", newPassword: "", confirmNewPassword: "" });

  useEffect(() => localStorage.setItem("users", JSON.stringify(users)), [users]);
  useEffect(() => currentUser ? localStorage.setItem("currentUser", JSON.stringify(currentUser)) : localStorage.removeItem("currentUser"), [currentUser]);
  useEffect(() => {
    if (currentUser) setAccountForm(o => ({ ...o, name: currentUser.name || currentUser.username || "", email: currentUser.email || "", phone: currentUser.phone || "", address: currentUser.address || "", oldPassword: "", newPassword: "", confirmNewPassword: "" }));
  }, [currentUser]);

  const [products, setProducts] = useState(() => readStorage("products", DEFAULT_PRODUCTS));
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [sortPrice, setSortPrice] = useState("");
  const [favorites, setFavorites] = useState(() => readStorage("favorites", []));
  const [newProduct, setNewProduct] = useState({ name: "", category: "Tee shirt", price: "", stock: "", description: "", image: "" });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProduct, setEditProduct] = useState({ name: "", category: "Tee shirt", price: "", stock: "", description: "", image: "" });

  useEffect(() => localStorage.setItem("products", JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem("favorites", JSON.stringify(favorites)), [favorites]);

  const filteredProducts = useMemo(() => {
    const result = products.filter(p => {
      const q = search.trim().toLowerCase();
      return (!q || `${p.name} ${p.description || ""}`.toLowerCase().includes(q)) && (selectedCategory === "Tất cả" || (p.category || "Khác") === selectedCategory);
    });
    if (sortPrice === "low-high") result.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortPrice === "high-low") result.sort((a, b) => Number(b.price) - Number(a.price));
    return result;
  }, [products, search, selectedCategory, sortPrice]);

  const [cart, setCart] = useState(() => readStorage("cart", []));
  const [orders, setOrders] = useState(() => readStorage("orders", []));
  const [customerData, setCustomerData] = useState({ fullName: "", phone: "", address: "", paymentMethod: PAYMENT_METHODS[0], note: "" });
  const [orderFilter, setOrderFilter] = useState("Tất cả");
  const [managementTab, setManagementTab] = useState("dashboard");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => localStorage.setItem("cart", JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem("orders", JSON.stringify(orders)), [orders]);

  const cartQuantity = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const completedRevenue = orders.filter(o => o.status === "Đã giao hàng").reduce((sum, o) => sum + Number(o.total || 0), 0);
  const confirmedRevenue = orders.filter(o => o.status !== "Đã hủy").reduce((sum, o) => sum + Number(o.total || 0), 0);
  const lowStockProducts = products.filter(p => Number(p.stock) <= 5);
  const canManage = currentUser && ["admin", "staff", "manager"].includes(currentUser.role);
  const canDelete = currentUser?.role === "admin";
  const canManageUsers = currentUser?.role === "admin" || currentUser?.role === "manager";

  const login = () => {
    const username = authData.username.trim().toLowerCase();
    const password = authData.password;
    if (!username || !password) return alert("Vui lòng nhập tài khoản và mật khẩu!");
    const user = users.find(u => (u.username?.toLowerCase() === username || u.email?.toLowerCase() === username) && u.password === password);
    if (!user) return alert("Tài khoản hoặc mật khẩu không đúng!");
    setCurrentUser(user);
    setAuthData({ username: "", email: "", password: "", confirmPassword: "" });
    alert("Đăng nhập thành công!");
    navigate(["admin", "staff", "manager"].includes(user.role) ? "management" : "products");
  };

  const register = () => {
    const username = authData.username.trim();
    const email = authData.email.trim().toLowerCase();
    if (!username || !email || !authData.password || !authData.confirmPassword) return alert("Vui lòng nhập đầy đủ thông tin!");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert("Email không hợp lệ!");
    if (authData.password.length < 6) return alert("Mật khẩu phải có ít nhất 6 ký tự!");
    if (authData.password !== authData.confirmPassword) return alert("Mật khẩu xác nhận không khớp!");
    if (users.some(u => u.username?.toLowerCase() === username.toLowerCase() || u.email?.toLowerCase() === email)) return alert("Tài khoản hoặc email đã tồn tại!");
    const newUser = { id: makeId(), username, email, password: authData.password, role: "customer", name: username, address: "", phone: "" };
    setUsers(old => [...old, newUser]);
    alert("Đăng ký thành công! Bạn có thể đăng nhập ngay.");
    setAuthMode("login");
    setAuthData({ username: "", email: "", password: "", confirmPassword: "" });
  };

  const logout = () => { setCurrentUser(null); navigate("home", true); alert("Đã đăng xuất!"); };

  const saveAccountInfo = () => {
    if (!currentUser) return;
    if (!accountForm.name.trim() || !accountForm.email.trim()) return alert("Vui lòng nhập họ tên và email!");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountForm.email.trim())) return alert("Email không hợp lệ!");
    if (users.some(u => u.id !== currentUser.id && u.email?.toLowerCase() === accountForm.email.trim().toLowerCase())) return alert("Email này đã được tài khoản khác sử dụng!");
    const updated = { ...currentUser, name: accountForm.name.trim(), email: accountForm.email.trim().toLowerCase(), phone: accountForm.phone.trim(), address: accountForm.address.trim() };
    setUsers(old => old.map(u => u.id === currentUser.id ? updated : u));
    setCurrentUser(updated);
    alert("Đã cập nhật thông tin tài khoản!");
  };

  const changePassword = () => {
    if (!currentUser) return;
    if (!accountForm.oldPassword || !accountForm.newPassword || !accountForm.confirmNewPassword) return alert("Vui lòng nhập đầy đủ thông tin đổi mật khẩu!");
    if (accountForm.oldPassword !== currentUser.password) return alert("Mật khẩu hiện tại không đúng!");
    if (accountForm.newPassword.length < 6) return alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
    if (accountForm.newPassword !== accountForm.confirmNewPassword) return alert("Xác nhận mật khẩu mới không khớp!");
    const updated = { ...currentUser, password: accountForm.newPassword };
    setUsers(old => old.map(u => u.id === currentUser.id ? updated : u));
    setCurrentUser(updated);
    setAccountForm(o => ({ ...o, oldPassword: "", newPassword: "", confirmNewPassword: "" }));
    alert("Đổi mật khẩu thành công!");
  };

  const buyProduct = product => {
    if (!currentUser) { setAuthMode("login"); navigate("login"); return; }
    if (Number(product.stock) <= 0) return alert("Sản phẩm đã hết hàng!");
    setCart(old => {
      const found = old.find(i => i.id === product.id);
      if (!found) return [...old, { ...product, quantity: 1 }];
      if (found.quantity >= product.stock) { alert("Không thể mua vượt quá tồn kho!"); return old; }
      return old.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
    });
  };

  const changeQuantity = (id, amount) => setCart(old => old.map(item => {
    if (item.id !== id) return item;
    const product = products.find(p => p.id === id);
    const max = product ? Number(product.stock) : item.quantity;
    return { ...item, quantity: Math.max(1, Math.min(max, item.quantity + amount)) };
  }));
  const removeFromCart = id => setCart(old => old.filter(i => i.id !== id));
  const clearCart = () => { if (cart.length && window.confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) setCart([]); };

  const toggleFavorite = id => {
    if (!currentUser) { setAuthMode("login"); navigate("login"); return; }
    setFavorites(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  };

  const handleImage = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Vui lòng chọn file ảnh!");
    if (file.size > 3 * 1024 * 1024) return alert("Ảnh tối đa 3MB để tránh đầy localStorage!");
    const reader = new FileReader();
    reader.onload = () => type === "new" ? setNewProduct(o => ({ ...o, image: reader.result })) : setEditProduct(o => ({ ...o, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const validateProduct = p => {
    if (!p.name.trim()) return "Vui lòng nhập tên sản phẩm!";
    if (p.price === "" || Number(p.price) < 0) return "Giá sản phẩm không hợp lệ!";
    if (p.stock === "" || Number(p.stock) < 0) return "Tồn kho không hợp lệ!";
    return "";
  };
  const addProduct = () => {
    const error = validateProduct(newProduct);
    if (error) return alert(error);
    if (!newProduct.image) return alert("Vui lòng chọn ảnh sản phẩm!");
    setProducts(old => [...old, { id: makeId(), name: newProduct.name.trim(), category: newProduct.category, price: Number(newProduct.price), stock: Number(newProduct.stock), description: newProduct.description.trim(), image: newProduct.image }]);
    setNewProduct({ name: "", category: "Tee shirt", price: "", stock: "", description: "", image: "" });
    alert("Thêm sản phẩm thành công!");
  };
  const startEditProduct = p => { setEditingProduct(p.id); setEditProduct({ name: p.name, category: p.category || "Khác", price: p.price, stock: p.stock, description: p.description || "", image: p.image }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const saveEditProduct = () => {
    const error = validateProduct(editProduct);
    if (error) return alert(error);
    setProducts(old => old.map(p => p.id === editingProduct ? { ...p, name: editProduct.name.trim(), category: editProduct.category, price: Number(editProduct.price), stock: Number(editProduct.stock), description: editProduct.description.trim(), image: editProduct.image } : p));
    setEditingProduct(null); alert("Cập nhật sản phẩm thành công!");
  };
  const deleteProduct = id => { if (canDelete && window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) { setProducts(old => old.filter(p => p.id !== id)); setCart(old => old.filter(p => p.id !== id)); } };

  const placeOrder = () => {
    if (!currentUser) return navigate("login");
    if (!cart.length) return alert("Giỏ hàng đang trống!");
    if (!customerData.fullName.trim() || !customerData.phone.trim() || !customerData.address.trim()) return alert("Vui lòng nhập đầy đủ thông tin nhận hàng!");
    if (!/^0\d{9,10}$/.test(customerData.phone.trim())) return alert("Số điện thoại không hợp lệ!");
    for (const item of cart) {
      const p = products.find(x => x.id === item.id);
      if (!p) return alert(`Sản phẩm ${item.name} không còn tồn tại!`);
      if (item.quantity > p.stock) return alert(`Sản phẩm ${item.name} không đủ số lượng!`);
    }
    const order = {
      id: makeId(), username: currentUser.username, email: currentUser.email,
      customerName: customerData.fullName.trim(), phone: customerData.phone.trim(), address: customerData.address.trim(),
      products: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
      total: cartTotal, paymentMethod: customerData.paymentMethod, note: customerData.note.trim(), status: "Chờ xác nhận", createdAt: new Date().toLocaleString("vi-VN")
    };
    setOrders(old => [order, ...old]);
    setProducts(old => old.map(p => { const item = cart.find(i => i.id === p.id); return item ? { ...p, stock: p.stock - item.quantity } : p; }));
    setCart([]);
    setCustomerData({ fullName: "", phone: "", address: "", paymentMethod: PAYMENT_METHODS[0], note: "" });
    alert("Đặt hàng thành công!"); navigate("orders");
  };

  const updateOrderStatus = (id, status) => setOrders(old => old.map(o => o.id === id ? { ...o, status } : o));
  const cancelMyOrder = id => {
    const order = orders.find(o => o.id === id);
    if (!order || !["Chờ xác nhận", "Đã xác nhận"].includes(order.status)) return;
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng?")) return;
    setOrders(old => old.map(o => o.id === id ? { ...o, status: "Đã hủy" } : o));
    setProducts(old => old.map(p => { const item = order.products.find(i => i.id === p.id); return item ? { ...p, stock: p.stock + item.quantity } : p; }));
  };
  const deleteOrder = id => { if (canDelete && window.confirm("Bạn có chắc muốn xóa đơn hàng?")) setOrders(old => old.filter(o => o.id !== id)); };

  const updateUserRole = (id, role) => {
    if (!canManageUsers || id === currentUser.id) return;
    setUsers(old => old.map(u => u.id === id ? { ...u, role } : u));
  };
  const deleteUser = id => {
    if (!canManageUsers || id === currentUser.id) return;
    const u = users.find(x => x.id === id);
    if (u && window.confirm(`Xóa tài khoản ${u.username}?`)) setUsers(old => old.filter(x => x.id !== id));
  };

  const S = {
    page: { minHeight: "100vh", background: "#f5f6fa", color: "#1f2937", fontFamily: "Arial, sans-serif" },
    header: { background: "#111827", color: "white", padding: "14px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 1000 },
    logo: { fontSize: 24, fontWeight: 800, cursor: "pointer" }, nav: { display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" },
    navButton: { border: "none", background: "transparent", color: "white", padding: "10px 12px", cursor: "pointer", borderRadius: 6, fontSize: 15 },
    container: { width: "90%", maxWidth: 1250, margin: "30px auto" }, hero: { background: "linear-gradient(135deg,#111827,#374151)", color: "white", padding: "75px 30px", borderRadius: 18, textAlign: "center", marginBottom: 35 },
    title: { fontSize: 42, marginBottom: 15 }, button: { background: "#111827", color: "white", border: "none", padding: "11px 17px", borderRadius: 7, cursor: "pointer", fontWeight: 700 }, greenButton: { background: "#16a34a", color: "white", border: "none", padding: "11px 17px", borderRadius: 7, cursor: "pointer", fontWeight: 700 }, whiteButton: { background: "white", color: "#111827", border: "none", padding: "11px 17px", borderRadius: 7, cursor: "pointer", fontWeight: 700 }, dangerButton: { background: "#dc2626", color: "white", border: "none", padding: "9px 14px", borderRadius: 6, cursor: "pointer" },
    input: { width: "100%", boxSizing: "border-box", padding: 13, border: "1px solid #d1d5db", borderRadius: 7, fontSize: 16, marginBottom: 12, background: "white" }, grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 },
    card: { background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 3px 12px rgba(0,0,0,.08)" }, cardBody: { padding: 18 }, productImage: { width: "100%", height: 280, objectFit: "cover", display: "block" }, price: { color: "#dc2626", fontSize: 20, fontWeight: 800 }, formBox: { maxWidth: 700, margin: "30px auto", background: "white", padding: 25, borderRadius: 15, boxShadow: "0 4px 18px rgba(0,0,0,.1)" }, tableBox: { background: "white", borderRadius: 12, padding: 20, marginBottom: 25, overflowX: "auto", boxShadow: "0 3px 12px rgba(0,0,0,.06)" }, table: { width: "100%", borderCollapse: "collapse" }, th: { padding: 12, background: "#f3f4f6", borderBottom: "1px solid #ddd", textAlign: "left" }, td: { padding: 12, borderBottom: "1px solid #eee", verticalAlign: "middle" }, footer: { background: "#111827", color: "white", textAlign: "center", padding: 25, marginTop: 50 }, profileCard: { background: "white", borderRadius: 14, padding: 25, boxShadow: "0 4px 18px rgba(0,0,0,.08)", marginBottom: 25 }, badge: { display: "inline-block", padding: "6px 10px", background: "#e5e7eb", borderRadius: 20, fontSize: 13, fontWeight: 700 }, stat: { background: "white", borderRadius: 14, padding: 20, boxShadow: "0 3px 12px rgba(0,0,0,.07)" }
  };

  const productUrl = (product) => {
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}#/product/${product.id}`;
  };

  const qrImageUrl = (product) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(productUrl(product))}`;

  const ProductCard = ({ product }) => <div style={S.card}>
    <div style={{ position: "relative" }}>
      <img src={product.image} alt={product.name} style={S.productImage} onError={e => { e.currentTarget.src = "https://via.placeholder.com/800x600?text=THANHCONG.BOUTIQUE"; }} />
      <button title="Yêu thích" onClick={() => toggleFavorite(product.id)} style={{ position: "absolute", top: 10, right: 10, border: 0, borderRadius: "50%", width: 42, height: 42, cursor: "pointer", fontSize: 20, background: "white" }}>{favorites.includes(product.id) ? "❤️" : "♡"}</button>
      {Number(product.stock) <= 5 && Number(product.stock) > 0 && <span style={{ position: "absolute", left: 10, top: 10, background: "#f59e0b", color: "white", padding: "5px 8px", borderRadius: 6, fontSize: 12 }}>Sắp hết</span>}
      {Number(product.stock) === 0 && <span style={{ position: "absolute", left: 10, top: 10, background: "#dc2626", color: "white", padding: "5px 8px", borderRadius: 6, fontSize: 12 }}>Hết hàng</span>}
    </div>
    <div style={{ padding: "0 18px 8px", textAlign: "center" }}>
      <details>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>📱 Mã QR sản phẩm</summary>
        <img src={qrImageUrl(product)} alt={`QR ${product.name}`} style={{ width: 150, height: 150, marginTop: 10, border: "1px solid #ddd", borderRadius: 8 }} />
        <p style={{ fontSize: 12, color: "#6b7280", wordBreak: "break-all" }}>Quét mã để mở đúng sản phẩm</p>
      </details>
    </div>
    <div style={S.cardBody}><h3>{product.name}</h3><p>Danh mục: <strong>{product.category || "Khác"}</strong></p><p>{product.description}</p><p style={S.price}>{money(product.price)}</p><p>Còn lại: {product.stock}</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button style={S.button} onClick={() => navigate(`product/${product.id}`)}>Chi tiết</button><button style={S.greenButton} disabled={Number(product.stock) <= 0} onClick={() => buyProduct(product)}>{Number(product.stock) <= 0 ? "Hết hàng" : "Thêm vào giỏ"}</button></div></div>
  </div>;

  const userNotifications = currentUser ? orders.filter(o => o.username === currentUser.username).slice(0, 5) : [];
  const header = <header style={S.header}><div style={S.logo} onClick={() => navigate("home")}>THANHCONG.BOUTIQUE</div><nav style={S.nav}>
    <button style={S.navButton} onClick={() => navigate("home")}>Trang chủ</button><button style={S.navButton} onClick={() => navigate("products")}>Sản phẩm</button><button style={S.navButton} onClick={() => navigate("favorites")}>❤️ Yêu thích ({favorites.length})</button><button style={S.navButton} onClick={() => navigate("cart")}>🛒 Giỏ hàng ({cartQuantity})</button>
    {currentUser && <><button style={S.navButton} onClick={() => navigate("orders")}>Đơn hàng</button><button style={S.navButton} onClick={() => alert(userNotifications.length ? userNotifications.map(o => `Đơn #${o.id}: ${o.status}`).join("\n") : "Chưa có thông báo đơn hàng.")}>🔔 Thông báo ({userNotifications.length})</button><button style={S.navButton} onClick={() => navigate("account")}>Tài khoản</button></>}
    {canManage && <button style={S.navButton} onClick={() => navigate("management")}>Quản lý</button>}
    {page !== "home" && <button style={S.navButton} onClick={goBack}>← Quay lại</button>}
    {!currentUser ? <button style={S.whiteButton} onClick={() => { setAuthMode("login"); navigate("login"); }}>Đăng nhập</button> : <button style={S.whiteButton} onClick={logout}>Đăng xuất</button>}
  </nav></header>;

  const homePage = <main style={S.container}><section style={S.hero}><h1 style={S.title}>THANHCONG.BOUTIQUE</h1><p>Thời trang hiện đại - Phong cách dành cho bạn</p><button style={S.whiteButton} onClick={() => navigate("products")}>KHÁM PHÁ SẢN PHẨM</button></section><h2>Sản phẩm nổi bật</h2><div style={S.grid}>{products.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}</div><div style={{ ...S.tableBox, marginTop: 30 }}><h2>📱 Mua hàng bằng QR</h2><p>Mỗi sản phẩm có một mã QR riêng. Khách hàng có thể dùng camera điện thoại quét mã để mở trực tiếp trang chi tiết sản phẩm.</p></div><div style={{ ...S.tableBox, marginTop: 30 }}><h2>Vì sao chọn THANHCONG.BOUTIQUE?</h2><div style={S.grid}><div><h3>🚚 Giao hàng</h3><p>Đóng gói cẩn thận, hỗ trợ giao hàng tận nơi.</p></div><div><h3>💳 Thanh toán</h3><p>COD hoặc chuyển khoản ngân hàng.</p></div><div><h3>🔄 Hỗ trợ</h3><p>Theo dõi trạng thái đơn hàng ngay trên website.</p></div><div><h3>🔒 Tài khoản</h3><p>Khách hàng có thể quản lý thông tin và mật khẩu.</p></div></div></div></main>;

  const productsPage = <main style={S.container}><h1>Sản phẩm</h1><div style={{ display: "grid", gridTemplateColumns: "minmax(220px,2fr) minmax(170px,1fr) minmax(170px,1fr)", gap: 12 }}><input style={{ ...S.input, marginBottom: 0 }} placeholder="🔍 Tìm kiếm sản phẩm..." value={search} onChange={e => setSearch(e.target.value)} /><select style={{ ...S.input, marginBottom: 0 }} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select><select style={{ ...S.input, marginBottom: 0 }} value={sortPrice} onChange={e => setSortPrice(e.target.value)}><option value="">Sắp xếp giá</option><option value="low-high">Giá thấp đến cao</option><option value="high-low">Giá cao đến thấp</option></select></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "18px 0" }}>{CATEGORIES.map(c => <button key={c} style={{ ...S.button, background: selectedCategory === c ? "#16a34a" : "#6b7280" }} onClick={() => setSelectedCategory(c)}>{c}</button>)}</div><p>Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm</p><div style={S.grid}>{filteredProducts.length ? filteredProducts.map(p => <ProductCard key={p.id} product={p} />) : <div style={S.tableBox}><h3>Không tìm thấy sản phẩm</h3><p>Hãy thử từ khóa hoặc danh mục khác.</p></div>}</div></main>;

  const detailProduct = products.find(p => p.id === selectedProductId);
  const productDetailPage = <main style={S.container}>{detailProduct ? <div style={{ ...S.tableBox, display: "grid", gridTemplateColumns: "minmax(280px,1fr) minmax(280px,1fr)", gap: 30 }}><img src={detailProduct.image} alt={detailProduct.name} style={{ width: "100%", maxHeight: 520, objectFit: "cover", borderRadius: 12 }} /><div><h1>{detailProduct.name}</h1><p style={S.price}>{money(detailProduct.price)}</p><p><strong>Danh mục:</strong> {detailProduct.category}</p><p><strong>Kích thước:</strong> {detailProduct.sizes || "S, M, L, XL"}</p><p><strong>Màu sắc:</strong> {detailProduct.colors || "Đen, Trắng"}</p><p><strong>Tồn kho:</strong> {detailProduct.stock}</p><p style={{ lineHeight: 1.7 }}>{detailProduct.description}</p><div style={{ marginTop: 20, textAlign: "center" }}><h3>📱 Quét QR để mở sản phẩm</h3><img src={qrImageUrl(detailProduct)} alt={`QR ${detailProduct.name}`} style={{ width: 200, height: 200, border: "1px solid #ddd", borderRadius: 10 }} /><p style={{ fontSize: 13, color: "#6b7280", wordBreak: "break-all" }}>{productUrl(detailProduct)}</p></div><button style={S.greenButton} disabled={!detailProduct.stock} onClick={() => buyProduct(detailProduct)}>Thêm vào giỏ hàng</button><button style={{ ...S.button, marginLeft: 8 }} onClick={() => toggleFavorite(detailProduct.id)}>{favorites.includes(detailProduct.id) ? "Bỏ yêu thích" : "Yêu thích"}</button></div></div> : <div style={S.tableBox}><p>Sản phẩm không tồn tại.</p></div>}</main>;

  const loginPage = <main style={S.container}><div style={{ ...S.formBox, maxWidth: 500 }}><h2 style={{ textAlign: "center" }}>{authMode === "login" ? "Đăng nhập" : "Đăng ký"}</h2>{authMode === "login" ? <><input style={S.input} autoComplete="username" placeholder="Tài khoản hoặc Email" value={authData.username} onChange={e => setAuthData(o => ({ ...o, username: e.target.value }))} /><input style={S.input} type="password" autoComplete="current-password" placeholder="Mật khẩu" value={authData.password} onChange={e => setAuthData(o => ({ ...o, password: e.target.value }))} /><button style={{ ...S.button, width: "100%" }} onClick={login}>Đăng nhập</button><button style={{ ...S.whiteButton, width: "100%", marginTop: 10, border: "1px solid #111827" }} onClick={() => setAuthMode("register")}>Đăng ký tài khoản</button></> : <><input style={S.input} autoComplete="username" placeholder="Tên tài khoản" value={authData.username} onChange={e => setAuthData(o => ({ ...o, username: e.target.value }))} /><input style={S.input} type="email" autoComplete="email" placeholder="Email" value={authData.email} onChange={e => setAuthData(o => ({ ...o, email: e.target.value }))} /><input style={S.input} type="password" autoComplete="new-password" placeholder="Mật khẩu (ít nhất 6 ký tự)" value={authData.password} onChange={e => setAuthData(o => ({ ...o, password: e.target.value }))} /><input style={S.input} type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" value={authData.confirmPassword} onChange={e => setAuthData(o => ({ ...o, confirmPassword: e.target.value }))} /><button style={{ ...S.button, width: "100%" }} onClick={register}>Đăng ký</button><button style={{ ...S.whiteButton, width: "100%", marginTop: 10, border: "1px solid #111827" }} onClick={() => setAuthMode("login")}>Quay lại đăng nhập</button></>}</div></main>;

  const accountPage = currentUser ? <main style={S.container}><h1>Tài khoản</h1><div style={S.profileCard}><div style={{ display: "flex", justifyContent: "space-between", gap: 15, flexWrap: "wrap" }}><div><h2>Xin chào, {currentUser.name || currentUser.username}</h2><p>Tài khoản: <strong>{currentUser.username}</strong></p></div><span style={S.badge}>{roleName(currentUser.role)}</span></div></div><div style={S.formBox}><h2>Thông tin tài khoản</h2><label>Họ và tên</label><input style={S.input} value={accountForm.name} onChange={e => setAccountForm(o => ({ ...o, name: e.target.value }))} /><label>Email</label><input style={S.input} type="email" value={accountForm.email} onChange={e => setAccountForm(o => ({ ...o, email: e.target.value }))} /><label>Số điện thoại</label><input style={S.input} value={accountForm.phone} onChange={e => setAccountForm(o => ({ ...o, phone: e.target.value }))} /><label>Địa chỉ</label><textarea style={{ ...S.input, minHeight: 100 }} value={accountForm.address} onChange={e => setAccountForm(o => ({ ...o, address: e.target.value }))} /><button style={S.greenButton} onClick={saveAccountInfo}>Lưu thông tin</button></div><div style={S.formBox}><h2>Đổi mật khẩu</h2><input style={S.input} type="password" autoComplete="current-password" placeholder="Mật khẩu hiện tại" value={accountForm.oldPassword} onChange={e => setAccountForm(o => ({ ...o, oldPassword: e.target.value }))} /><input style={S.input} type="password" autoComplete="new-password" placeholder="Mật khẩu mới" value={accountForm.newPassword} onChange={e => setAccountForm(o => ({ ...o, newPassword: e.target.value }))} /><input style={S.input} type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" value={accountForm.confirmNewPassword} onChange={e => setAccountForm(o => ({ ...o, confirmNewPassword: e.target.value }))} /><button style={S.button} onClick={changePassword}>Đổi mật khẩu</button></div></main> : <main style={S.container}><div style={S.tableBox}>Vui lòng đăng nhập để xem tài khoản.</div></main>;

  const cartPage = <main style={S.container}><h1>Giỏ hàng</h1>{cart.length === 0 ? <div style={S.tableBox}><p>Giỏ hàng đang trống.</p><button style={S.button} onClick={() => navigate("products")}>Xem sản phẩm</button></div> : <><div>{cart.map(item => <div key={item.id} style={{ ...S.tableBox, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}><img src={item.image} alt={item.name} style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 8 }} /><div style={{ flex: 1 }}><h3>{item.name}</h3><p>{money(item.price)}</p><button style={S.button} onClick={() => changeQuantity(item.id, -1)}>-</button><span style={{ margin: "0 15px", fontWeight: 700 }}>{item.quantity}</span><button style={S.button} onClick={() => changeQuantity(item.id, 1)}>+</button><p>Thành tiền: <strong>{money(item.price * item.quantity)}</strong></p></div><button style={S.dangerButton} onClick={() => removeFromCart(item.id)}>Xóa</button></div>)}</div><div style={S.tableBox}><h2>Tổng tiền: {money(cartTotal)}</h2><button style={S.dangerButton} onClick={clearCart}>Xóa giỏ hàng</button><button style={{ ...S.greenButton, marginLeft: 10 }} onClick={() => currentUser ? navigate("checkout") : navigate("login")}>Tiến hành đặt hàng</button></div></>}</main>;

  const checkoutPage = <main style={S.container}><div style={{ ...S.formBox, maxWidth: 650 }}><h2>Thông tin đặt hàng</h2><p>Tạm tính: <strong>{money(cartTotal)}</strong></p><input style={S.input} placeholder="Họ và tên" value={customerData.fullName} onChange={e => setCustomerData(o => ({ ...o, fullName: e.target.value }))} /><input style={S.input} placeholder="Số điện thoại" value={customerData.phone} onChange={e => setCustomerData(o => ({ ...o, phone: e.target.value }))} /><textarea style={{ ...S.input, minHeight: 100 }} placeholder="Địa chỉ nhận hàng" value={customerData.address} onChange={e => setCustomerData(o => ({ ...o, address: e.target.value }))} /><label>Phương thức thanh toán</label><select style={S.input} value={customerData.paymentMethod} onChange={e => setCustomerData(o => ({ ...o, paymentMethod: e.target.value }))}>{PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}</select><textarea style={{ ...S.input, minHeight: 80 }} placeholder="Ghi chú đơn hàng (không bắt buộc)" value={customerData.note} onChange={e => setCustomerData(o => ({ ...o, note: e.target.value }))} /><h3>Tổng thanh toán: {money(cartTotal)}</h3><button style={{ ...S.greenButton, width: "100%" }} onClick={placeOrder}>Xác nhận đặt hàng</button></div></main>;

  const visibleOrders = currentUser ? orders.filter(o => o.username === currentUser.username).filter(o => orderFilter === "Tất cả" || o.status === orderFilter) : [];
  const ordersPage = <main style={S.container}><h1>Đơn hàng của tôi</h1>{!currentUser ? <div style={S.tableBox}>Vui lòng đăng nhập.</div> : <>{visibleOrders.length > 0 && <select style={{ ...S.input, maxWidth: 300 }} value={orderFilter} onChange={e => setOrderFilter(e.target.value)}><option>Tất cả</option>{ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}</select>}{visibleOrders.length === 0 ? <div style={S.tableBox}>Bạn chưa có đơn hàng phù hợp.</div> : visibleOrders.map(order => <div key={order.id} style={S.tableBox}><h3>Đơn hàng #{order.id}</h3><p>Ngày đặt: {order.createdAt}</p><p>Trạng thái: <strong>{order.status}</strong></p><p>Người nhận: {order.customerName} — {order.phone}</p><p>Địa chỉ: {order.address}</p><p>Thanh toán: {order.paymentMethod || PAYMENT_METHODS[0]}</p>{order.note && <p>Ghi chú: {order.note}</p>}<hr />{order.products.map(item => <div key={item.id} style={{ display: "flex", gap: 15, alignItems: "center", marginBottom: 12 }}><img src={item.image} alt={item.name} style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 7 }} /><div><strong>{item.name}</strong><p>Số lượng: {item.quantity}</p><p>Đơn giá: {money(item.price)}</p></div></div>)}<h3>Tổng tiền: {money(order.total)}</h3>{["Chờ xác nhận", "Đã xác nhận"].includes(order.status) && <button style={S.dangerButton} onClick={() => cancelMyOrder(order.id)}>Hủy đơn</button>}</div>)}</>}</main>;

  const favoritesPage = <main style={S.container}><h1>Sản phẩm yêu thích</h1><div style={S.grid}>{products.filter(p => favorites.includes(p.id)).map(p => <ProductCard key={p.id} product={p} />)}</div>{!products.some(p => favorites.includes(p.id)) && <div style={S.tableBox}>Bạn chưa có sản phẩm yêu thích.</div>}</main>;

  const managementPage = canManage ? <main style={S.container}><h1>Quản lý cửa hàng</h1><p>Quyền: <strong>{roleName(currentUser.role)}</strong></p><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>{[["dashboard","📊 Tổng quan"],["products","📦 Sản phẩm"],["orders","🧾 Đơn hàng"],...(canManageUsers ? [["users","👥 Tài khoản"]] : [])].map(([id,label]) => <button key={id} style={{ ...S.button, background: managementTab === id ? "#16a34a" : "#6b7280" }} onClick={() => setManagementTab(id)}>{label}</button>)}</div>
    {managementTab === "dashboard" && <><div style={{ ...S.grid, marginBottom: 25 }}><div style={S.stat}><h3>💰 Doanh thu đã giao</h3><h2>{money(completedRevenue)}</h2></div><div style={S.stat}><h3>📈 Giá trị đơn chưa hủy</h3><h2>{money(confirmedRevenue)}</h2></div><div style={S.stat}><h3>🧾 Tổng đơn</h3><h2>{orders.length}</h2></div><div style={S.stat}><h3>📦 Sản phẩm</h3><h2>{products.length}</h2></div><div style={S.stat}><h3>⚠️ Sắp hết hàng</h3><h2>{lowStockProducts.length}</h2></div><div style={S.stat}><h3>👥 Tài khoản</h3><h2>{users.length}</h2></div></div><div style={S.tableBox}><h2>Cảnh báo tồn kho</h2>{lowStockProducts.length ? <table style={S.table}><thead><tr><th style={S.th}>Sản phẩm</th><th style={S.th}>Tồn kho</th><th style={S.th}>Giá</th></tr></thead><tbody>{lowStockProducts.map(p => <tr key={p.id}><td style={S.td}>{p.name}</td><td style={S.td}>{p.stock}</td><td style={S.td}>{money(p.price)}</td></tr>)}</tbody></table> : <p>Tồn kho hiện đang ổn.</p>}</div></>}
    {managementTab === "products" && <><div style={S.formBox}>{editingProduct && <><h2>Chỉnh sửa sản phẩm</h2><input style={S.input} placeholder="Tên sản phẩm" value={editProduct.name} onChange={e => setEditProduct(o => ({ ...o, name: e.target.value }))} /><select style={S.input} value={editProduct.category} onChange={e => setEditProduct(o => ({ ...o, category: e.target.value }))}>{CATEGORIES.filter(c => c !== "Tất cả").map(c => <option key={c}>{c}</option>)}</select><input style={S.input} type="number" min="0" placeholder="Giá" value={editProduct.price} onChange={e => setEditProduct(o => ({ ...o, price: e.target.value }))} /><input style={S.input} type="number" min="0" placeholder="Tồn kho" value={editProduct.stock} onChange={e => setEditProduct(o => ({ ...o, stock: e.target.value }))} /><textarea style={{ ...S.input, minHeight: 100 }} placeholder="Mô tả" value={editProduct.description} onChange={e => setEditProduct(o => ({ ...o, description: e.target.value }))} /><input type="file" accept="image/*" onChange={e => handleImage(e, "edit")} /><div style={{ marginTop: 15 }}><button style={S.greenButton} onClick={saveEditProduct}>Lưu thay đổi</button><button style={{ ...S.dangerButton, marginLeft: 8 }} onClick={() => setEditingProduct(null)}>Hủy</button></div></>}
      <h2>{editingProduct ? "Thêm sản phẩm mới" : "Thêm sản phẩm"}</h2><input style={S.input} placeholder="Tên sản phẩm" value={newProduct.name} onChange={e => setNewProduct(o => ({ ...o, name: e.target.value }))} /><select style={S.input} value={newProduct.category} onChange={e => setNewProduct(o => ({ ...o, category: e.target.value }))}>{CATEGORIES.filter(c => c !== "Tất cả").map(c => <option key={c}>{c}</option>)}</select><input style={S.input} type="number" min="0" placeholder="Giá sản phẩm" value={newProduct.price} onChange={e => setNewProduct(o => ({ ...o, price: e.target.value }))} /><input style={S.input} type="number" min="0" placeholder="Số lượng tồn kho" value={newProduct.stock} onChange={e => setNewProduct(o => ({ ...o, stock: e.target.value }))} /><textarea style={{ ...S.input, minHeight: 100 }} placeholder="Mô tả sản phẩm" value={newProduct.description} onChange={e => setNewProduct(o => ({ ...o, description: e.target.value }))} /><input type="file" accept="image/*" onChange={e => handleImage(e, "new")} />{newProduct.image && <img src={newProduct.image} alt="Xem trước" style={{ width: 150, height: 150, objectFit: "cover", display: "block", marginTop: 15, borderRadius: 10 }} />}<br /><button style={S.greenButton} onClick={addProduct}>Thêm sản phẩm</button></div><div style={S.tableBox}><h2>Danh sách sản phẩm</h2><table style={S.table}><thead><tr><th style={S.th}>Ảnh</th><th style={S.th}>Tên</th><th style={S.th}>Danh mục</th><th style={S.th}>Giá</th><th style={S.th}>Tồn kho</th><th style={S.th}>Thao tác</th></tr></thead><tbody>{products.map(p => <tr key={p.id}><td style={S.td}><img src={p.image} alt={p.name} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} /></td><td style={S.td}>{p.name}</td><td style={S.td}>{p.category}</td><td style={S.td}>{money(p.price)}</td><td style={S.td}>{p.stock}</td><td style={S.td}><button style={S.button} onClick={() => startEditProduct(p)}>Chỉnh sửa</button>{canDelete && <button style={{ ...S.dangerButton, marginLeft: 8 }} onClick={() => deleteProduct(p.id)}>Xóa</button>}</td></tr>)}</tbody></table></div></>}
    {managementTab === "orders" && <div style={S.tableBox}><h2>Quản lý đơn hàng</h2>{orders.length === 0 ? <p>Chưa có đơn hàng.</p> : orders.map(order => <div key={order.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 20, marginBottom: 20 }}><h3>Đơn hàng #{order.id}</h3><p>Khách hàng: <strong>{order.customerName}</strong></p><p>Tài khoản: {order.username}</p><p>Email: {order.email}</p><p>Số điện thoại: {order.phone}</p><p>Địa chỉ: {order.address}</p><p>Ngày đặt: {order.createdAt}</p><p>Thanh toán: {order.paymentMethod || PAYMENT_METHODS[0]}</p><select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} style={{ padding: 10, borderRadius: 6, marginBottom: 15 }}>{ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}</select>{order.products.map(item => <div key={item.id} style={{ display: "flex", gap: 15, alignItems: "center", marginBottom: 12 }}><img src={item.image} alt={item.name} style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 7 }} /><div><strong>{item.name}</strong><p>Số lượng: {item.quantity}</p><p>Giá: {money(item.price)}</p></div></div>)}<h3>Tổng tiền: {money(order.total)}</h3>{canDelete && <button style={S.dangerButton} onClick={() => deleteOrder(order.id)}>Xóa đơn hàng</button>}</div>)}</div>}
    {managementTab === "users" && canManageUsers && <div style={S.tableBox}><h2>Quản lý tài khoản</h2><input style={{ ...S.input, maxWidth: 500 }} placeholder="🔍 Tìm tài khoản, email, tên..." value={userSearch} onChange={e => setUserSearch(e.target.value)} /><table style={S.table}><thead><tr><th style={S.th}>Tài khoản</th><th style={S.th}>Tên</th><th style={S.th}>Email</th><th style={S.th}>Vai trò</th><th style={S.th}>Thao tác</th></tr></thead><tbody>{users.filter(u => `${u.username} ${u.email} ${u.name}`.toLowerCase().includes(userSearch.toLowerCase())).map(u => <tr key={u.id}><td style={S.td}>{u.username}</td><td style={S.td}>{u.name}</td><td style={S.td}>{u.email}</td><td style={S.td}><select disabled={u.id === currentUser.id} value={u.role} onChange={e => updateUserRole(u.id, e.target.value)}><option value="customer">Khách hàng</option><option value="staff">Nhân viên</option><option value="manager">Quản lý</option><option value="admin">Quản trị viên</option></select></td><td style={S.td}>{u.id !== currentUser.id && <button style={S.dangerButton} onClick={() => deleteUser(u.id)}>Xóa</button>}</td></tr>)}</tbody></table></div>}
  </main> : <main style={S.container}><div style={S.tableBox}><h2>Bạn không có quyền truy cập!</h2></div></main>;

  const footer = <footer style={S.footer}><p>© 2026 THANHCONG.BOUTIQUE</p><p>Thời trang dành cho phong cách của bạn.</p><p>Hotline hỗ trợ: 0900 000 000 | Email: support@thanhcong.com</p></footer>;

  let content = homePage;
  if (page === "products") content = productsPage;
  if (page === "product-detail") content = productDetailPage;
  if (page === "login") content = loginPage;
  if (page === "account") content = accountPage;
  if (page === "cart") content = cartPage;
  if (page === "checkout") content = checkoutPage;
  if (page === "orders") content = ordersPage;
  if (page === "favorites") content = favoritesPage;
  if (["management", "admin", "staff", "manager"].includes(page)) content = managementPage;

  return <div style={S.page}><style>{`@media (max-width: 700px) { .tc-grid-detail { grid-template-columns: 1fr !important; } .tc-search-grid { grid-template-columns: 1fr !important; } } button:disabled { opacity: .55; cursor: not-allowed; } details summary::-webkit-details-marker { color: #111827; }`}</style>{header}{content}{footer}</div>;
}

export default App;
