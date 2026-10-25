const stripePaymentMethodType = (payment) => {
  if (payment === "Card") return "card";
  throw new TypeError("Select Card to pay online.");
};

const toStripeAmount = (amount) => {
  const amountInPaise = Math.round(Number(amount) * 100);
  if (!Number.isSafeInteger(amountInPaise) || amountInPaise < 1) {
    throw new TypeError("Payment amounts must be positive INR values.");
  }
  return amountInPaise;
};

const paymentStatusForOrder = (payment, stripePaymentConfirmed = false) => {
  if (payment === "COD") return "Pending";
  return payment === "Card" && stripePaymentConfirmed ? "Paid" : "Failed";
};

const isVerifiedStripeSession = (session, draft) =>
  session?.id === draft.stripeSessionId &&
  session.client_reference_id === String(draft._id) &&
  session.metadata?.checkoutDraftId === String(draft._id) &&
  session.status === "complete" &&
  session.payment_status === "paid" &&
  session.currency === "inr" &&
  session.amount_total === toStripeAmount(draft.total) &&
  session.payment_method_types?.length === 1 &&
  session.payment_method_types[0] === stripePaymentMethodType(draft.payment);

const verifiedStripePaymentStatus = (session, draft) =>
  isVerifiedStripeSession(session, draft)
    ? paymentStatusForOrder(draft.payment, true)
    : null;

const verifiedStripeOrderUpdate = (session, draft) => {
  const paymentStatus = verifiedStripePaymentStatus(session, draft);
  if (!paymentStatus) return null;
  return {
    filter: {
      stripeSessionId: session.id,
      payment: draft.payment,
      total: draft.total,
    },
    update: { $set: { paymentStatus } },
  };
};

module.exports = {
  isVerifiedStripeSession,
  paymentStatusForOrder,
  stripePaymentMethodType,
  toStripeAmount,
  verifiedStripeOrderUpdate,
  verifiedStripePaymentStatus,
};
