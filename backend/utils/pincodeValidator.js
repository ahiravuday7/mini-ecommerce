const https = require("https");

const PINCODE_REGEX = /^\d{6}$/;

const fetchJson = (url, timeoutMs = 5000) =>
  new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let raw = "";

      res.on("data", (chunk) => {
        raw += chunk;
      });

      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error("Pincode verification service failed"));
          return;
        }

        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error("Invalid pincode verification response"));
        }
      });
    });

    req.on("error", () => reject(new Error("Pincode verification failed")));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error("Pincode verification timed out"));
    });
  });

const verifyIndianPincode = async (inputPincode) => {
  const pincode = String(inputPincode || "").trim();

  if (!PINCODE_REGEX.test(pincode)) {
    return {
      isValid: false,
      message: "Pincode must be 6 digits",
    };
  }

  try {
    const data = await fetchJson(
      `https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`,
    );

    const status = data?.[0]?.Status;
    const postOffice = data?.[0]?.PostOffice?.[0];

    if (status !== "Success" || !postOffice) {
      return {
        isValid: false,
        message: "Invalid pincode",
      };
    }

    return {
      isValid: true,
      pincode,
      city: String(
        postOffice?.District || postOffice?.Block || postOffice?.Name || "",
      ).trim(),
      state: String(postOffice?.State || "").trim(),
      country: "India",
    };
  } catch {
    return {
      isValid: false,
      message: "Unable to verify pincode right now. Please try again.",
    };
  }
};

module.exports = {
  verifyIndianPincode,
};
