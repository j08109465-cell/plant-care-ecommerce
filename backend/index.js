const crypto = require("node:crypto");
const path = require("node:path");
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const Stripe = require("stripe");
const dotenvResult = require("dotenv").config({ path: path.join(__dirname, ".env") });
const { hashPassword, verifyPassword } = require("./passwords");
const {
  registeredCustomerFilter,
  validRevenueOrderMatch,
} = require("./dashboardStats");
const {
  paymentStatusForOrder,
  toStripeAmount,
  verifiedStripeOrderUpdate,
} = require("./payments");

const readAdminSetting = (name) => {
  const fileValue = dotenvResult.parsed?.[name];
  return fileValue || process.env[name];
};

const app = express();
const PORT = Number(process.env.PORT) || 5000;
let stripeClient;
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE = "plantCareSession";
const ADMIN_SESSION_COOKIE = "plantCareAdminSession";
const CART_COOKIE = "plantCareCart";
const configuredOrigins = (
  process.env.FRONTEND_ORIGIN ||
  "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  ...configuredOrigins,
  ...(process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:5174", "http://127.0.0.1:5174"]),
]);

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new HttpError(503, "Online payments are not configured. Please choose Cash on Delivery.");
  }
  if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
};

const getCheckoutFrontendUrl = (pathAndQuery) => {
  const frontendUrl = process.env.FRONTEND_URL || configuredOrigins[0];
  return new URL(pathAndQuery, frontendUrl).toString();
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
  },
  { timestamps: true }
);

const sessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

const productSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    categories: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0.01 },
    originalPrice: { type: Number, default: null, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 20, min: 0 },
    image: { type: String, default: "" },
    description: { type: String, default: "", maxlength: 4000 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    items: {
      type: [{ productId: String, quantity: { type: Number, min: 1, max: 20 } }],
      default: [],
    },
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    cartTokenHash: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, maxlength: 100 },
    address: { type: String, required: true, maxlength: 500 },
    phone: { type: String, required: true },
    city: { type: String, required: true, maxlength: 100 },
    state: { type: String, required: true, maxlength: 100 },
    pincode: { type: String, required: true },
    payment: { type: String, enum: ["COD", "Card"], required: true },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Failed"],
      default: "Pending",
      required: true,
    },
    stripeSessionId: { type: String, unique: true, sparse: true },
    items: {
      type: [{
        productId: String,
        name: String,
        image: String,
        price: Number,
        quantity: Number,
      }],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    subtotal: { type: Number, required: true },
    delivery: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

const checkoutDraftSchema = new mongoose.Schema(
  {
    cartTokenHash: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, maxlength: 100 },
    address: { type: String, required: true, maxlength: 500 },
    phone: { type: String, required: true },
    city: { type: String, required: true, maxlength: 100 },
    state: { type: String, required: true, maxlength: 100 },
    pincode: { type: String, required: true },
    payment: { type: String, enum: ["Card"], required: true },
    items: {
      type: [{
        productId: String,
        name: String,
        image: String,
        price: Number,
        quantity: Number,
      }],
      required: true,
    },
    subtotal: { type: Number, required: true },
    delivery: { type: Number, required: true },
    total: { type: Number, required: true },
    stripeSessionId: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed"],
      default: "pending",
    },
    orderReference: { type: String, default: null },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
const CheckoutDraft = mongoose.models.CheckoutDraft ||
  mongoose.model("CheckoutDraft", checkoutDraftSchema);
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new HttpError(403, "This origin is not allowed to access the PlantCare API."));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "3mb" }));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});

const readSessionToken = (req, cookieName = SESSION_COOKIE) => {
  const cookieHeader = req.headers.cookie || "";
  const sessionCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));

  return sessionCookie ? sessionCookie.slice(cookieName.length + 1) : "";
};

const hashSessionToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const sendSessionCookie = (res, token, cookieName = SESSION_COOKIE) => {
  res.cookie(cookieName, token, {
    ...cookieOptions(),
    ...(cookieName === ADMIN_SESSION_COOKIE ? {} : { maxAge: SESSION_DURATION_MS }),
  });
};

const clearSessionCookie = (res, cookieName = SESSION_COOKIE) => {
  res.clearCookie(cookieName, cookieOptions());
};

const readCookie = (req, name) => {
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? cookie.slice(name.length + 1) : "";
};

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

const currentCustomerId = (req) => req.user?._id || null;

const createSession = async (user, res, cookieName = SESSION_COOKIE) => {
  const token = crypto.randomBytes(32).toString("base64url");
  await Session.create({
    tokenHash: hashSessionToken(token),
    userId: user._id,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
  });
  sendSessionCookie(res, token, cookieName);
};

const findSessionUser = async (req, cookieName = SESSION_COOKIE) => {
  const token = readCookie(req, cookieName);
  if (!token) return null;

  const session = await Session.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;

  return User.findById(session.userId).select("name email role");
};

const getCartToken = (req, res) => {
  let token = readCookie(req, CART_COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) {
    token = crypto.randomBytes(32).toString("base64url");
    res.cookie(CART_COOKIE, token, {
      ...cookieOptions(),
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
  return token;
};

const getCart = async (tokenHash) => {
  let cart = await Cart.findOne({ tokenHash });
  if (!cart) cart = await Cart.create({ tokenHash, items: [] });
  return cart;
};

const publicProduct = (product) => ({
  id: product._id,
  name: product.name,
  category: product.category,
  categories: product.categories,
  price: product.price,
  originalPrice: product.originalPrice ?? product.price,
  rating: product.rating,
  reviewCount: product.reviewCount,
  stock: product.stock,
  image: product.image,
  description: product.description,
  ownerId: product.ownerId ? String(product.ownerId) : null,
});

const publicOrder = (order) => ({
  reference: order.reference,
  name: order.name,
  address: order.address,
  phone: order.phone,
  city: order.city,
  state: order.state,
  pincode: order.pincode,
  payment: order.payment,
  paymentStatus: order.paymentStatus || paymentStatusForOrder(order.payment),
  items: order.items,
  subtotal: order.subtotal,
  delivery: order.delivery,
  total: order.total,
  status: order.status || "Pending",
  userId: order.userId ? String(order.userId) : null,
  date: order.createdAt,
});

const validateCheckoutDetails = (body, acceptedPayments) => {
  const { name, address, phone, city, state: stateName, pincode, payment } = body || {};
  const textFields = [name, address, phone, city, stateName, pincode];
  if (
    textFields.some((value) => typeof value !== "string" || !value.trim()) ||
    name.trim().length > 100 ||
    address.trim().length > 500 ||
    city.trim().length > 100 ||
    stateName.trim().length > 100 ||
    !/^\d{10}$/.test(phone.trim()) ||
    !/^\d{6}$/.test(pincode.trim()) ||
    !acceptedPayments.includes(payment)
  ) {
    throw new HttpError(400, "Enter valid delivery and payment details.");
  }

  return {
    name: name.trim(),
    address: address.trim(),
    phone: phone.trim(),
    city: city.trim(),
    state: stateName.trim(),
    pincode: pincode.trim(),
    payment,
  };
};

const optionalAuthentication = async (req, res, next) => {
  req.user = await findSessionUser(req);
  next();
};

const requireAdmin = async (req, res, next) => {
  req.user = await findSessionUser(req, ADMIN_SESSION_COOKIE);
  if (!req.user) throw new HttpError(401, "Please log in with an administrator account.");
  if (req.user.role !== "admin") throw new HttpError(403, "Administrator access is required.");
  next();
};

const requireStorefrontAccount = async (req, res, next) => {
  req.user = await findSessionUser(req);
  if (!req.user) {
    throw new HttpError(401, "Please log in to place an order or view your orders.");
  }
  if (!["customer", "admin"].includes(req.user.role)) {
    throw new HttpError(403, "Customer access is required.");
  }
  next();
};

const validateProductInput = (body) => {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const price = Number(body?.price);
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const image = typeof body?.image === "string" ? body.image : "";
  const categories = Array.isArray(body?.categories)
    ? body.categories.filter((categoryName) => typeof categoryName === "string").slice(0, 20)
    : [category];

  if (!name || name.length > 100 || !category || category.length > 80 ||
      !Number.isFinite(price) || price <= 0 || description.length > 4000) {
    throw new HttpError(400, "Enter a valid plant name, category, price, and description.");
  }
  if (image.length > 2_800_000) {
    throw new HttpError(400, "Product images must be smaller than 2 MB.");
  }
  return { name, category, categories, price, description, image };
};

const validateAdminProductInput = (body) => {
  const fields = validateProductInput(body);
  const stock = Number(body?.stock);
  const rawCategories = body?.categories === undefined
    ? [fields.category]
    : body.categories;
  if (!Array.isArray(rawCategories) || rawCategories.length > 20 ||
      rawCategories.some((name) => typeof name !== "string" || !name.trim() || name.trim().length > 80)) {
    throw new HttpError(400, "Enter up to 20 valid product categories.");
  }
  const categories = [...new Set(rawCategories.map((name) => name.trim()))];
  const originalPrice = body?.originalPrice === "" || body?.originalPrice == null
    ? null
    : Number(body.originalPrice);
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) {
    throw new HttpError(400, "Stock must be a whole number between 0 and 1,000,000.");
  }
  if (originalPrice !== null &&
      (!Number.isFinite(originalPrice) || originalPrice < 0 || originalPrice > 1_000_000_000)) {
    throw new HttpError(400, "Enter a valid original price.");
  }
  if (fields.price > 1_000_000_000) {
    throw new HttpError(400, "Product price must be no greater than 1,000,000,000.");
  }
  return { ...fields, categories, stock, originalPrice };
};

const publicAdminUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role || "customer",
  createdAt: user.createdAt,
});

const validateCategoryInput = (body) => {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  if (!name || name.length > 80 || description.length > 500) {
    throw new HttpError(400, "Enter a category name up to 80 characters and description up to 500 characters.");
  }
  return { name, description };
};

const ensureProductCategories = async ({ category, categories }) => {
  const names = new Set([category, ...categories]);
  await Category.bulkWrite([...names].map((name) => ({
    updateOne: {
      filter: { name },
      update: { $setOnInsert: { name } },
      upsert: true,
    },
  })));
};

const adminOrder = (order) => ({
  ...publicOrder(order),
  status: order.status || "Pending",
  userId: order.userId ? String(order.userId) : null,
});

app.get("/", (req, res) => {
  res.send("Plant Care Backend is Running!");
});

app.get("/api/products", async (req, res) => {
  const products = await Product.find().sort({ isDefault: -1, name: 1 });
  res.json({ products: products.map(publicProduct) });
});

app.get("/api/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, "Plant not found.");
  res.json({ product: publicProduct(product) });
});

app.post("/api/products", requireAdmin, async (req, res) => {
  const fields = validateProductInput(req.body);
  const product = await Product.create({
    _id: crypto.randomUUID(),
    ...fields,
    stock: 20,
    ownerId: req.user._id,
  });
  res.status(201).json({ product: publicProduct(product) });
});

app.put("/api/products/:id", requireAdmin, async (req, res) => {
  const fields = validateProductInput(req.body);
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user._id, isDefault: false },
    { $set: fields },
    { new: true, runValidators: true }
  );
  if (!product) throw new HttpError(404, "This product is not available in your account.");
  res.json({ product: publicProduct(product) });
});

app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  const product = await Product.findOneAndDelete({
    _id: req.params.id,
    ownerId: req.user._id,
    isDefault: false,
  });
  if (!product) throw new HttpError(404, "This product is not available in your account.");
  res.status(204).end();
});

app.post("/api/admin/auth/login", async (req, res) => {
  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) {
    throw new HttpError(400, "Enter your administrator email and password.");
  }

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || user.role !== "admin" || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, "Incorrect administrator email or password.");
  }
  await createSession(user, res, ADMIN_SESSION_COOKIE);
  res.json({ user: publicAdminUser(user) });
});

app.get("/api/admin/auth/me", requireAdmin, (req, res) => {
  res.json({ user: publicAdminUser(req.user) });
});

app.post("/api/admin/auth/logout", async (req, res) => {
  const token = readSessionToken(req, ADMIN_SESSION_COOKIE);
  clearSessionCookie(res, ADMIN_SESSION_COOKIE);
  if (token) {
    await Session.deleteOne({ tokenHash: hashSessionToken(token) });
  }
  return res.status(204).end();
});

app.get("/api/admin/dashboard", requireAdmin, async (req, res) => {
  res.set("Cache-Control", "no-store");
  const [productCount, primaryCategoryNames, userCount, orderCount, revenue, recentOrders, orderLocations] =
    await Promise.all([
      Product.countDocuments(),
      Product.distinct("category", { category: { $type: "string", $ne: "" } }),
      User.countDocuments(registeredCustomerFilter),
      Order.countDocuments(),
      Order.aggregate([
        { $match: validRevenueOrderMatch },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(6),
      Order.aggregate([
        { $match: validRevenueOrderMatch },
        {
          $group: {
            _id: { city: "$city", state: "$state" },
            orders: { $sum: 1 },
            revenue: { $sum: "$total" },
          },
        },
        { $sort: { orders: -1, revenue: -1 } },
        { $limit: 8 },
      ]),
    ]);
  res.json({
    stats: {
      products: productCount,
      categories: productCount,
      customers: userCount,
      orders: orderCount,
      revenue: revenue[0]?.total || 0,
    },
    recentOrders: recentOrders.map(adminOrder),
    orderLocations: orderLocations.map((location) => ({
      city: location._id.city,
      state: location._id.state,
      orders: location.orders,
      revenue: location.revenue,
    })),
  });
});

app.get("/api/admin/products", requireAdmin, async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1, name: 1 });
  res.json({ products: products.map(publicProduct) });
});

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  const fields = validateAdminProductInput(req.body);
  await ensureProductCategories(fields);
  const product = await Product.create({
    _id: crypto.randomUUID(),
    ...fields,
    ownerId: req.user._id,
    isDefault: false,
  });
  res.status(201).json({ product: publicProduct(product) });
});

app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const fields = validateAdminProductInput(req.body);
  if (!await Product.exists({ _id: req.params.id })) {
    throw new HttpError(404, "Plant not found.");
  }
  await ensureProductCategories(fields);
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: fields },
    { new: true, runValidators: true }
  );
  if (!product) throw new HttpError(404, "Plant not found.");
  res.json({ product: publicProduct(product) });
});

app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, "Plant not found.");
  res.status(204).end();
});

app.get("/api/admin/categories", requireAdmin, async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ categories });
});

app.post("/api/admin/categories", requireAdmin, async (req, res) => {
  const fields = validateCategoryInput(req.body);
  try {
    const category = await Category.create(fields);
    return res.status(201).json({ category });
  } catch (error) {
    if (error.code === 11000) throw new HttpError(409, "A category with this name already exists.");
    throw error;
  }
});

app.put("/api/admin/categories/:id", requireAdmin, async (req, res) => {
  const fields = validateCategoryInput(req.body);
  try {
    const existingCategory = await Category.findById(req.params.id);
    if (!existingCategory) throw new HttpError(404, "Category not found.");
    const previousName = existingCategory.name;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: fields },
      { new: true, runValidators: true }
    );
    if (previousName !== fields.name) {
      await Product.updateMany(
        { category: previousName },
        { $set: { category: fields.name } }
      );
      const productsWithCategory = await Product.find({ categories: previousName });
      await Promise.all(productsWithCategory.map((product) => {
        product.categories = [...new Set(product.categories.map((name) =>
          name === previousName ? fields.name : name
        ))];
        return product.save();
      }));
    }
    return res.json({ category });
  } catch (error) {
    if (error.code === 11000) throw new HttpError(409, "A category with this name already exists.");
    throw error;
  }
});

app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, "Category not found.");
  const usedByProduct = await Product.exists({
    $or: [{ category: category.name }, { categories: category.name }],
  });
  if (usedByProduct) {
    throw new HttpError(409, "This category is used by plants. Reassign those plants before deleting it.");
  }
  await category.deleteOne();
  res.status(204).end();
});

app.get("/api/admin/users", requireAdmin, async (req, res) => {
  const users = await User.find(registeredCustomerFilter)
    .sort({ createdAt: -1 })
    .select("name email role createdAt");
  res.json({ users: users.map(publicAdminUser) });
});

app.post("/api/admin/users", requireAdmin, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const role = req.body?.role;
  if (!name || name.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      password.length < 8 || password.length > 128 ||
      !["customer", "admin"].includes(role)) {
    throw new HttpError(400, "Enter a valid name, email, password, and account role.");
  }
  try {
    const user = await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
    });
    res.status(201).json({ user: publicAdminUser(user) });
  } catch (error) {
    if (error.code === 11000) throw new HttpError(409, "An account with this email already exists.");
    throw error;
  }
});

app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "";
  const role = req.body?.role;
  if (!name || name.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      !["customer", "admin"].includes(role)) {
    throw new HttpError(400, "Enter a valid name, email, and account role.");
  }
  if (String(req.user._id) === req.params.id && role !== "admin") {
    throw new HttpError(400, "You cannot remove your own administrator access.");
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { name, email, role } },
      { new: true, runValidators: true }
    );
    if (!user) throw new HttpError(404, "User not found.");
    res.json({ user: publicAdminUser(user) });
  } catch (error) {
    if (error.code === 11000) throw new HttpError(409, "An account with this email already exists.");
    throw error;
  }
});

app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
  if (String(req.user._id) === req.params.id) {
    throw new HttpError(400, "You cannot delete your own administrator account.");
  }
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, "User not found.");
  if (user.role === "admin" && await User.countDocuments({ role: "admin" }) <= 1) {
    throw new HttpError(409, "The last administrator account cannot be deleted.");
  }
  await Promise.all([
    Session.deleteMany({ userId: user._id }),
    User.deleteOne({ _id: user._id }),
  ]);
  res.status(204).end();
});

app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json({ orders: orders.map(adminOrder) });
});

app.put("/api/admin/orders/:reference", requireAdmin, async (req, res) => {
  const allowedStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
  if (!allowedStatuses.includes(req.body?.status)) {
    throw new HttpError(400, "Select a valid order status.");
  }
  const order = await Order.findOneAndUpdate(
    { reference: req.params.reference },
    { $set: { status: req.body.status } },
    { new: true, runValidators: true }
  );
  if (!order) throw new HttpError(404, "Order not found.");
  res.json({ order: adminOrder(order) });
});

app.get("/api/cart", async (req, res) => {
  const token = getCartToken(req, res);
  const cart = await getCart(hashSessionToken(token));
  const products = await Product.find({
    _id: { $in: cart.items.map((item) => item.productId) },
  });
  const productMap = new Map(products.map((product) => [product.id, publicProduct(product)]));
  res.json({
    items: cart.items.flatMap((item) => {
      const product = productMap.get(item.productId);
      return product ? [{ ...product, quantity: item.quantity }] : [];
    }),
  });
});

app.post("/api/cart/items", async (req, res) => {
  const productId = typeof req.body?.productId === "string" ? req.body.productId : "";
  const quantity = Number(req.body?.quantity);
  if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new HttpError(400, "Enter a valid plant and quantity.");
  }
  const product = await Product.findById(productId);
  if (!product) throw new HttpError(404, "Plant not found.");
  const token = getCartToken(req, res);
  const cart = await getCart(hashSessionToken(token));
  const existing = cart.items.find((item) => item.productId === productId);
  if (!existing) {
    if (quantity > product.stock) throw new HttpError(400, "The requested quantity is not in stock.");
    cart.items.push({ productId, quantity });
    await cart.save();
  }
  res.json({
    alreadyInCart: Boolean(existing),
    items: cart.items,
  });
});

app.put("/api/cart/items/:productId", async (req, res) => {
  const quantity = Number(req.body?.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new HttpError(400, "Enter a quantity between 1 and 20.");
  }
  const product = await Product.findById(req.params.productId);
  if (!product) throw new HttpError(404, "Plant not found.");
  if (quantity > product.stock) throw new HttpError(400, "The requested quantity is not in stock.");
  const token = getCartToken(req, res);
  const cart = await getCart(hashSessionToken(token));
  const item = cart.items.find((entry) => entry.productId === req.params.productId);
  if (item) item.quantity = quantity;
  else cart.items.push({ productId: req.params.productId, quantity });
  await cart.save();
  res.json({ items: cart.items });
});

app.delete("/api/cart/items/:productId", async (req, res) => {
  const token = getCartToken(req, res);
  const cart = await getCart(hashSessionToken(token));
  cart.items = cart.items.filter((item) => item.productId !== req.params.productId);
  await cart.save();
  res.json({ items: cart.items });
});

app.post("/api/checkout/session", requireStorefrontAccount, async (req, res) => {
  const details = validateCheckoutDetails(req.body, ["Card"]);
  const token = getCartToken(req, res);
  const cartTokenHash = hashSessionToken(token);
  const cart = await getCart(cartTokenHash);
  if (cart.items.length === 0) throw new HttpError(400, "Your cart is empty.");

  const products = await Product.find({
    _id: { $in: cart.items.map((item) => item.productId) },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const orderItems = cart.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product || item.quantity > product.stock) {
      throw new HttpError(409, `${product?.name || "A plant"} is no longer available in that quantity.`);
    }
    return {
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: item.quantity,
    };
  });
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = 50;
  const total = subtotal + delivery;
  const draft = await CheckoutDraft.create({
    ...details,
    cartTokenHash,
    userId: req.user._id,
    items: orderItems,
    subtotal,
    delivery,
    total,
    expiresAt: new Date(Date.now() + 26 * 60 * 60 * 1000),
  });

  let stripeSession;
  try {
    stripeSession = await getStripeClient().checkout.sessions.create({
      mode: "payment",
      allowed_payment_method_types: ["card"],
      line_items: [
        ...orderItems.map((item) => ({
          price_data: {
            currency: "inr",
            product_data: { name: item.name },
            unit_amount: toStripeAmount(item.price),
          },
          quantity: item.quantity,
        })),
        {
          price_data: {
            currency: "inr",
            product_data: { name: "Delivery" },
            unit_amount: toStripeAmount(delivery),
          },
          quantity: 1,
        },
      ],
      client_reference_id: String(draft._id),
      metadata: { checkoutDraftId: String(draft._id) },
      success_url: getCheckoutFrontendUrl(
        `/order-confirmation?session_id={CHECKOUT_SESSION_ID}`
      ),
      cancel_url: getCheckoutFrontendUrl("/checkout?payment=cancelled"),
    });
    if (!stripeSession.url) throw new HttpError(502, "Stripe did not provide a checkout URL.");
    draft.stripeSessionId = stripeSession.id;
    await draft.save();
    return res.status(201).json({ url: stripeSession.url });
  } catch (error) {
    if (stripeSession) {
      try {
        await getStripeClient().checkout.sessions.expire(stripeSession.id);
      } catch (expireError) {
        console.error("Unable to expire an incomplete Stripe checkout session.", expireError);
      }
    }
    await CheckoutDraft.deleteOne({ _id: draft._id });
    if (
      error.type === "StripeInvalidRequestError" &&
      error.message?.includes("No valid payment method types for this Checkout Session")
    ) {
      throw new HttpError(
        503,
        "The selected payment method is not available for this Stripe account. Enable it in Stripe or choose another payment method."
      );
    }
    throw error;
  }
});

app.post("/api/checkout/complete", async (req, res) => {
  const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId : "";
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    throw new HttpError(400, "A valid Stripe checkout session is required.");
  }

  const token = readCookie(req, CART_COOKIE);
  if (!token) throw new HttpError(404, "Checkout session not found.");
  const cartTokenHash = hashSessionToken(token);
  const draft = await CheckoutDraft.findOne({
    stripeSessionId: sessionId,
    cartTokenHash,
  });
  if (!draft) throw new HttpError(404, "Checkout session not found.");

  let session;
  try {
    session = await getStripeClient().checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error("Unable to verify the Stripe checkout session.", error);
    throw new HttpError(502, "We couldn't verify your payment. Please try again.");
  }
  const verifiedOrderUpdate = verifiedStripeOrderUpdate(session, draft);
  if (!verifiedOrderUpdate) {
    throw new HttpError(402, "Payment has not been confirmed. Please complete payment before continuing.");
  }

  const existingOrder = await Order.findOneAndUpdate(
    verifiedOrderUpdate.filter,
    verifiedOrderUpdate.update,
    { new: true }
  );
  if (existingOrder) {
    draft.orderReference = existingOrder.reference;
    draft.status = "completed";
    await draft.save();
    return res.json({ order: publicOrder(existingOrder) });
  }
  const claimedDraft = await CheckoutDraft.findOneAndUpdate(
    { _id: draft._id, status: "pending", stripeSessionId: sessionId },
    { $set: { status: "processing" } },
    { new: true }
  );
  if (!claimedDraft) {
    throw new HttpError(409, "This order is already being completed. Please refresh in a moment.");
  }

  const decremented = [];
  let order;
  try {
    for (const item of claimedDraft.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) throw new HttpError(409, `${item.name} is no longer available in that quantity.`);
      decremented.push(item);
    }

    order = await Order.create({
      reference: `PC-${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
      cartTokenHash: claimedDraft.cartTokenHash,
      userId: claimedDraft.userId,
      name: claimedDraft.name,
      address: claimedDraft.address,
      phone: claimedDraft.phone,
      city: claimedDraft.city,
      state: claimedDraft.state,
      pincode: claimedDraft.pincode,
      payment: claimedDraft.payment,
      paymentStatus: verifiedOrderUpdate.update.$set.paymentStatus,
      stripeSessionId: sessionId,
      items: claimedDraft.items,
      subtotal: claimedDraft.subtotal,
      delivery: claimedDraft.delivery,
      total: claimedDraft.total,
    });
    claimedDraft.orderReference = order.reference;
    claimedDraft.status = "completed";
    await claimedDraft.save();

    const cart = await Cart.findOne({ tokenHash: claimedDraft.cartTokenHash });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return res.status(201).json({ order: publicOrder(order) });
  } catch (error) {
    if (order) {
      claimedDraft.orderReference = order.reference;
      claimedDraft.status = "completed";
      await claimedDraft.save();
      return res.status(201).json({ order: publicOrder(order) });
    }
    await Promise.all(decremented.map((item) =>
      Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } })
    ));
    claimedDraft.status = "pending";
    await claimedDraft.save();
    throw error;
  }
});

app.post("/api/checkout", requireStorefrontAccount, async (req, res) => {
  const details = validateCheckoutDetails(req.body, ["COD"]);
  const token = getCartToken(req, res);
  const cartTokenHash = hashSessionToken(token);
  const cart = await getCart(cartTokenHash);
  if (cart.items.length === 0) throw new HttpError(400, "Your cart is empty.");
  const products = await Product.find({
    _id: { $in: cart.items.map((item) => item.productId) },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const orderItems = cart.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product || item.quantity > product.stock) {
      throw new HttpError(409, `${product?.name || "A plant"} is no longer available in that quantity.`);
    }
    return {
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: item.quantity,
    };
  });

  const decremented = [];
  try {
    for (const item of orderItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) throw new HttpError(409, `${item.name} is no longer available in that quantity.`);
      decremented.push(item);
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await Order.create({
      reference: `PC-${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
      cartTokenHash,
      userId: req.user._id,
      ...details,
      items: orderItems,
      subtotal,
      delivery: 50,
      total: subtotal + 50,
    });
    cart.items = [];
    await cart.save();
    return res.status(201).json({ order: publicOrder(order) });
  } catch (error) {
    await Promise.all(decremented.map((item) =>
      Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } })
    ));
    throw error;
  }
});

app.get("/api/orders/me", requireStorefrontAccount, async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders: orders.map(publicOrder) });
});

app.get("/api/orders/:reference", async (req, res) => {
  const token = readCookie(req, CART_COOKIE);
  if (!token) throw new HttpError(404, "Order not found.");
  const order = await Order.findOne({
    reference: req.params.reference,
    cartTokenHash: hashSessionToken(token),
  });
  if (!order) throw new HttpError(404, "Order not found.");
  res.json({ order: publicOrder(order) });
});

app.post("/api/auth/signup", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!name || name.length > 100) {
    return res.status(400).json({ message: "Enter a name of 1 to 100 characters." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ message: "Password must be between 8 and 128 characters." });
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await User.create({ name, email, passwordHash });
    await createSession(user, res);
    return res.status(201).json({
      message: "Your account has been created.",
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    throw error;
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    return res.status(400).json({ message: "Enter your email and password." });
  }

  const user = await User.findOne({ email }).select("+passwordHash");
  if (
    !user ||
    !["customer", "admin"].includes(user.role) ||
    !(await verifyPassword(password, user.passwordHash))
  ) {
    return res.status(401).json({ message: "Incorrect email or password." });
  }

  await createSession(user, res);
  return res.json({ user: publicUser(user) });
});

app.get("/api/auth/me", async (req, res) => {
  const user = await findSessionUser(req);
  if (!user || !["customer", "admin"].includes(user.role)) {
    clearSessionCookie(res);
    return res.status(401).json({ message: "You are not logged in." });
  }
  return res.json({ user: publicUser(user) });
});

app.post("/api/auth/logout", async (req, res) => {
  const token = readSessionToken(req);
  clearSessionCookie(res);
  if (token) {
    await Session.deleteOne({ tokenHash: hashSessionToken(token) });
  }
  return res.status(204).end();
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  console.error("PlantCare API request failed.", error);
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (error.type === "entity.too.large") {
    res.status(413).json({ message: "The request is too large." });
    return;
  }
  if (error.status === 400) {
    res.status(400).json({ message: "Request body must be valid JSON." });
    return;
  }
  res.status(500).json({
    message: "The request could not be completed. Please try again.",
  });
});

const startServer = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required. Configure it in backend/.env before starting the API.");
  }

  const adminEmail = readAdminSetting("ADMIN_EMAIL")?.trim().toLowerCase();
  const adminPassword = readAdminSetting("ADMIN_PASSWORD");
  const adminName = readAdminSetting("ADMIN_NAME")?.trim() || "Admin";
  if (Boolean(adminEmail) !== Boolean(adminPassword)) {
    throw new Error("Set both ADMIN_EMAIL and ADMIN_PASSWORD to provision a PlantCare administrator.");
  }
  if (adminName.length > 100) {
    throw new Error("ADMIN_NAME must be no longer than 100 characters.");
  }
  if (adminEmail) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) || adminEmail.length > 254 ||
        adminPassword.length < 12 || adminPassword.length > 128) {
      throw new Error("ADMIN_EMAIL must be valid and ADMIN_PASSWORD must be between 12 and 128 characters.");
    }
  }

  await mongoose.connect(process.env.MONGODB_URI);
  await User.updateMany(
    { $or: [{ role: { $exists: false } }, { role: null }] },
    { $set: { role: "customer" } }
  );
  const defaultPlants = require("./plants");
  if (adminEmail) {
    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          name: adminName,
          email: adminEmail,
          passwordHash: await hashPassword(adminPassword),
          role: "admin",
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
  } else {
    console.warn("No administrator configured. Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in backend/.env.");
  }
  await Product.bulkWrite(defaultPlants.map((plant) => ({
    updateOne: {
      filter: { _id: plant._id },
      update: { $setOnInsert: plant },
      upsert: true,
    },
  })));
  const categoryNames = new Set(defaultPlants.flatMap((plant) => [
    plant.category,
    ...(plant.categories || []),
  ]));
  await Category.bulkWrite([...categoryNames].map((name) => ({
    updateOne: {
      filter: { name },
      update: { $setOnInsert: { name } },
      upsert: true,
    },
  })));
  app.listen(PORT, () => {
    console.log(`PlantCare API connected to MongoDB and listening on port ${PORT}.`);
  });
};

startServer().catch((error) => {
  console.error("Unable to start the PlantCare API.", error);
  process.exitCode = 1;
});
