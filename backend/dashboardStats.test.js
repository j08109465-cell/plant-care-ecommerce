const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  isRegisteredCustomer,
  registeredCustomerFilter,
  validRevenueOrderMatch,
} = require("./dashboardStats");

test("counts only genuine customer accounts", () => {
  assert.equal(isRegisteredCustomer({ role: "customer", name: "Riya", email: "riya@mail.com" }), true);
  assert.equal(isRegisteredCustomer({ role: "admin", name: "Riya", email: "riya@mail.com" }), false);
  assert.equal(isRegisteredCustomer({ role: "customer", name: "Test User", email: "test@mail.com" }), false);
  assert.equal(isRegisteredCustomer({ role: "customer", name: "Riya", email: "riya@example.com" }), false);
  assert.equal(isRegisteredCustomer({ role: "customer", name: "Riya", email: "debug+1@mail.com" }), false);
});

test("Mongo customer count filter excludes admins and test accounts", () => {
  assert.equal(registeredCustomerFilter.role, "customer");
  assert.equal(registeredCustomerFilter.$nor.length, 3);
});

test("revenue excludes cancelled and failed orders", () => {
  assert.deepEqual(validRevenueOrderMatch, {
    status: { $ne: "Cancelled" },
    paymentStatus: { $ne: "Failed" },
  });
});
