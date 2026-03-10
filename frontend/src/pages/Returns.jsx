import React from "react";

export default function Returns() {
  return (
    <div className="container py-5">
      <div className="mb-4">
        <h1 className="fw-bold">Returns & Refund Policy</h1>
        <p className="text-muted mb-0">
          Easy returns and transparent refunds for a better shopping experience.
        </p>
      </div>

      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-4 p-md-5">
          <section className="mb-5">
            <h4 className="fw-semibold mb-3">1. Return Window</h4>
            <p className="text-secondary">
              You can request a return within{" "}
              <strong>7 days of delivery</strong>.
            </p>
          </section>

          <section className="mb-5">
            <h4 className="fw-semibold mb-3">2. Return Eligibility</h4>
            <p className="text-secondary">
              To be eligible for return, the product must be:
            </p>
            <ul className="text-secondary ps-3">
              <li>Unused and in original condition</li>
              <li>Returned with original packaging and tags</li>
              <li>Accompanied by invoice or proof of purchase</li>
            </ul>

            <p className="text-secondary mt-3 mb-2">
              Returns are not accepted for:
            </p>
            <ul className="text-secondary ps-3">
              <li>Used or damaged products due to customer misuse</li>
              <li>Items without original packaging</li>
              <li>Digital or downloadable products</li>
            </ul>
          </section>

          <section className="mb-5">
            <h4 className="fw-semibold mb-3">3. How to Request a Return</h4>
            <ol className="text-secondary ps-3">
              <li>
                Go to <strong>My Orders</strong>
              </li>
              <li>Select the order you want to return</li>
              <li>
                Click <strong>Request Return</strong>
              </li>
              <li>Select the reason for return</li>
              <li>Submit your request</li>
            </ol>
            <p className="text-secondary mb-0">
              Our support team will review your request within{" "}
              <strong>24–48 hours</strong>.
            </p>
          </section>

          <section className="mb-5">
            <h4 className="fw-semibold mb-3">4. Refund Timeline</h4>
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Payment Method</th>
                    <th>Refund Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>UPI / Wallet</td>
                    <td>2–3 business days</td>
                  </tr>
                  <tr>
                    <td>Debit / Credit Card</td>
                    <td>5–7 business days</td>
                  </tr>
                  <tr>
                    <td>Net Banking</td>
                    <td>3–5 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-secondary mb-0">
              Refunds are credited to the original payment method after
              successful inspection.
            </p>
          </section>

          <section>
            <h4 className="fw-semibold mb-3">
              5. Damaged or Defective Products
            </h4>
            <p className="text-secondary">
              If you receive a damaged, defective, or wrong product, please
              contact us immediately. Eligible cases may qualify for a{" "}
              <strong>free replacement or full refund</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
