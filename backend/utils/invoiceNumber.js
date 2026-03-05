const pad = (value, length = 2) => String(value).padStart(length, "0");

// Creates a date string token for the invoice number.
const formatDateToken = (date = new Date()) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;

// generates the final invoice number.
const generateInvoiceNumber = (date = new Date()) => {
  const dateToken = formatDateToken(date);
  const timeToken = String(date.getTime()).slice(-6);
  const randomToken = pad(Math.floor(Math.random() * 1000), 3);
  return `INV-${dateToken}-${timeToken}${randomToken}`;
};

module.exports = {
  generateInvoiceNumber,
};
