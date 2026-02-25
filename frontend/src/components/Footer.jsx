import { Link } from "react-router-dom";
import "./footer.css";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-premium text-light mt-5">
      <div className="footer-main py-5">
        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="brand-dot" />
                <h4 className="mb-0 fw-bold">MiniStore</h4>
              </div>

              <p className="text-white-50 mb-3">
                A clean, fast, and secure shopping experience - built for modern
                e-commerce.
              </p>

              <div className="d-flex gap-2">
                <a className="social-btn" href="#" aria-label="Instagram">
                  <i className="bi bi-instagram" />
                </a>
                <a className="social-btn" href="#" aria-label="Facebook">
                  <i className="bi bi-facebook" />
                </a>
                <a className="social-btn" href="#" aria-label="Twitter/X">
                  <i className="bi bi-twitter-x" />
                </a>
                <a className="social-btn" href="#" aria-label="LinkedIn">
                  <i className="bi bi-linkedin" />
                </a>
              </div>
            </div>

            <div className="col-6 col-lg-2">
              <h6 className="fw-semibold">Shop</h6>
              <ul className="list-unstyled footer-links">
                <li>
                  <Link to="/">All Products</Link>
                </li>
                <li>
                  <Link to="/cart">Cart</Link>
                </li>
                <li>
                  <Link to="/orders">My Orders</Link>
                </li>
              </ul>
            </div>

            <div className="col-6 col-lg-2">
              <h6 className="fw-semibold">Company</h6>
              <ul className="list-unstyled footer-links">
                <li>
                  <Link to="/about">About</Link>
                </li>
                <li>
                  <Link to="/careers">Careers</Link>
                </li>
                <li>
                  <Link to="/contact">Contact</Link>
                </li>
              </ul>
            </div>

            <div className="col-6 col-lg-2">
              <h6 className="fw-semibold">Support</h6>
              <ul className="list-unstyled footer-links">
                <li>
                  <a href="#">FAQs</a>
                </li>
                <li>
                  <a href="#">Shipping</a>
                </li>
                <li>
                  <a href="#">Returns</a>
                </li>
                <li>
                  <Link to="/privacy-policy">Privacy Policy</Link>
                </li>
              </ul>
            </div>

            <div className="col-6 col-lg-2">
              <h6 className="fw-semibold">Reach us</h6>
              <div className="text-white-50 small">
                <div className="d-flex gap-2 align-items-start mb-2">
                  <i className="bi bi-envelope-at mt-1" />
                  <span>support@ministore.com</span>
                </div>
                <div className="d-flex gap-2 align-items-start mb-2">
                  <i className="bi bi-telephone mt-1" />
                  <span>+91 99999 99999</span>
                </div>
                <div className="d-flex gap-2 align-items-start">
                  <i className="bi bi-geo-alt mt-1" />
                  <span>Pune, India</span>
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-5 align-items-center gy-3">
            <div className="col-lg-6">
              <div className="d-flex flex-wrap gap-2">
                <span className="pay-pill">VISA</span>
                <span className="pay-pill">Mastercard</span>
                <span className="pay-pill">UPI</span>
                <span className="pay-pill">RuPay</span>
                <span className="pay-pill">NetBanking</span>
              </div>
            </div>

            <div className="col-lg-6 text-lg-end">
              <button
                className="btn btn-outline-light btn-sm"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <i className="bi bi-arrow-up" /> Back to top
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom py-3">
        <div className="container d-flex flex-column flex-md-row gap-2 justify-content-between align-items-center">
          <div className="small text-white-50">
            (c) {year} MiniStore. All rights reserved.
          </div>
          <div className="small text-white-50">Built with love using MERN</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
