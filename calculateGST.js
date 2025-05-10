const UT_WITH_UGST = [
  "Andaman and Nicobar Islands",
  "Lakshadweep",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Chandigarh",
  "Ladakh"
];

const GST_STATE_CODES = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman and Diu",
  "26": "Dadra and Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh"
};

const INDIAN_STATES_AND_UTS = [...new Set(Object.values(GST_STATE_CODES))];

function normalizeStateName(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isIndianLocation(name) {
  return INDIAN_STATES_AND_UTS.includes(normalizeStateName(name));
}

function getStateFromGSTIN(gstin) {
  if (!gstin || typeof gstin !== "string" || !isValidGSTIN(gstin)) {
    throw new Error("Invalid GSTIN provided.");
  }

  const code = gstin.slice(0, 2);
  const state = GST_STATE_CODES[code];

  if (!state) throw new Error(`Unknown state code: ${code} from GSTIN: ${gstin}`);

  return state;
}

function isValidGSTIN(gstin) {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
}
/**
 * Calculates GST based on the GSTIN of the supplier and buyer.
 * @param {Object} params - Parameters for the calculation.
 * @param {string} params.supplierGSTIN - GSTIN of the supplier.
 * @param {string} params.buyerGSTIN - GSTIN of the buyer.
 * @param {number} params.amount - Amount on which GST is to be calculated.
 * @param {number} [params.rate=18] - GST rate (default is 18%).
 * @param {boolean} [params.iAmSupplier=true] - Whether the caller is the supplier (default is true).
 * @returns {Object} - An object containing the GST calculation details.
 * @throws {Error} - Throws an error if the GSTIN is invalid or if the location is not supported.
 */
function calculateGSTFromGSTIN({ supplierGSTIN, buyerGSTIN, amount, rate = 18, iAmSupplier = true }) {
  const supplierState = getStateFromGSTIN(supplierGSTIN);
  const buyerState = getStateFromGSTIN(buyerGSTIN);

  const result = calculateGST({ supplierState, buyerState, amount, rate });

  result.GST_type = iAmSupplier ? "Output GST" : "Input GST";
  return result;
}

function calculateGST({ supplierState, buyerState, amount, rate = 18 }) {
  const supplier = normalizeStateName(supplierState);
  const buyer = normalizeStateName(buyerState);
  const gstRate = Number(rate);
  const value = Number(amount);

  const supplierIsIndian = isIndianLocation(supplier);
  const buyerIsIndian = isIndianLocation(buyer);

  if (!supplierIsIndian || !buyerIsIndian) {
    throw new Error("Only Indian locations are supported. No import/export.");
  }

  let gstType = "";
  let igst = 0, cgst = 0, sgst = 0, ugst = 0;

  if (supplier === buyer) {
    if (UT_WITH_UGST.includes(supplier)) {
      gstType = "CGST + UGST (Intra-UT)";
      cgst = ugst = (value * gstRate) / 200;
    } else {
      gstType = "CGST + SGST (Intra-State)";
      cgst = sgst = (value * gstRate) / 200;
    }
  } else {
    gstType = "IGST (Inter-State)";
    igst = (value * gstRate) / 100;
  }

  return {
    type: gstType,
    Taxable_value : amount,
    GST_rate : gstRate,
    IGST : igst,
    CGST : cgst,
    SGST : sgst,
    UGST : ugst,
    Total_GST : igst + cgst + sgst + ugst,
    Gross_amount : value + igst + cgst + sgst + ugst
  };
}

// Example usage
console.log(
  calculateGSTFromGSTIN({
    supplierGSTIN: "33ABCDE1234F1Z5", // Tamil Nadu
    buyerGSTIN: "04ABCDE5678K1Z1",    // Chandigarh
    amount: 1500
  })
);

console.log(
  calculateGSTFromGSTIN({
    supplierGSTIN: "04ABCDE5678K1Z1", // Chandigarh
    buyerGSTIN: "33ABCDE1234F1Z5",    // Tamil Nadu
    amount: 1500,
    iAmSupplier: false
  })
);
