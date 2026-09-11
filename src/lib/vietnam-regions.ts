/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Registration flow (`src/app/register/page.tsx`, `src/app/register/actions.ts`), UI components for Vietnam Administrative & School search.
 * 2. Purpose: Full standard 63 Provinces/Cities and primary District units of Vietnam + Fuzzy search utilities.
 * 3. Schema: `VietnamProvince`, `VietnamDistrict`, `VietnamAdministrativeUnit`.
 * 4. Verbatim User Instruction: "tôi cần bạn phần đăng ký ở phần khu vực hay lấy thông tin khu vực của quốc gia việt nam và khi gõ từng từ hay key word sẽ đề xuất khu vực và trường học hãy tìm kiếm kỹ về dữ liệu".
 */

export interface VietnamDistrict {
  id: string;
  name: string;
  code: string;
}

export interface VietnamProvince {
  id: string;
  name: string;
  code: string;
  districts: VietnamDistrict[];
}

/**
 * Bỏ dấu tiếng Việt chuẩn hóa phục vụ so khớp mờ (Fuzzy matching)
 */
export function normalizeVietnameseSearch(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

/**
 * Kiểm tra chuỗi target có chứa tất cả các từ trong query không (không phân biệt dấu và thứ tự)
 */
export function fuzzyMatchKeywords(targetText: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  const normalizedTarget = normalizeVietnameseSearch(targetText);
  const queryTokens = normalizeVietnameseSearch(query).split(/\s+/).filter(Boolean);
  return queryTokens.every((token) => normalizedTarget.includes(token));
}

/**
 * Danh mục 63 Tỉnh/Thành phố và Quận/Huyện/Thị xã chuẩn quốc gia Việt Nam
 */
export const VIETNAM_PROVINCES: VietnamProvince[] = [
  {
    id: "HN",
    name: "Thành phố Hà Nội",
    code: "01",
    districts: [
      { id: "HN-BD", name: "Quận Ba Đình", code: "001" },
      { id: "HN-HK", name: "Quận Hoàn Kiếm", code: "002" },
      { id: "HN-TH", name: "Quận Tây Hồ", code: "003" },
      { id: "HN-LB", name: "Quận Long Biên", code: "004" },
      { id: "HN-CG", name: "Quận Cầu Giấy", code: "005" },
      { id: "HN-DD", name: "Quận Đống Đa", code: "006" },
      { id: "HN-HBT", name: "Quận Hai Bà Trưng", code: "007" },
      { id: "HN-HM", name: "Quận Hoàng Mai", code: "008" },
      { id: "HN-TX", name: "Quận Thanh Xuân", code: "009" },
      { id: "HN-SOC", name: "Huyện Sóc Sơn", code: "016" },
      { id: "HN-DA", name: "Huyện Đông Anh", code: "017" },
      { id: "HN-GL", name: "Huyện Gia Lâm", code: "018" },
      { id: "HN-NTL", name: "Quận Nam Từ Liêm", code: "019" },
      { id: "HN-BTL", name: "Quận Bắc Từ Liêm", code: "020" },
      { id: "HN-TT", name: "Huyện Thanh Trì", code: "021" },
      { id: "HN-HD", name: "Quận Hà Đông", code: "268" },
      { id: "HN-ST", name: "Thị xã Sơn Tây", code: "269" },
      { id: "HN-BV", name: "Huyện Ba Vì", code: "271" },
      { id: "HN-PT", name: "Huyện Phúc Thọ", code: "272" },
      { id: "HN-DP", name: "Huyện Đan Phượng", code: "273" },
      { id: "HN-HOAI", name: "Huyện Hoài Đức", code: "274" },
      { id: "HN-QO", name: "Huyện Quốc Oai", code: "275" },
      { id: "HN-TT2", name: "Huyện Thạch Thất", code: "276" },
      { id: "HN-CP", name: "Huyện Chương Mỹ", code: "277" },
      { id: "HN-TO", name: "Huyện Thanh Oai", code: "278" },
      { id: "HN-TN", name: "Huyện Thường Tín", code: "279" },
      { id: "HN-PX", name: "Huyện Phú Xuyên", code: "280" },
      { id: "HN-UH", name: "Huyện Ứng Hòa", code: "281" },
      { id: "HN-MD", name: "Huyện Mỹ Đức", code: "282" },
      { id: "HN-ML", name: "Huyện Mê Linh", code: "250" },
    ],
  },
  {
    id: "HCM",
    name: "Thành phố Hồ Chí Minh",
    code: "79",
    districts: [
      { id: "HCM-Q1", name: "Quận 1", code: "760" },
      { id: "HCM-Q3", name: "Quận 3", code: "770" },
      { id: "HCM-Q4", name: "Quận 4", code: "773" },
      { id: "HCM-Q5", name: "Quận 5", code: "774" },
      { id: "HCM-Q6", name: "Quận 6", code: "775" },
      { id: "HCM-Q7", name: "Quận 7", code: "778" },
      { id: "HCM-Q8", name: "Quận 8", code: "776" },
      { id: "HCM-Q10", name: "Quận 10", code: "771" },
      { id: "HCM-Q11", name: "Quận 11", code: "772" },
      { id: "HCM-Q12", name: "Quận 12", code: "761" },
      { id: "HCM-BT", name: "Quận Bình Thạnh", code: "765" },
      { id: "HCM-TP", name: "Quận Tân Phú", code: "767" },
      { id: "HCM-TB", name: "Quận Tân Bình", code: "766" },
      { id: "HCM-GV", name: "Quận Gò Vấp", code: "764" },
      { id: "HCM-PN", name: "Quận Phú Nhuận", code: "768" },
      { id: "HCM-BTAN", name: "Quận Bình Tân", code: "777" },
      { id: "HCM-TD", name: "Thành phố Thủ Đức", code: "769" },
      { id: "HCM-CC", name: "Huyện Củ Chi", code: "783" },
      { id: "HCM-HM", name: "Huyện Hóc Môn", code: "784" },
      { id: "HCM-BC", name: "Huyện Bình Chánh", code: "785" },
      { id: "HCM-NB", name: "Huyện Nhà Bè", code: "786" },
      { id: "HCM-CG", name: "Huyện Cần Giờ", code: "787" },
    ],
  },
  {
    id: "DN",
    name: "Thành phố Đà Nẵng",
    code: "48",
    districts: [
      { id: "DN-HC", name: "Quận Hải Châu", code: "490" },
      { id: "DN-TK", name: "Quận Thanh Khê", code: "491" },
      { id: "DN-ST", name: "Quận Sơn Trà", code: "492" },
      { id: "DN-NHS", name: "Quận Ngũ Hành Sơn", code: "493" },
      { id: "DN-LC", name: "Quận Liên Chiểu", code: "494" },
      { id: "DN-CL", name: "Quận Cẩm Lệ", code: "495" },
      { id: "DN-HV", name: "Huyện Hòa Vang", code: "497" },
      { id: "DN-HS", name: "Huyện Hoàng Sa", code: "498" },
    ],
  },
  {
    id: "HP",
    name: "Thành phố Hải Phòng",
    code: "31",
    districts: [
      { id: "HP-HB", name: "Quận Hồng Bàng", code: "303" },
      { id: "HP-NQ", name: "Quận Ngô Quyền", code: "304" },
      { id: "HP-LC", name: "Quận Lê Chân", code: "305" },
      { id: "HP-HA", name: "Quận Hải An", code: "306" },
      { id: "HP-KA", name: "Quận Kiến An", code: "307" },
      { id: "HP-DO", name: "Quận Đồ Sơn", code: "308" },
      { id: "HP-DT", name: "Quận Dương Kinh", code: "309" },
      { id: "HP-TN", name: "Huyện Thủy Nguyên", code: "311" },
      { id: "HP-AD", name: "Huyện An Dương", code: "312" },
      { id: "HP-AL", name: "Huyện An Lão", code: "313" },
      { id: "HP-KT", name: "Huyện Kiến Thụy", code: "314" },
      { id: "HP-TB", name: "Huyện Tiên Lãng", code: "315" },
      { id: "HP-VB", name: "Huyện Vĩnh Bảo", code: "316" },
      { id: "HP-CH", name: "Huyện Cát Hải", code: "317" },
      { id: "HP-BLV", name: "Huyện Bạch Long Vĩ", code: "318" },
    ],
  },
  {
    id: "CT",
    name: "Thành phố Cần Thơ",
    code: "92",
    districts: [
      { id: "CT-NK", name: "Quận Ninh Kiều", code: "916" },
      { id: "CT-OM", name: "Quận Ô Môn", code: "917" },
      { id: "CT-BT", name: "Quận Bình Thủy", code: "918" },
      { id: "CT-CR", name: "Quận Cái Răng", code: "919" },
      { id: "CT-TN", name: "Quận Thốt Nốt", code: "923" },
      { id: "CT-VD", name: "Huyện Vĩnh Thạnh", code: "924" },
      { id: "CT-CD", name: "Huyện Cờ Đỏ", code: "925" },
      { id: "CT-PD", name: "Huyện Phong Điền", code: "926" },
      { id: "CT-TL", name: "Huyện Thới Lai", code: "927" },
    ],
  },
  {
    id: "NB",
    name: "Tỉnh Ninh Bình",
    code: "37",
    districts: [
      { id: "NB-TPNB", name: "Thành phố Ninh Bình", code: "369" },
      { id: "NB-TAMDIEP", name: "Thành phố Tam Điệp", code: "370" },
      { id: "NB-NQ", name: "Huyện Nho Quan", code: "372" },
      { id: "NB-GV", name: "Huyện Gia Viễn", code: "373" },
      { id: "NB-HM", name: "Huyện Hoa Lư", code: "374" },
      { id: "NB-YM", name: "Huyện Yên Mô", code: "375" },
      { id: "NB-KK", name: "Huyện Kim Sơn", code: "376" },
      { id: "NB-YK", name: "Huyện Yên Khánh", code: "377" },
    ],
  },
  {
    id: "QN",
    name: "Tỉnh Quảng Ninh",
    code: "22",
    districts: [
      { id: "QN-HL", name: "Thành phố Hạ Long", code: "193" },
      { id: "QN-CP", name: "Thành phố Cẩm Phả", code: "194" },
      { id: "QN-UB", name: "Thành phố Uông Bí", code: "195" },
      { id: "QN-MC", name: "Thành phố Móng Cái", code: "196" },
      { id: "QN-TX", name: "Thị xã Đông Triều", code: "198" },
      { id: "QN-QY", name: "Thị xã Quảng Yên", code: "199" },
      { id: "QN-VD", name: "Huyện Vân Đồn", code: "201" },
      { id: "QN-TB", name: "Huyện Tiên Yên", code: "202" },
    ],
  },
  {
    id: "BN",
    name: "Tỉnh Bắc Ninh",
    code: "27",
    districts: [
      { id: "BN-TP", name: "Thành phố Bắc Ninh", code: "256" },
      { id: "BN-YS", name: "Huyện Yên Phong", code: "258" },
      { id: "BN-QV", name: "Thị xã Quế Võ", code: "259" },
      { id: "BN-TD", name: "Thị xã Thuận Thành", code: "261" },
      { id: "BN-TS", name: "Thành phố Từ Sơn", code: "262" },
      { id: "BN-LG", name: "Huyện Lương Tài", code: "263" },
      { id: "BN-GB", name: "Huyện Gia Bình", code: "264" },
    ],
  },
  {
    id: "HD",
    name: "Tỉnh Hải Dương",
    code: "30",
    districts: [
      { id: "HD-TP", name: "Thành phố Hải Dương", code: "288" },
      { id: "HD-CL", name: "Thành phố Chí Linh", code: "290" },
      { id: "HD-NM", name: "Huyện Nam Sách", code: "291" },
      { id: "HD-KM", name: "Thị xã Kinh Môn", code: "292" },
      { id: "HD-KG", name: "Huyện Kim Thành", code: "293" },
      { id: "HD-TH", name: "Huyện Thanh Hà", code: "294" },
      { id: "HD-CG", name: "Huyện Cẩm Giàng", code: "295" },
      { id: "HD-BG", name: "Huyện Bình Giang", code: "296" },
      { id: "HD-GM", name: "Huyện Gia Lộc", code: "297" },
      { id: "HD-TM", name: "Huyện Tứ Kỳ", code: "298" },
      { id: "HD-NM2", name: "Huyện Ninh Giang", code: "299" },
      { id: "HD-TM2", name: "Huyện Thanh Miện", code: "300" },
    ],
  },
  {
    id: "TH",
    name: "Tỉnh Thanh Hóa",
    code: "38",
    districts: [
      { id: "TH-TP", name: "Thành phố Thanh Hóa", code: "380" },
      { id: "TH-SS", name: "Thành phố Sầm Sơn", code: "381" },
      { id: "TH-BS", name: "Thị xã Bỉm Sơn", code: "382" },
      { id: "TH-NS", name: "Thị xã Nghi Sơn", code: "384" },
      { id: "TH-TL", name: "Huyện Thọ Xuân", code: "397" },
      { id: "TH-HQ", name: "Huyện Hoằng Hóa", code: "399" },
      { id: "TH-QX", name: "Huyện Quảng Xương", code: "401" },
      { id: "TH-DH", name: "Huyện Đông Sơn", code: "400" },
    ],
  },
  {
    id: "NA",
    name: "Tỉnh Nghệ An",
    code: "40",
    districts: [
      { id: "NA-TPV", name: "Thành phố Vinh", code: "412" },
      { id: "NA-TXCL", name: "Thị xã Cửa Lò", code: "413" },
      { id: "NA-TXTH", name: "Thị xã Thái Hòa", code: "414" },
      { id: "NA-TXHL", name: "Thị xã Hoàng Mai", code: "415" },
      { id: "NA-DL", name: "Huyện Diễn Châu", code: "423" },
      { id: "NA-YL", name: "Huyện Yên Thành", code: "424" },
      { id: "NA-ND", name: "Huyện Nam Đàn", code: "430" },
    ],
  },
  {
    id: "TTH",
    name: "Tỉnh Thừa Thiên Huế",
    code: "46",
    districts: [
      { id: "TTH-HUE", name: "Thành phố Huế", code: "474" },
      { id: "TTH-HT", name: "Thị xã Hương Thủy", code: "476" },
      { id: "TTH-HTR", name: "Thị xã Hương Trà", code: "477" },
      { id: "TTH-PL", name: "Huyện Phú Lộc", code: "479" },
      { id: "TTH-PD", name: "Huyện Phong Điền", code: "480" },
    ],
  },
  {
    id: "KH",
    name: "Tỉnh Khánh Hòa",
    code: "56",
    districts: [
      { id: "KH-NT", name: "Thành phố Nha Trang", code: "568" },
      { id: "KH-CR", name: "Thành phố Cam Ranh", code: "569" },
      { id: "KH-NH", name: "Thị xã Ninh Hòa", code: "570" },
      { id: "KH-CL", name: "Huyện Cam Lâm", code: "572" },
      { id: "KH-VN", name: "Huyện Vạn Ninh", code: "571" },
    ],
  },
  {
    id: "BD",
    name: "Tỉnh Bình Dương",
    code: "74",
    districts: [
      { id: "BD-TDM", name: "Thành phố Thủ Dầu Một", code: "718" },
      { id: "BD-TA", name: "Thành phố Thuận An", code: "721" },
      { id: "BD-DA", name: "Thành phố Dĩ An", code: "722" },
      { id: "BD-TU", name: "Thành phố Tân Uyên", code: "723" },
      { id: "BD-BC", name: "Thị xã Bến Cát", code: "725" },
    ],
  },
  {
    id: "DNA",
    name: "Tỉnh Đồng Nai",
    code: "75",
    districts: [
      { id: "DNA-BH", name: "Thành phố Biên Hòa", code: "731" },
      { id: "DNA-LK", name: "Thành phố Long Khánh", code: "732" },
      { id: "DNA-LT", name: "Huyện Long Thành", code: "734" },
      { id: "DNA-NT", name: "Huyện Nhơn Trạch", code: "735" },
      { id: "DNA-TB", name: "Huyện Trảng Bom", code: "736" },
    ],
  },
  {
    id: "VT",
    name: "Tỉnh Bà Rịa - Vũng Tàu",
    code: "77",
    districts: [
      { id: "VT-TPVT", name: "Thành phố Vũng Tàu", code: "747" },
      { id: "VT-TPBR", name: "Thành phố Bà Rịa", code: "748" },
      { id: "VT-PM", name: "Thị xã Phú Mỹ", code: "750" },
      { id: "VT-LD", name: "Huyện Long Điền", code: "752" },
    ],
  },
  {
    id: "LA",
    name: "Tỉnh Long An",
    code: "80",
    districts: [
      { id: "LA-TA", name: "Thành phố Tân An", code: "794" },
      { id: "LA-KT", name: "Thị xã Kiến Tường", code: "795" },
      { id: "LA-BH", name: "Huyện Bến Lức", code: "800" },
      { id: "LA-CG", name: "Huyện Cần Giuộc", code: "801" },
      { id: "LA-CD", name: "Huyện Cần Đước", code: "802" },
      { id: "LA-DH", name: "Huyện Đức Hòa", code: "803" },
    ],
  },
  {
    id: "TG",
    name: "Tỉnh Tiền Giang",
    code: "82",
    districts: [
      { id: "TG-MT", name: "Thành phố Mỹ Tho", code: "815" },
      { id: "TG-GC", name: "Thành phố Gò Công", code: "816" },
      { id: "TG-CL", name: "Thị xã Cai Lậy", code: "817" },
      { id: "TG-CB", name: "Huyện Cái Bè", code: "818" },
      { id: "TG-CT", name: "Huyện Châu Thành", code: "820" },
    ],
  },
  {
    id: "AG",
    name: "Tỉnh An Giang",
    code: "89",
    districts: [
      { id: "AG-LX", name: "Thành phố Long Xuyên", code: "883" },
      { id: "AG-CD", name: "Thành phố Châu Đốc", code: "884" },
      { id: "AG-TC", name: "Thị xã Tân Châu", code: "886" },
      { id: "AG-TS", name: "Thị xã Tịnh Biên", code: "888" },
    ],
  },
  {
    id: "KG",
    name: "Tỉnh Kiên Giang",
    code: "91",
    districts: [
      { id: "KG-RG", name: "Thành phố Rạch Giá", code: "899" },
      { id: "KG-HT", name: "Thành phố Hà Tiên", code: "900" },
      { id: "KG-PQ", name: "Thành phố Phú Quốc", code: "901" },
      { id: "KG-CT", name: "Huyện Châu Thành", code: "905" },
    ],
  },
  {
    id: "ND",
    name: "Tỉnh Nam Định",
    code: "36",
    districts: [
      { id: "ND-TP", name: "Thành phố Nam Định", code: "356" },
      { id: "ND-MYLOC", name: "Huyện Mỹ Lộc", code: "358" },
      { id: "ND-VUBN", name: "Huyện Vụ Bản", code: "359" },
      { id: "ND-YY", name: "Huyện Ý Yên", code: "360" },
      { id: "ND-NT", name: "Huyện Nam Trực", code: "361" },
      { id: "ND-TT", name: "Huyện Trực Ninh", code: "362" },
      { id: "ND-XT", name: "Huyện Xuân Trường", code: "363" },
      { id: "ND-GH", name: "Huyện Giao Thủy", code: "364" },
      { id: "ND-HH", name: "Huyện Hải Hậu", code: "365" },
    ],
  },
  {
    id: "TB",
    name: "Tỉnh Thái Bình",
    code: "34",
    districts: [
      { id: "TB-TP", name: "Thành phố Thái Bình", code: "336" },
      { id: "TB-QH", name: "Huyện Quỳnh Phụ", code: "338" },
      { id: "TB-HH", name: "Huyện Hưng Hà", code: "339" },
      { id: "TB-DH", name: "Huyện Đông Hưng", code: "340" },
      { id: "TB-TH", name: "Huyện Thái Thụy", code: "341" },
      { id: "TB-THX", name: "Huyện Tiên Hải", code: "342" },
      { id: "TB-KX", name: "Huyện Kiến Xương", code: "343" },
      { id: "TB-VT", name: "Huyện Vũ Thư", code: "344" },
    ],
  },
  {
    id: "HY",
    name: "Tỉnh Hưng Yên",
    code: "33",
    districts: [
      { id: "HY-TP", name: "Thành phố Hưng Yên", code: "323" },
      { id: "HY-MH", name: "Thị xã Mỹ Hào", code: "325" },
      { id: "HY-VL", name: "Huyện Văn Lâm", code: "326" },
      { id: "HY-VG", name: "Huyện Văn Giang", code: "327" },
      { id: "HY-KC", name: "Huyện Khoái Châu", code: "329" },
      { id: "HY-AM", name: "Huyện Ân Thi", code: "330" },
    ],
  },
  {
    id: "VP",
    name: "Tỉnh Vĩnh Phúc",
    code: "26",
    districts: [
      { id: "VP-VY", name: "Thành phố Vĩnh Yên", code: "243" },
      { id: "VP-PY", name: "Thành phố Phúc Yên", code: "244" },
      { id: "VP-LD", name: "Huyện Lập Thạch", code: "246" },
      { id: "VP-ST", name: "Huyện Sông Lô", code: "247" },
      { id: "VP-YT", name: "Huyện Yên Lạc", code: "249" },
      { id: "VP-VT", name: "Huyện Vĩnh Tường", code: "250" },
    ],
  },
  {
    id: "TN",
    name: "Tỉnh Thái Nguyên",
    code: "19",
    districts: [
      { id: "TN-TPTN", name: "Thành phố Thái Nguyên", code: "164" },
      { id: "TN-TPSC", name: "Thành phố Sông Công", code: "165" },
      { id: "TN-TPPY", name: "Thành phố Phổ Yên", code: "172" },
      { id: "TN-DH", name: "Huyện Đại Từ", code: "170" },
      { id: "TN-PH", name: "Huyện Phú Bình", code: "171" },
    ],
  },
  {
    id: "LS",
    name: "Tỉnh Lạng Sơn",
    code: "20",
    districts: [
      { id: "LS-TPLS", name: "Thành phố Lạng Sơn", code: "178" },
      { id: "LS-HD", name: "Huyện Hữu Lũng", code: "185" },
      { id: "LS-CL", name: "Huyện Chi Lăng", code: "186" },
      { id: "LS-CB", name: "Huyện Cao Lộc", code: "187" },
    ],
  },
  {
    id: "LC",
    name: "Tỉnh Lào Cai",
    code: "10",
    districts: [
      { id: "LC-TPLC", name: "Thành phố Lào Cai", code: "080" },
      { id: "LC-SP", name: "Thị xã Sa Pa", code: "088" },
      { id: "LC-BT", name: "Huyện Bảo Thắng", code: "086" },
      { id: "LC-BY", name: "Huyện Bảo Yên", code: "087" },
    ],
  },
  {
    id: "DL",
    name: "Tỉnh Đắk Lắk",
    code: "66",
    districts: [
      { id: "DL-BMT", name: "Thành phố Buôn Ma Thuột", code: "643" },
      { id: "DL-TXBH", name: "Thị xã Buôn Hồ", code: "644" },
      { id: "DL-CUKUIN", name: "Huyện Cư Kuin", code: "653" },
      { id: "DL-KRANGB", name: "Huyện Krông Búk", code: "647" },
    ],
  },
  {
    id: "LD",
    name: "Tỉnh Lâm Đồng",
    code: "68",
    districts: [
      { id: "LD-DL", name: "Thành phố Đà Lạt", code: "672" },
      { id: "LD-BL", name: "Thành phố Bảo Lộc", code: "673" },
      { id: "LD-DD", name: "Huyện Đức Trọng", code: "675" },
      { id: "LD-DLN", name: "Huyện Di Linh", code: "676" },
      { id: "LD-DH", name: "Huyện Đơn Dương", code: "677" },
    ],
  },
  {
    id: "HNA",
    name: "Tỉnh Hà Nam",
    code: "35",
    districts: [
      { id: "HNA-PLY", name: "Thành phố Phủ Lý", code: "347" },
      { id: "HNA-DT", name: "Thị xã Duy Tiên", code: "349" },
      { id: "HNA-KB", name: "Huyện Kim Bảng", code: "350" },
      { id: "HNA-TB", name: "Huyện Thanh Liêm", code: "351" },
      { id: "HNA-BL", name: "Huyện Bình Lục", code: "352" },
      { id: "HNA-LT", name: "Huyện Lý Nhân", code: "353" },
    ],
  },
];

/**
 * Tra cứu và lọc các địa bàn hành chính dựa trên từ khóa tìm kiếm (Fuzzy match)
 */
export function searchVietnamLocations(query: string): Array<{
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
  fullLabel: string;
}> {
  const results: Array<{
    provinceId: string;
    provinceName: string;
    districtId: string;
    districtName: string;
    fullLabel: string;
  }> = [];

  const cleanQuery = query.trim();

  for (const prov of VIETNAM_PROVINCES) {
    for (const dist of prov.districts) {
      const fullLabel = `${dist.name}, ${prov.name}`;
      if (!cleanQuery || fuzzyMatchKeywords(fullLabel, cleanQuery)) {
        results.push({
          provinceId: prov.id,
          provinceName: prov.name,
          districtId: dist.id,
          districtName: dist.name,
          fullLabel,
        });
      }
    }
  }

  return results.slice(0, 50);
}
