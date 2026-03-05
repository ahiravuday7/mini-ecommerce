const Order = require("../models/Order");
const { generateInvoiceNumber } = require("../utils/invoiceNumber");

// Find the order,Verify if the user is allowed to access it
const getOrderIfAllowed = async (orderId, reqUser, res) => {
  const order = await Order.findById(orderId).populate("user", "name email"); //Fetch order from database
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isOwner = order.user?._id?.toString() === reqUser._id.toString(); //Authorization check:Is the logged-in user the owner of this order?
  // Only the order owner or an admin can access the invoice.
  if (!isOwner && !reqUser.isAdmin) {
    res.status(403);
    throw new Error("Not allowed");
  }

  return order; //Now the service has a valid order that user can access.
};

// prepares everything required for invoice generation.
const prepareInvoiceDownload = async (orderId, reqUser, res) => {
  const order = await getOrderIfAllowed(orderId, reqUser, res); //So before generating invoice:Order exists,User is authorized

  // Check if invoice already exists
  if (!order.invoiceNumber || !order.invoiceDate) {
    order.invoiceDate = new Date(order.createdAt || Date.now()); //Invoice date will be:Order creation date OR current date if missing
    order.invoiceNumber = generateInvoiceNumber(order.invoiceDate); //Generate invoice number
    await order.save(); //Now the invoice number and date are stored permanently in the database.
  }

  // Returning invoice data
  return {
    order,
    fileName: `invoice-${order.invoiceNumber}.pdf`,
  };
};

module.exports = {
  prepareInvoiceDownload,
};
