import React from "react";

export default function Shipping() {
  return (
    <div className="container py-5">
      <div className="mb-4">
        <h1 className="fw-bold">Shipping Policy</h1>
        <p className="text-muted mb-0">
          Learn how MiniStore processes, ships, and delivers your orders.
        </p>
      </div>

      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-4 p-md-5">
          <section className="mb-5">
            <h4 className="fw-semibold mb-3">1. Order Processing</h4>
            <p className="text-secondary">
              All orders are processed within <strong>1–2 business days</strong>{" "}
              after payment confirmation. Orders are not shipped on Sundays or
              public holidays. Once shipped, you will receive an email or SMS
              with tracking details.
            </p>
          </section>

          <section className="mb-5">
            <h4 className="fw-semibold mb-3">2. Estimated Delivery Time</h4>
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Location</th>
                    <th>Delivery Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Metro Cities</td>
                    <td>2–4 business days</td>
                  </tr>
                  <tr>
                    <td>Other Cities</td>
                    <td>3–6 business days</td>
                  </tr>
                  <tr>
                    <td>Remote Areas</td>
                    <td>5–8 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-secondary mb-0">
              Delivery timelines may vary depending on courier availability,
              weather, and regional service conditions.
            </p>
          </section>

          <section className="mb-5">
            <h4 className="fw-semibold mb-3">3. Shipping Charges</h4>
            <ul className="text-secondary ps-3">
              <li>
                Free shipping on orders above <strong>₹999</strong>
              </li>
              <li>
                Standard shipping charge of <strong>₹79</strong> for orders
                below ₹999
              </li>
            </ul>
          </section>

          <section className="mb-5">
            <h4 className="fw-semibold mb-3">4. Order Tracking</h4>
            <p className="text-secondary">
              After dispatch, you can track your order from{" "}
              <strong>My Orders → Order Details</strong>. Tracking details
              include:
            </p>
            <ul className="text-secondary ps-3">
              <li>Tracking ID</li>
              <li>Courier partner name</li>
              <li>Estimated delivery date</li>
            </ul>
          </section>

          <section>
            <h4 className="fw-semibold mb-3">5. Need Help?</h4>
            <p className="text-secondary mb-2">
              For shipping-related concerns, contact us:
            </p>
            <p className="mb-1">
              <strong>Email:</strong> support@ministore.com
            </p>
            <p className="mb-1">
              <strong>Phone:</strong> +91 99999 99999
            </p>
            <p className="mb-0">
              <strong>Location:</strong> Pune, India
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
