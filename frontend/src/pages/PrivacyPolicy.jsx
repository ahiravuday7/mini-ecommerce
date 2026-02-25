export default function PrivacyPolicy() {
  return (
    <div className="py-3">
      <h2 className="mb-2">Privacy Policy</h2>
      <p className="text-secondary">
        Your privacy is important to us. We collect only the information needed
        to process orders, improve service quality, and provide support.
      </p>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="mb-2">What we collect</h5>
          <ul className="mb-3">
            <li>Name and contact details</li>
            <li>Order and payment transaction data</li>
            <li>Basic usage analytics</li>
          </ul>

          <h5 className="mb-2">How we use data</h5>
          <ul className="mb-0">
            <li>Order fulfillment and delivery updates</li>
            <li>Customer support and account security</li>
            <li>Improving store performance and usability</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
