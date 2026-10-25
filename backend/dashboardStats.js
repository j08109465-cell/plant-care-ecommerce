const testOrDebugAccountPattern =
  /(?:^|[^a-z0-9])(?:test|debug)(?:[^a-z0-9]|$)/i;

const registeredCustomerFilter = {
  role: "customer",
  $nor: [
    { email: /@example\.com$/i },
    { email: testOrDebugAccountPattern },
    { name: testOrDebugAccountPattern },
  ],
};

const validRevenueOrderMatch = {
  status: { $ne: "Cancelled" },
  paymentStatus: { $ne: "Failed" },
};

const isRegisteredCustomer = (account) =>
  account?.role === "customer" &&
  !/@example\.com$/i.test(account.email || "") &&
  !testOrDebugAccountPattern.test(account.email || "") &&
  !testOrDebugAccountPattern.test(account.name || "");

module.exports = {
  isRegisteredCustomer,
  registeredCustomerFilter,
  validRevenueOrderMatch,
};
