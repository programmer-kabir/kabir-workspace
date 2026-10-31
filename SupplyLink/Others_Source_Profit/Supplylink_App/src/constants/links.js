export const CONTACT_INFO = {
  whatsappNumber: "8801339631586",
  callNumber: "01339631586",
  email: "support@supplylinkbd.com",
  address: "সুনামগঞ্জ সদর, সুনামগঞ্জ, সিলেট, বাংলাদেশ",
  userPortalUrl: "https://app.supplylinkbd.com",
  adminPortalUrl: "https://admin.supplylinkbd.com",
};

export const getWhatsAppUrl = (message = "") => {
  const defaultMsg =
    "হ্যালো SupplyLink, আমি কিস্তিতে পণ্য কেনা অথবা বিনিয়োগ সম্পর্কে বিস্তারিত জানতে চাই।";
  const finalMsg = message ? message : defaultMsg;
  return `https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(
    finalMsg
  )}`;
};

