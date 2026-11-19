// Cấu trúc phiếu khám theo mẫu "Phiếu khám ngoại trú YHCT – Phục hồi chức năng" của phòng khám.
// Dùng chung cho màn hình nhập liệu và bản in. Dữ liệu lưu theo đường dẫn (vd: "vitals.pulse").
export type Opt = string | { v: string; l: string };
export type Block =
  | { t: 'text'; k: string; label: string; rows?: number; w?: number }
  | { t: 'checks'; k: string; label: string; options: Opt[]; other?: string }
  | { t: 'radio'; k: string; label: string; options: Opt[]; other?: string }
  | { t: 'sub'; label: string }
  | { t: 'vitals' }
  | { t: 'tests' }
  | { t: 'icd'; k: string; label: string }
  | { t: 'drugs' };
export type Section = { no: string; title: string; blocks: Block[] };

export const optV = (o: Opt) => (typeof o === 'string' ? o : o.v);
export const optL = (o: Opt) => (typeof o === 'string' ? o : o.l);

export const SCREENING: Opt[] = [{ v: 'ACCEPT', l: 'Tiếp nhận điều trị' }, { v: 'CAUTION', l: 'THẬN TRỌNG khi điều trị' }, { v: 'DEFER', l: 'HOÃN / CHUYỂN TUYẾN' }];

export const TESTS: { group: string; items: string[] }[] = [
  { group: 'Cổ', items: ['Spurling', 'Distraction', 'ULTT'] },
  { group: 'Vai', items: ['Neer', 'Hawkins', 'Jobe', 'Drop arm', 'Lift-off/Belly press'] },
  { group: 'Thắt lưng – Hông', items: ['SLR', 'Slump', 'FABER', 'FADIR', 'Trendelenburg', 'Thomas'] },
  { group: 'Gối', items: ['McMurray', 'Lachman', 'Varus-Valgus'] },
];

export const VITALS: { k: string; label: string; unit: string; auto?: boolean }[] = [
  { k: 'pulse', label: 'Mạch', unit: 'lần/phút' }, { k: 'bp', label: 'Huyết áp', unit: 'mmHg' }, { k: 'temp', label: 'Nhiệt độ', unit: '°C' },
  { k: 'resp', label: 'Nhịp thở', unit: 'lần/phút' }, { k: 'height', label: 'Chiều cao', unit: 'cm' }, { k: 'weight', label: 'Cân nặng', unit: 'kg' },
  { k: 'bmi', label: 'BMI', unit: 'kg/m²', auto: true }, { k: 'nrs', label: 'Đau NRS', unit: '0–10' },
];

// Mã dịch vụ trong bảng giá, dùng để chuyển chỉ định thành buổi điều trị ở giai đoạn sau
export const NON_DRUG_PT: { v: string; l: string; code: string }[] = [
  { v: 'Hồng ngoại', l: 'Hồng ngoại', code: 'HN' },
  { v: 'Châm cứu', l: 'Châm cứu (gồm điện châm, hơ ngải)', code: 'CC' },
  { v: 'Điện xung', l: 'Điện xung', code: 'DX' },
  { v: 'Siêu âm', l: 'Siêu âm', code: 'SA' },
  { v: 'Xung kích', l: 'Sóng xung kích', code: 'XK' },
  { v: 'Từ trường siêu dẫn', l: 'Từ trường siêu dẫn', code: 'TT' },
  { v: 'Máy nén ép', l: 'Máy nén ép', code: 'NE' },
  { v: 'Nhúng sáp parafin', l: 'Nhúng sáp parafin', code: 'PF' },
];
export const NON_DRUG_MANUAL: { v: string; l: string; code?: string }[] = [
  { v: 'Trải mạc cơ', l: 'Trải mạc cơ', code: 'TLMM' }, { v: 'Trigger Point', l: 'Trigger Point', code: 'TLMM' }, { v: 'MET', l: 'MET', code: 'TLMM' },
  { v: 'Nắn chỉnh/di động khớp', l: 'Nắn chỉnh / di động khớp', code: 'DDK' }, { v: 'Di động thần kinh', l: 'Di động thần kinh' },
];

export const EXAM_SECTIONS: Section[] = [
  { no: 'I', title: 'LÝ DO ĐẾN KHÁM', blocks: [{ t: 'text', k: 'reason', label: 'Lý do đến khám', rows: 2 }] },
  { no: 'II', title: 'BỆNH SỬ', blocks: [{ t: 'text', k: 'history', label: 'Bệnh sử', rows: 4 }] },
  { no: 'III', title: 'SINH HIỆU', blocks: [{ t: 'vitals' }] },
  { no: 'IV', title: 'TIỀN SỬ LIÊN QUAN', blocks: [
    { t: 'checks', k: 'past.diseases', label: 'Bệnh liên quan', options: ['Không', 'Tim mạch', 'ĐTĐ', 'Thần kinh', 'Cơ xương khớp', 'Loãng xương', 'Chấn thương', 'Phẫu thuật', 'Ung thư'], other: 'past.diseasesOther' },
    { t: 'checks', k: 'past.meds', label: 'Thuốc đang dùng', options: ['Chống đông', 'Corticoid', 'Giảm đau/kháng viêm'], other: 'past.medsOther' },
    { t: 'radio', k: 'past.allergy', label: 'Dị ứng', options: ['Không', 'Có'], other: 'past.allergyNote' },
  ] },
  { no: 'V', title: 'SÀNG LỌC AN TOÀN TRƯỚC TRỊ LIỆU', blocks: [
    { t: 'checks', k: 'screening.redFlags', label: 'Dấu hiệu cảnh báo', options: ['Nghi gãy/trật', 'Sốt/nhiễm trùng', 'Đau về đêm', 'Sụt cân không rõ nguyên nhân', 'Yếu/tê tiến triển', 'Rối loạn tiêu tiểu', 'Sưng nóng đỏ', 'Đau ngực/khó thở'] },
    { t: 'checks', k: 'screening.cautions', label: 'Thận trọng / chống chỉ định', options: ['Máy tạo nhịp', 'Có thai', 'Rối loạn đông máu', 'Loãng xương nặng', 'Khớp chưa ổn định', 'Sau mổ chưa cho phép vận động', 'Mất/giảm cảm giác', 'Tổn thương da/vết thương hở'] },
    { t: 'radio', k: 'screening.conclusion', label: 'Kết luận sàng lọc', options: SCREENING },
  ] },
  { no: 'VI', title: 'KHÁM CƠ XƯƠNG KHỚP', blocks: [
    { t: 'sub', label: '1. Mất cân bằng tư thế' },
    { t: 'checks', k: 'msk.posture.head', label: 'Đầu – cổ – vai', options: ['Đầu đưa trước', 'Đầu nghiêng P/T', 'Đầu xoay P/T', 'Vai P/T cao', 'Vai đưa trước', 'Bả vai P/T cao', 'Nhô cánh P/T'] },
    { t: 'checks', k: 'msk.posture.pelvis', label: 'Khung chậu – Cột sống', options: ['Chậu đổ trước/sau', 'Chậu xoay P/T', 'Gù ngực', 'Tăng/giảm ưỡn lưng', 'Vẹo'] },
    { t: 'checks', k: 'msk.posture.legs', label: 'Chi dưới', options: ['Háng xoay trong/ngoài', 'Gối chữ X/O', 'Quá duỗi'] },
    { t: 'checks', k: 'msk.posture.feet', label: 'Bàn chân', options: ['Sấp/Ngửa', 'Vòm chân thấp/cao', 'Xoay trong/ngoài'] },
    { t: 'checks', k: 'msk.posture.load', label: 'Chịu lực', options: ['Cân đối', 'Lệch P', 'Lệch T', 'Dồn trước', 'Dồn sau'] },
    { t: 'sub', label: '2. Biên độ vận động' },
    { t: 'text', k: 'msk.rom.active', label: 'Chủ động', rows: 2 }, { t: 'text', k: 'msk.rom.passive', label: 'Thụ động', rows: 2 },
    { t: 'sub', label: '3. Khám mô mềm' },
    { t: 'checks', k: 'msk.soft.fascia', label: 'Chuỗi mạc hạn chế', options: ['Nông trước/sau', 'Bên P/T', 'Xoắn P/T', 'Sâu trước', 'Chức năng trước/sau', 'Tay trước P/T', 'Tay sau P/T'] },
    { t: 'text', k: 'msk.soft.shortMuscles', label: 'Cơ khóa ngắn' }, { t: 'text', k: 'msk.soft.longMuscles', label: 'Cơ khóa dài' }, { t: 'text', k: 'msk.soft.tendons', label: 'Gân / dây chằng' },
    { t: 'sub', label: '4. Khám khớp' }, { t: 'text', k: 'msk.joints', label: 'Khớp rối loạn', rows: 2 },
    { t: 'sub', label: '5. Sàng lọc thần kinh / nhiệm pháp' },
    { t: 'radio', k: 'msk.neuro.sign', label: 'Dấu thần kinh', options: ['Không', 'Có'], other: 'msk.neuro.signNote' },
    { t: 'tests' },
    { t: 'text', k: 'msk.neuro.other', label: 'Khác' },
  ] },
  { no: 'VII', title: 'KHÁM Y HỌC CỔ TRUYỀN', blocks: [
    { t: 'sub', label: 'Vọng' },
    { t: 'checks', k: 'tcm.vong.than', label: 'Thần', options: ['Có thần', 'Ít thần', 'Mệt mỏi', 'Vật vã/bứt rứt'] },
    { t: 'checks', k: 'tcm.vong.sac', label: 'Sắc', options: ['Đỏ', 'Nhợt', 'Vàng', 'Sạm/tối'] },
    { t: 'checks', k: 'tcm.vong.hinh', label: 'Hình thái – vận động', options: ['Cân đối', 'Gầy', 'Béo', 'Vận động hạn chế'] },
    { t: 'checks', k: 'tcm.vong.luoiChat', label: 'Lưỡi – chất lưỡi', options: ['Hồng', 'Nhạt', 'Đỏ', 'Tím/ứ huyết'] },
    { t: 'checks', k: 'tcm.vong.luoiHinh', label: 'Lưỡi – hình thái', options: ['Bệu', 'Gầy', 'Nứt', 'Dấu ấn răng'] },
    { t: 'checks', k: 'tcm.vong.reu', label: 'Rêu lưỡi', options: ['Trắng', 'Vàng', 'Mỏng', 'Dày', 'Khô', 'Nhuận', 'Nhớt'] },
    { t: 'sub', label: 'Văn' },
    { t: 'checks', k: 'tcm.van.tiengNoi', label: 'Tiếng nói', options: ['BT', 'Yếu', 'Khàn'] },
    { t: 'checks', k: 'tcm.van.hoiTho', label: 'Hơi thở', options: ['BT', 'Gấp', 'Yếu', 'Khó thở'] },
    { t: 'checks', k: 'tcm.van.hoDam', label: 'Ho / đàm', options: ['Không', 'Ho khan', 'Đàm trắng', 'Đàm vàng'] },
    { t: 'checks', k: 'tcm.van.mui', label: 'Mùi', options: ['BT', 'Hơi thở', 'Cơ thể'] },
    { t: 'sub', label: 'Vấn' },
    { t: 'checks', k: 'tcm.van2.hanNhiet', label: 'Hàn – nhiệt', options: ['BT', 'Sợ lạnh', 'Sợ nóng', 'Lúc nóng lúc lạnh', 'Sốt'] },
    { t: 'checks', k: 'tcm.van2.moHoi', label: 'Mồ hôi', options: ['BT', 'Ít/không', 'Tự hãn', 'Đạo hãn'] },
    { t: 'text', k: 'tcm.van2.dauViTri', label: 'Đau – vị trí' },
    { t: 'checks', k: 'tcm.van2.dauTinhChat', label: 'Đau – tính chất', options: ['Âm ỉ', 'Căng', 'Nặng', 'Gặp lạnh/nóng tăng', 'Ấn đau', 'Ưa ấn'] },
    { t: 'checks', k: 'tcm.van2.anUong', label: 'Ăn uống – khẩu vị', options: ['Kém ăn', 'Khát nhiều', 'Ít khát', 'Thích nóng', 'Thích lạnh'] },
    { t: 'checks', k: 'tcm.van2.daiTien', label: 'Đại tiện', options: ['BT', 'Táo', 'Lỏng', 'Sống phân'] },
    { t: 'checks', k: 'tcm.van2.tieuTien', label: 'Tiểu tiện', options: ['BT', 'Nhiều', 'Ít', 'Tiểu đêm', 'Vàng sẫm', 'Trong'] },
    { t: 'checks', k: 'tcm.van2.giacNgu', label: 'Giấc ngủ', options: ['BT', 'Khó vào giấc', 'Thức giữa đêm', 'Ngủ không sâu', 'Hay mơ'] },
    { t: 'checks', k: 'tcm.van2.dauMinhTuChi', label: 'Đầu – mình – tứ chi', options: ['Đau đầu', 'Chóng mặt', 'Tê', 'Nặng', 'Lạnh chi', 'Nóng lòng bàn tay/chân'] },
    { t: 'checks', k: 'tcm.van2.nguc', label: 'Ngực – bụng', options: ['Tức ngực', 'Hồi hộp', 'Đầy bụng', 'Đau bụng'] },
    { t: 'checks', k: 'tcm.van2.taiMat', label: 'Tai – mắt', options: ['Ù tai', 'Nghe kém', 'Hoa mắt', 'Khô mắt'] },
    { t: 'checks', k: 'tcm.van2.kinh', label: 'Nữ – kinh nguyệt', options: ['Đều', 'Không đều', 'Đau bụng'] },
    { t: 'checks', k: 'tcm.van2.kinhMau', label: 'Nữ – màu kinh', options: ['Đỏ tươi', 'Sẫm', 'Nhạt', 'Có cục'] },
    { t: 'radio', k: 'tcm.van2.khiHu', label: 'Nữ – khí hư', options: ['Có', 'Không'] },
    { t: 'sub', label: 'Thiết' },
    { t: 'checks', k: 'tcm.thiet.mach', label: 'Mạch', options: ['Phù', 'Trầm', 'Trì', 'Sác', 'Vô lực', 'Hữu lực'], other: 'tcm.thiet.machKhac' },
    { t: 'text', k: 'tcm.thiet.sonan', label: 'Sờ nắn vùng bệnh / kinh lạc / huyệt', rows: 2 },
  ] },
  { no: 'VIII', title: 'CẬN LÂM SÀNG', blocks: [
    { t: 'text', k: 'para.available', label: 'Kết quả đã có', rows: 2 },
    { t: 'sub', label: 'Cận lâm sàng đề nghị' },
    { t: 'text', k: 'para.imaging', label: 'Chẩn đoán hình ảnh (CĐHA)' }, { t: 'text', k: 'para.function', label: 'Thăm dò chức năng (TDCN)' }, { t: 'text', k: 'para.lab', label: 'Xét nghiệm (gửi ngoài)' },
  ] },
  { no: 'IX', title: 'CHẨN ĐOÁN', blocks: [
    { t: 'sub', label: 'Y học hiện đại' }, { t: 'icd', k: 'diagnosis.modernMain', label: 'Bệnh chính' }, { t: 'icd', k: 'diagnosis.modernSecondary', label: 'Bệnh kèm' },
    { t: 'sub', label: 'Y học cổ truyền' }, { t: 'text', k: 'diagnosis.tcmName', label: 'Bệnh danh' }, { t: 'text', k: 'diagnosis.tcmPattern', label: 'Thể bệnh' },
  ] },
  { no: 'X', title: 'HƯỚNG ĐIỀU TRỊ', blocks: [
    { t: 'text', k: 'plan.modern', label: 'Y học hiện đại', rows: 2 }, { t: 'text', k: 'plan.tcm', label: 'Y học cổ truyền', rows: 2 },
    { t: 'text', k: 'plan.shortGoal', label: 'Mục tiêu ngắn hạn' }, { t: 'text', k: 'plan.longGoal', label: 'Mục tiêu dài hạn' },
    { t: 'text', k: 'plan.sessions', label: 'Liệu trình: số buổi', w: 120 }, { t: 'text', k: 'plan.frequency', label: 'Tần suất (vd: 3 buổi/tuần)' }, { t: 'text', k: 'plan.reeval', label: 'Tái lượng giá sau … buổi', w: 120 },
  ] },
  { no: 'XI', title: 'ĐIỀU TRỊ KHÔNG DÙNG THUỐC', blocks: [
    { t: 'checks', k: 'nondrug.pt', label: 'YHCT – Vật lý trị liệu', options: NON_DRUG_PT.map((o) => ({ v: o.v, l: o.l })) },
    { t: 'checks', k: 'nondrug.manual', label: 'Trị liệu bằng tay', options: NON_DRUG_MANUAL.map((o) => ({ v: o.v, l: o.l })) },
    { t: 'text', k: 'nondrug.exercise', label: 'Bài tập', rows: 3 },
  ] },
  { no: 'XII', title: 'ĐIỀU TRỊ THUỐC', blocks: [{ t: 'drugs' }] },
];

export const getPath = (o: any, path: string) => path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
export function setPath(o: any, path: string, val: any) {
  const ks = path.split('.'); const root = Array.isArray(o) ? [...o] : { ...o }; let cur: any = root;
  ks.forEach((k, i) => { if (i === ks.length - 1) cur[k] = val; else { cur[k] = { ...(cur[k] ?? {}) }; cur = cur[k]; } });
  return root;
}
