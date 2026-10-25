const assert = require("node:assert/strict");
const { test } = require("node:test");
const { hashPassword, verifyPassword } = require("./passwords");

test("passwords are salted and verify only against the correct password", async () => {
  const password = "correct horse battery";
  const firstHash = await hashPassword(password);
  const secondHash = await hashPassword(password);

  assert.notEqual(firstHash, secondHash);
  assert.notEqual(firstHash, password);
  assert.equal(await verifyPassword(password, firstHash), true);
  assert.equal(await verifyPassword("incorrect password", firstHash), false);
});

test("malformed password hashes do not authenticate", async () => {
  assert.equal(await verifyPassword("password", "not-a-password-hash"), false);
  assert.equal(await verifyPassword("password", "00:01"), false);
});
