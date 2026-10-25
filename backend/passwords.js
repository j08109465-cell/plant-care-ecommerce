const crypto = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(crypto.scrypt);

const hashPassword = async (password) => {
  if (typeof password !== "string") {
    throw new TypeError("Password must be a string.");
  }

  const salt = crypto.randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
};

const verifyPassword = async (password, storedHash) => {
  if (typeof password !== "string" || typeof storedHash !== "string") {
    return false;
  }

  const parts = storedHash.split(":");
  if (parts.length !== 2) {
    return false;
  }

  const [saltHex, keyHex] = parts;
  if (
    saltHex.length !== 32 ||
    keyHex.length !== 128 ||
    !/^[a-f0-9]+$/i.test(saltHex + keyHex)
  ) {
    return false;
  }

  try {
    const expectedKey = Buffer.from(keyHex, "hex");
    const actualKey = await scrypt(
      password,
      Buffer.from(saltHex, "hex"),
      expectedKey.length,
      { N: 16384, r: 8, p: 1 }
    );
    return expectedKey.length === actualKey.length && crypto.timingSafeEqual(expectedKey, actualKey);
  } catch {
    return false;
  }
};

module.exports = { hashPassword, verifyPassword };
