const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
const INR_NUMBER_FORMATTER = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatINR = (value, currencyPrefix = "\u20B9") =>
  `${currencyPrefix}${INR_NUMBER_FORMATTER.format(Number(value || 0))}`;

const formatInvoiceDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const toDisplayCase = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  if (/^[A-Z0-9]{2,6}$/.test(raw)) return raw;
  return raw
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const findFontPath = (candidates = []) =>
  candidates.find((filePath) => fs.existsSync(filePath));

const generateInvoicePDF = (order, outputStream) => {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(outputStream);

  const invoiceFontPath = findFontPath(
    [
      process.env.INVOICE_FONT_PATH,
      path.join(process.cwd(), "assets", "fonts", "NotoSans-Regular.ttf"),
      "C:\\Windows\\Fonts\\arial.ttf",
      "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
      "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ].filter(Boolean),
  );

  const invoiceBoldFontPath = findFontPath(
    [
      process.env.INVOICE_BOLD_FONT_PATH,
      path.join(process.cwd(), "assets", "fonts", "NotoSans-Bold.ttf"),
      "C:\\Windows\\Fonts\\arialbd.ttf",
      "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
      "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ].filter(Boolean),
  );

  const hasUnicodeCurrencyFont = Boolean(invoiceFontPath);
  const currencyPrefix = hasUnicodeCurrencyFont ? "\u20B9" : "Rs ";

  if (invoiceFontPath) doc.registerFont("InvoiceRegular", invoiceFontPath);
  if (invoiceBoldFontPath) doc.registerFont("InvoiceBold", invoiceBoldFontPath);

  const useRegularFont = () =>
    doc.font(invoiceFontPath ? "InvoiceRegular" : "Helvetica");
  const useBoldFont = () =>
    doc.font(
      invoiceBoldFontPath
        ? "InvoiceBold"
        : invoiceFontPath
          ? "InvoiceRegular"
          : "Helvetica-Bold",
    );

  useRegularFont();

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const tableCols = {
    item: left,
    qty: left + 335,
    price: left + 405,
    total: left + 475,
    end: right,
  };

  const drawSeparator = () => {
    const y = doc.y;
    doc.moveTo(left, y).lineTo(right, y).strokeColor("#CBD5E1").lineWidth(1).stroke();
    doc.moveDown(0.6);
    doc.fillColor("#000000");
  };

  const billingLines = [
    toDisplayCase(order.shippingAddress?.fullName || "-"),
    order.shippingAddress?.phone || "-",
    order.user?.email || "-",
  ];

  const shippingLines = [
    toDisplayCase(order.shippingAddress?.fullName || "-"),
    order.shippingAddress?.addressLine1 || "-",
    order.shippingAddress?.addressLine2 || "",
    order.shippingAddress?.landmark || "",
    `${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${
      order.shippingAddress?.pincode || ""
    }`,
    order.shippingAddress?.country || "India",
  ].filter(Boolean);

  const writeLines = (lines) => {
    useRegularFont();
    lines.forEach((line) => doc.fontSize(10).text(line));
  };

  const drawTableHeader = () => {
    const y = doc.y;
    doc.fillColor("#0F172A");
    useBoldFont();
    doc.fontSize(10);
    doc.text("Item", tableCols.item, y, {
      width: tableCols.qty - tableCols.item - 10,
      lineBreak: false,
    });
    doc.text("Qty", tableCols.qty, y, {
      width: tableCols.price - tableCols.qty - 8,
      align: "right",
      lineBreak: false,
    });
    doc.text("Price", tableCols.price, y, {
      width: tableCols.total - tableCols.price - 8,
      align: "right",
      lineBreak: false,
    });
    doc.text("Total", tableCols.total, y, {
      width: tableCols.end - tableCols.total,
      align: "right",
      lineBreak: false,
    });
    doc.moveTo(tableCols.item, y + 14)
      .lineTo(tableCols.end, y + 14)
      .strokeColor("#CBD5E1")
      .lineWidth(1)
      .stroke();
    useRegularFont();
    doc.fillColor("#000000");
    doc.y = y + 20;
  };

  const ensureSpaceFor = (height) => {
    if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
  };

  useBoldFont();
  doc.fontSize(19).text("MiniStore Pvt Ltd");
  useRegularFont();
  doc.fontSize(10).fillColor("#475569");
  doc.text("Surat, Gujarat");
  doc.text("GST: 24ABCDE1234F1Z5");
  doc.text("Email: support@ministore.com");
  doc.text("www.ministore.com");
  doc.fillColor("#000000");

  doc.moveDown(0.3);
  drawSeparator();

  useRegularFont();
  doc.fontSize(11).text(`Invoice No: ${order.invoiceNumber}`);
  doc.text(`Invoice Date: ${formatInvoiceDate(order.invoiceDate)}`);
  doc.text(`Order ID: ${order._id}`);
  doc.text(`Placed On: ${new Date(order.createdAt).toLocaleString("en-IN")}`);

  doc.moveDown(0.3);
  drawSeparator();

  useBoldFont();
  doc.fontSize(12).text("Bill To:", { underline: true });
  useRegularFont();
  writeLines(billingLines);
  doc.moveDown(0.3);

  useBoldFont();
  doc.fontSize(12).text("Ship To:", { underline: true });
  useRegularFont();
  writeLines(shippingLines);

  doc.moveDown(0.3);
  drawSeparator();

  useBoldFont();
  doc.fontSize(12).text("Items");
  useRegularFont();
  doc.moveDown(0.3);
  drawTableHeader();

  if (!order.items?.length) {
    doc.fontSize(10).text("No items found.");
    doc.moveDown(0.6);
  } else {
    (order.items || []).forEach((item) => {
      if (doc.y + 22 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        drawTableHeader();
      }

      const rowY = doc.y;
      const lineTotal = round2(Number(item.price || 0) * Number(item.qty || 0));

      useRegularFont();
      doc.fontSize(10);
      doc.text(item.title || "-", tableCols.item, rowY, {
        width: tableCols.qty - tableCols.item - 10,
        ellipsis: true,
        lineBreak: false,
      });
      doc.text(String(item.qty || 0), tableCols.qty, rowY, {
        width: tableCols.price - tableCols.qty - 8,
        align: "right",
        lineBreak: false,
      });
      doc.text(formatINR(item.price, currencyPrefix), tableCols.price, rowY, {
        width: tableCols.total - tableCols.price - 8,
        align: "right",
        lineBreak: false,
      });
      doc.text(formatINR(lineTotal, currencyPrefix), tableCols.total, rowY, {
        width: tableCols.end - tableCols.total,
        align: "right",
        lineBreak: false,
      });
      doc.moveTo(tableCols.item, rowY + 14)
        .lineTo(tableCols.end, rowY + 14)
        .strokeColor("#E2E8F0")
        .lineWidth(1)
        .stroke();
      doc.y = rowY + 20;
    });
  }

  ensureSpaceFor(160);
  doc.moveDown(0.5);

  const summaryLabelX = right - 220;
  const summaryValueX = right - 110;
  const summaryRight = right;
  const drawSummaryRule = () => {
    const y = doc.y;
    doc.moveTo(summaryLabelX, y)
      .lineTo(summaryRight, y)
      .strokeColor("#CBD5E1")
      .lineWidth(1)
      .stroke();
    doc.y = y + 8;
  };

  useBoldFont();
  doc.fontSize(11).text("Invoice Summary", summaryLabelX, doc.y, {
    width: summaryRight - summaryLabelX,
  });
  doc.moveDown(0.2);
  drawSummaryRule();

  const summaryRow = (label, value, isBold = false) => {
    const y = doc.y;
    if (isBold) useBoldFont();
    else useRegularFont();
    doc.fontSize(11);
    doc.text(label, summaryLabelX, y, { width: 110, lineBreak: false });
    doc.text(formatINR(value, currencyPrefix), summaryValueX, y, {
      width: summaryRight - summaryValueX,
      align: "right",
      lineBreak: false,
    });
    doc.y = y + 18;
  };

  summaryRow("Subtotal", order.itemsPrice);
  summaryRow("Shipping", order.shippingPrice);
  summaryRow("Tax", order.taxPrice);
  drawSummaryRule();
  summaryRow("Grand Total", order.totalPrice, true);
  drawSummaryRule();

  doc.moveDown(0.6);
  useRegularFont();
  doc.fontSize(10);
  doc.text(`Payment Method: ${toDisplayCase(order.paymentMethod || "-")}`, left, doc.y, {
    width: right - left,
  });
  doc.text(`Payment Status: ${toDisplayCase(order.paymentStatus || "-")}`, left, doc.y, {
    width: right - left,
  });
  doc.text(`Order Status: ${toDisplayCase(order.status || "-")}`, left, doc.y, {
    width: right - left,
  });

  ensureSpaceFor(60);
  doc.moveDown(0.8);
  drawSeparator();
  doc.fontSize(10).fillColor("#334155").text("Thank you for shopping with MiniStore!", {
    align: "center",
  });
  doc.text("This is a computer generated invoice.", { align: "center" });

  doc.end();
  return doc;
};

module.exports = {
  generateInvoicePDF,
};
