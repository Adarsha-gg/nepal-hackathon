export interface Hotline {
  country: string;
  name: string;
  nameNe: string;
  number: string;
  numberNe: string;
  tel: string;
}

const HOTLINES: Record<string, Hotline> = {
  NP: {
    country: "Nepal",
    name: "Nepal Mental Health Helpline",
    nameNe: "नेपाल मानसिक स्वास्थ्य हेल्पलाइन",
    number: "1166",
    numberNe: "११६६",
    tel: "1166",
  },
  US: {
    country: "United States",
    name: "988 Suicide & Crisis Lifeline",
    nameNe: "988 सुसाइड तथा क्राइसिस लाइफलाइन",
    number: "988",
    numberNe: "९८८",
    tel: "988",
  },
  GB: {
    country: "United Kingdom",
    name: "Samaritans",
    nameNe: "Samaritans (UK)",
    number: "116 123",
    numberNe: "११६ १२३",
    tel: "116123",
  },
  IN: {
    country: "India",
    name: "iCall / Vandrevala Foundation",
    nameNe: "iCall / वंद्रेवाला फाउन्डेशन",
    number: "1800-599-0019",
    numberNe: "१८००-५९९-००१९",
    tel: "18005990019",
  },
  AU: {
    country: "Australia",
    name: "Lifeline Australia",
    nameNe: "Lifeline Australia",
    number: "13 11 14",
    numberNe: "१३ ११ १४",
    tel: "131114",
  },
  CA: {
    country: "Canada",
    name: "988 Suicide Crisis Helpline",
    nameNe: "988 सुसाइड क्राइसिस हेल्पलाइन",
    number: "988",
    numberNe: "९८८",
    tel: "988",
  },
  AE: {
    country: "UAE",
    name: "Hope Line (Dubai Foundation)",
    nameNe: "Hope Line (दुबई फाउन्डेशन)",
    number: "800-4673",
    numberNe: "८००-४६७३",
    tel: "8004673",
  },
  QA: {
    country: "Qatar",
    name: "Qatar Mental Health Line",
    nameNe: "कतार मानसिक स्वास्थ्य लाइन",
    number: "16000",
    numberNe: "१६०००",
    tel: "16000",
  },
  MY: {
    country: "Malaysia",
    name: "Befrienders Malaysia",
    nameNe: "Befrienders Malaysia",
    number: "03-7627 2929",
    numberNe: "०३-७६२७ २९२९",
    tel: "0376272929",
  },
  KR: {
    country: "South Korea",
    name: "Korea Suicide Prevention Center",
    nameNe: "कोरिया आत्महत्या रोकथाम केन्द्र",
    number: "1393",
    numberNe: "१३९३",
    tel: "1393",
  },
  JP: {
    country: "Japan",
    name: "TELL Lifeline",
    nameNe: "TELL Lifeline (जापान)",
    number: "03-5774-0992",
    numberNe: "०३-५७७४-०९९२",
    tel: "0357740992",
  },
};

const DEFAULT_HOTLINE = HOTLINES.NP;

/** Best-effort country code from the browser's timezone. */
const TZ_TO_COUNTRY: Record<string, string> = {
  "Asia/Kathmandu": "NP",
  "Asia/Katmandu": "NP",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Phoenix": "US",
  "America/Anchorage": "US",
  "Pacific/Honolulu": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Halifax": "CA",
  "Europe/London": "GB",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Perth": "AU",
  "Asia/Dubai": "AE",
  "Asia/Qatar": "QA",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Seoul": "KR",
  "Asia/Tokyo": "JP",
};

export function getHotlineForTimezone(tz?: string): Hotline {
  const zone = tz || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "");
  const cc = TZ_TO_COUNTRY[zone];
  return (cc && HOTLINES[cc]) || DEFAULT_HOTLINE;
}

export function getHotlineForCountryCode(cc: string): Hotline {
  return HOTLINES[cc.toUpperCase()] || DEFAULT_HOTLINE;
}
