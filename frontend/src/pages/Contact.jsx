export default function Contact() {
  return (
    <div className="py-3">
      <h2 className="mb-2">Contact</h2>
      <p className="text-secondary">
        Need help with an order or product? Reach out and our support team will
        assist you.
      </p>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="mb-2">
            <strong>Email:</strong> support@ministore.com
          </div>
          <div className="mb-2">
            <strong>Phone:</strong> +91 99999 99999
          </div>
          <div className="mb-0">
            <strong>Location:</strong> Pune, India
          </div>
        </div>
      </div>
    </div>
  );
}
