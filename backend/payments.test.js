const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  isVerifiedStripeSession,
  paymentStatusForOrder,
  stripePaymentMethodType,
  toStripeAmount,
  verifiedStripeOrderUpdate,
  verifiedStripePaymentStatus,
} = require("./payments");

const draft = {
  _id: "draft-123",
  stripeSessionId: "cs_test_123",
  payment: "Card",
  total: 125.5,
};

const paidSession = {
  id: "cs_test_123",
  client_reference_id: "draft-123",
  metadata: { checkoutDraftId: "draft-123" },
  status: "complete",
  payment_status: "paid",
  currency: "inr",
  amount_total: 12550,
  payment_method_types: ["card"],
};

test("supports Card as the only online checkout choice", () => {
  assert.equal(stripePaymentMethodType("Card"), "card");
  assert.throws(() => stripePaymentMethodType("COD"), TypeError);
  assert.throws(() => stripePaymentMethodType("UPI"), TypeError);
});

test("converts INR amounts to paise", () => {
  assert.equal(toStripeAmount(125.5), 12550);
  assert.throws(() => toStripeAmount(0), TypeError);
});

test("accepts only a completed, paid session matching its draft and total", () => {
  assert.equal(isVerifiedStripeSession(paidSession, draft), true);
  assert.equal(
    isVerifiedStripeSession({ ...paidSession, payment_status: "unpaid" }, draft),
    false
  );
  assert.equal(
    isVerifiedStripeSession({ ...paidSession, amount_total: 12549 }, draft),
    false
  );
  assert.equal(
    isVerifiedStripeSession({ ...paidSession, currency: "usd" }, draft),
    false
  );
  assert.equal(
    isVerifiedStripeSession({ ...paidSession, metadata: {} }, draft),
    false
  );
  assert.equal(
    isVerifiedStripeSession({ ...paidSession, payment_method_types: ["card", "link"] }, draft),
    false
  );
});

test("marks card orders paid only for a verified Stripe payment", () => {
  const paidCardSession = paidSession;
  assert.equal(isVerifiedStripeSession(paidCardSession, draft), true);
  assert.equal(paymentStatusForOrder("Card", true), "Paid");
  assert.equal(
    verifiedStripePaymentStatus(paidCardSession, draft),
    "Paid"
  );
  assert.equal(
    isVerifiedStripeSession(
      { ...paidCardSession, payment_status: "unpaid" },
      draft
    ),
    false
  );
  assert.equal(
    verifiedStripePaymentStatus(
      { ...paidCardSession, payment_status: "unpaid" },
      draft
    ),
    null
  );
  assert.equal(paymentStatusForOrder("Card"), "Failed");
  assert.equal(
    isVerifiedStripeSession(
      { ...paidCardSession, status: "expired" },
      draft
    ),
    false
  );
  assert.equal(
    verifiedStripePaymentStatus(
      { ...paidCardSession, status: "expired" },
      draft
    ),
    null
  );
  assert.equal(paymentStatusForOrder("Card"), "Failed");
});

test("reconciles an existing failed Stripe order after payment is verified", () => {
  const paidCardSession = { ...paidSession, payment_method_types: ["card"] };
  const update = verifiedStripeOrderUpdate(
    paidCardSession,
    draft
  );
  assert.deepEqual(update, {
    filter: {
      stripeSessionId: paidCardSession.id,
      payment: "Card",
      total: draft.total,
    },
    update: { $set: { paymentStatus: "Paid" } },
  });

  const storedOrder = { paymentStatus: "Failed" };
  Object.assign(storedOrder, update.update.$set);
  assert.equal(storedOrder.paymentStatus, "Paid");
});

test("keeps COD orders pending until payment is collected", () => {
  assert.equal(paymentStatusForOrder("COD"), "Pending");
});
