import { useEffect, useRef } from "react";
import { Carousel } from "bootstrap";
import ColorThief from "colorthief";
import "./carousel.css";

const slides = [
  { src: "bbdsale.png", alt: "sale" },
  { src: "mens fashion.png", alt: "mens fashion" },
  { src: "womens fashion.png", alt: "womens fashion" },
  { src: "toys.png", alt: "toys" },
];

export default function HeroCarousel() {
  const bgRef = useRef(null);
  const carouselRef = useRef(null);
  const colorThiefRef = useRef(new ColorThief());

  const updateGradientFromImage = (imgEl) => {
    if (!imgEl || !bgRef.current) return;

    const apply = () => {
      try {
        const [r, g, b] = colorThiefRef.current.getColor(imgEl);
        bgRef.current.style.background = `linear-gradient(to bottom, rgba(${r}, ${g}, ${b}, 1), #ffffff)`;
      } catch (e) {
        // fallback gradient if image blocks canvas (CORS) or any error
        bgRef.current.style.background =
          "linear-gradient(to bottom, #1f2a44, #ffffff)";
      }
    };

    if (!imgEl.complete) imgEl.onload = apply;
    else apply();
  };

  useEffect(() => {
    const carouselEl = carouselRef.current;
    if (!carouselEl) return;

    // initial load
    const firstActive = carouselEl.querySelector(".carousel-item.active img");
    updateGradientFromImage(firstActive);

    // on slide change
    const onSlid = () => {
      const activeImg = carouselEl.querySelector(".carousel-item.active img");
      updateGradientFromImage(activeImg);
    };

    carouselEl.addEventListener("slid.bs.carousel", onSlid);
    return () => carouselEl.removeEventListener("slid.bs.carousel", onSlid);
  }, []);

  useEffect(() => {
    if (!carouselRef.current) return;

    const instance = new Carousel(carouselRef.current, {
      interval: 3000,
      ride: "carousel",
      pause: false, // optional
      touch: true, // optional
      wrap: true, // optional
    });

    return () => instance.dispose();
  }, []);

  return (
    <>
      <div id="gradientBackground" ref={bgRef} />

      <div
        id="carousel"
        ref={carouselRef}
        className="carousel slide"
        data-bs-ride="carousel"
        data-bs-interval="3000"
      >
        {/* Indicators */}
        <div className="carousel-indicators">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              data-bs-target="#carousel"
              data-bs-slide-to={i}
              className={i === 0 ? "active" : ""}
              aria-current={i === 0 ? "true" : undefined}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Slides */}
        <div className="carousel-inner">
          {slides.map((s, i) => (
            <div
              key={s.src}
              className={`carousel-item ${i === 0 ? "active" : ""}`}
            >
              <a href="#">
                <img src={s.src} alt={s.alt} className="d-block w-100" />
              </a>
              <div className="carousel-caption" />
            </div>
          ))}
        </div>

        {/* Controls */}
        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#carousel"
          data-bs-slide="prev"
        >
          <span
            className="carousel-control-prev-icon"
            aria-hidden="true"
          ></span>
          <span className="visually-hidden">Previous</span>
        </button>

        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#carousel"
          data-bs-slide="next"
        >
          <span
            className="carousel-control-next-icon"
            aria-hidden="true"
          ></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </>
  );
}
