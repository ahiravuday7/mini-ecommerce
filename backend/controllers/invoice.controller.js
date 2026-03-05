const asyncHandler = require("../utils/asyncHandler");
const { generateInvoicePDF } = require("../utils/generateInvoicePDF");
const { prepareInvoiceDownload } = require("../services/invoiceService");

// GET /api/orders/:id/invoice
const downloadInvoice = asyncHandler(async (req, res) => {
  // The order ID from the URL,The logged-in user,The Express response object
  const { order, fileName } = await prepareInvoiceDownload(
    req.params.id,
    req.user,
    res,
  );

  res.setHeader("Content-Type", "application/pdf"); //This tells the browser:The response is a PDF file
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`); //This tells the browser: Download the file

  generateInvoicePDF(order, res); //Generate and stream the PDF
});

module.exports = {
  downloadInvoice,
};
