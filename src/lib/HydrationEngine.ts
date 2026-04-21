// ============================================================
// DigiWell — Personalized Water Intake Algorithm
// Tính lượng nước cần uống mỗi ngày dựa trên đa yếu tố
//
// Nguồn tham chiếu:
//   - WHO Hydration Guidelines
//   - National Academies of Sciences (NASEM) 2004/2020
//   - EFSA Dietary Reference Values for Water (2010)
//   - Sports Medicine research on exercise hydration
// ============================================================

// ── Input Types ────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel =
  | 'sedentary'    // Ngồi nhiều, ít vận động (văn phòng, học online)
  | 'light'        // Đi bộ nhẹ, đứng vài giờ/ngày
  | 'moderate'     // Tập thể dục 3-5 buổi/tuần, 30-60 phút
  | 'high'         // Tập nặng hằng ngày, công việc thể lực
  | 'athlete';     // VĐV, tập 2 buổi/ngày hoặc thi đấu

export type Climate =
  | 'cold'         // Lạnh / điều hoà nhiều (< 20°C)
  | 'temperate'    // Mát mẻ (20-26°C)
  | 'warm'         // Nóng ấm (26-32°C, như TP.HCM ban ngày)
  | 'hot'          // Nóng (32-38°C)
  | 'tropical';    // Nhiệt đới nóng ẩm (> 38°C hoặc độ ẩm cao)

export type HealthCondition =
  | 'none'
  | 'pregnant'          // Mang thai
  | 'breastfeeding'     // Đang cho con bú
  | 'kidney_stone'      // Tiền sử sỏi thận (cần uống nhiều hơn)
  | 'kidney_disease'    // Bệnh thận (cần uống ít hơn)
  | 'heart_failure'     // Suy tim (hạn chế dịch)
  | 'fever'             // Đang bị sốt
  | 'diarrhea';         // Đang tiêu chảy

export type DietFactor =
  | 'high_protein'      // Chế độ ăn nhiều đạm (gym, keto)
  | 'high_sodium'       // Ăn nhiều muối, đồ mặn
  | 'high_fiber'        // Nhiều rau củ, chất xơ
  | 'high_caffeine'     // Uống nhiều cà phê/trà đậm (> 3 ly/ngày)
  | 'high_alcohol'      // Uống rượu bia thường xuyên
  | 'plant_based';      // Chủ yếu rau củ quả (đã có sẵn nước từ thực phẩm)

export type WaterIntakeInput = {
  weightKg:        number;           // Cân nặng (kg) — bắt buộc
  heightCm?:       number;           // Chiều cao (cm) — tuỳ chọn, dùng tính BMI
  ageYears:        number;           // Tuổi
  gender:          Gender;
  activityLevel:   ActivityLevel;
  climate:         Climate;
  healthCondition: HealthCondition;
  dietFactors:     DietFactor[];     // Có thể chọn nhiều
  currentTempC?:   number;           // Nhiệt độ hiện tại (°C) từ weather API
  exerciseMinutes?: number;          // Phút tập hôm nay (nếu biết)
  isFasting?:      boolean;          // [NEW] Đang trong chế độ nhịn ăn (Fasting)
  wakeUpTime?:     string;           // "07:00"
  bedTime?:        string;           // "23:00"
};

// ── Output Types ───────────────────────────────────────────

export type WaterIntakeBreakdown = {
  base:            number;   // ml — lượng cơ bản theo cân nặng
  ageAdj:          number;   // ml — điều chỉnh theo tuổi
  genderAdj:       number;   // ml — điều chỉnh theo giới
  activityAdj:     number;   // ml — điều chỉnh theo vận động
  climateAdj:      number;   // ml — điều chỉnh theo khí hậu/nhiệt độ
  healthAdj:       number;   // ml — điều chỉnh theo tình trạng sức khoẻ
  dietAdj:         number;   // ml — điều chỉnh theo chế độ ăn
  exerciseAdj:     number;   // ml — điều chỉnh theo tập luyện hôm nay
  foodWaterAdj:    number;   // [NEW] ml — bù đắp lượng nước từ thực phẩm
};

export type HydrationSchedule = {
  time:     string;   // "06:30"
  amount:   number;   // ml
  note:     string;   // lý do / gợi ý
};

export type WaterIntakeResult = {
  goalMl:         number;               // Mục tiêu tổng (ml/ngày)
  goalL:          string;               // "2.3 lít"
  glasses:        number;               // Quy đổi ra số ly 250ml
  breakdown:      WaterIntakeBreakdown; // Chi tiết từng yếu tố
  adjustmentNote: string[];             // Danh sách nhận xét
  riskFlags:      string[];             // Cảnh báo nếu có điều kiện đặc biệt
  schedule:       HydrationSchedule[];  // Lịch uống nước gợi ý theo giờ
  confidence:     'high' | 'medium' | 'low'; // Độ tin cậy của kết quả
};

// ── Constants ──────────────────────────────────────────────

// Giới hạn an toàn
const MIN_GOAL_ML = 1200;   // Tối thiểu tuyệt đối (trừ bệnh thận/tim)
const MAX_GOAL_ML = 5000;   // Tối đa an toàn cho người khoẻ mạnh

// ── Core Algorithm ─────────────────────────────────────────

export function calculateWaterIntake(input: WaterIntakeInput): WaterIntakeResult {
  const {
    weightKg, heightCm, ageYears, gender,
    activityLevel, climate, healthCondition,
    dietFactors, currentTempC, exerciseMinutes = 0,
    isFasting = false, // [NEW] Khởi tạo giá trị mặc định cho isFasting
    wakeUpTime = '07:00',
    bedTime = '23:00',
  } = input;

  const notes: string[] = [];
  const risks: string[]  = [];

  // ─ 1. Base: 35 ml/kg
  let baseMlPerKg = 35;
  if (ageYears < 18)        baseMlPerKg = 40;
  else if (ageYears >= 65)  baseMlPerKg = 30;

  const base = Math.round(weightKg * baseMlPerKg);

  // ─ 2. Age adjustment
  let ageAdj = 0;
  if (ageYears < 14) {
    ageAdj = -200;
    notes.push('Trẻ em dưới 14 tuổi cần ít nước tuyệt đối hơn người lớn');
  } else if (ageYears >= 65) {
    ageAdj = -150;
    notes.push('Người cao tuổi dễ mất cảm giác khát, cần nhắc uống thường xuyên hơn');
  }

  // ─ 3. Gender adjustment
  let genderAdj = 0;
  if (gender === 'male') {
    genderAdj = 300;
    notes.push('Nam giới có tỉ lệ cơ bắp cao hơn, cần thêm ~300ml/ngày');
  } else if (gender === 'female') {
    genderAdj = 0;
  }

  // ─ 4. Activity adjustment (Mức nền tảng)
  const activityMap: Record<ActivityLevel, { ml: number; label: string }> = {
    sedentary: { ml: 0,    label: 'Ít vận động' },
    light:     { ml: 200,  label: 'Vận động nhẹ' },
    moderate:  { ml: 450,  label: 'Vận động vừa' },
    high:      { ml: 800,  label: 'Vận động cao' },
    athlete:   { ml: 1200, label: 'VĐV/tập nặng' },
  };
  // FIX: Chốt chặn an toàn cuối cùng. Nếu `activityLevel` không hợp lệ (do dữ liệu cũ trong DB),
  // dùng 'moderate' làm giá trị mặc định để tránh crash.
  const safeActivityLevel = activityMap[activityLevel] ? activityLevel : 'moderate';
  const activityAdj = activityMap[safeActivityLevel].ml;
  if (safeActivityLevel !== 'sedentary') {
    // Dùng safeActivityLevel để lấy label, tránh lỗi tương tự
    const label = activityMap[safeActivityLevel].label;
    notes.push(`Mức vận động "${label}": thêm ${activityAdj}ml/ngày để bù mồ hôi`);
  }

  // ─ 5. Climate/temperature adjustment
  let climateAdj = 0;
  if (currentTempC !== undefined && currentTempC > 26) {
    // [UPGRADED] Hệ số phi tuyến tính: Càng nóng bù càng mạnh
    const severity = currentTempC > 35 ? 70 : (currentTempC > 30 ? 50 : 35);
    climateAdj = Math.round((currentTempC - 26) * severity);
    notes.push(`Nhiệt độ ${currentTempC}°C: bù nước cường độ cao thêm ${climateAdj}ml theo thời tiết thực tế`);
  } else {
    const climateMap: Record<Climate, { ml: number; label: string }> = {
      cold:      { ml: -100, label: 'Lạnh/điều hoà' },
      temperate: { ml: 0,    label: 'Mát mẻ' },
      warm:      { ml: 300,  label: 'Nóng ấm' },
      hot:       { ml: 600,  label: 'Nóng' },
      tropical:  { ml: 900,  label: 'Nhiệt đới nóng ẩm' },
    };
    climateAdj = climateMap[climate].ml;
    if (climate !== 'temperate') {
      notes.push(`Khí hậu "${climateMap[climate].label}": điều chỉnh ${climateAdj > 0 ? '+' : ''}${climateAdj}ml/ngày`);
    }
  }

  // ─ 6. Health condition adjustment
  let healthAdj = 0;
  let capOverride: number | null = null;

  switch (healthCondition) {
    case 'pregnant':
      healthAdj = 300;
      notes.push('Mang thai: cần thêm ~300ml/ngày cho thai nhi và tuần hoàn máu');
      break;
    case 'breastfeeding':
      healthAdj = 700;
      notes.push('Cho con bú: cần thêm ~700ml/ngày (sữa mẹ chứa 87% là nước)');
      break;
    case 'kidney_stone':
      healthAdj = 500;
      notes.push('Tiền sử sỏi thận: cần uống nhiều hơn để pha loãng nước tiểu, phòng ngừa tái phát');
      risks.push('Sỏi thận: tham khảo bác sĩ để có mục tiêu nước tiểu cụ thể (> 2.5 lít/ngày)');
      break;
    case 'kidney_disease':
      healthAdj = -400;
      capOverride = 1500;
      risks.push('Bệnh thận: cần hạn chế dịch, tham khảo bác sĩ chuyên khoa thận trước khi thay đổi lượng nước uống');
      break;
    case 'heart_failure':
      healthAdj = -600;
      capOverride = 1200;
      risks.push('Suy tim: phải hạn chế dịch nghiêm ngặt theo chỉ định bác sĩ — con số này chỉ mang tính tham khảo');
      break;
    case 'fever':
      healthAdj = 500;
      notes.push('Đang sốt: mỗi 1°C tăng thân nhiệt → tăng ~10% lượng nước cần thiết');
      break;
    case 'diarrhea':
      healthAdj = 800;
      risks.push('Đang tiêu chảy: nguy cơ mất nước cao, nên bổ sung thêm oresol/dung dịch điện giải');
      break;
    case 'none':
    default:
      break;
  }

  // ─ 7. Diet factors adjustment
  let dietAdj = 0;
  const dietDetails: string[] = [];

  for (const factor of dietFactors) {
    switch (factor) {
      case 'high_protein':
        dietAdj += 300;
        dietDetails.push('protein cao (+300ml)');
        break;
      case 'high_sodium':
        dietAdj += 200;
        dietDetails.push('nhiều muối (+200ml)');
        break;
      case 'high_fiber':
        dietAdj += 150;
        dietDetails.push('nhiều chất xơ (+150ml)');
        break;
      case 'high_caffeine':
        dietAdj += 250;
        dietDetails.push('nhiều cà phê/trà (+250ml)');
        break;
      case 'high_alcohol':
        dietAdj += 400;
        dietDetails.push('rượu bia (+400ml)');
        risks.push('Rượu bia gây mất nước nghiêm trọng — mỗi đơn vị cồn cần bù thêm 200ml nước');
        break;
      case 'plant_based':
        dietAdj -= 200;
        dietDetails.push('thực phẩm thực vật (-200ml)');
        break;
    }
  }

  if (dietDetails.length > 0) {
    notes.push(`Chế độ ăn: ${dietDetails.join(', ')}`);
  }

  // ─ 8. Exercise adjustment
  let exerciseAdj = 0;
  if (exerciseMinutes > 0) {
    // [UPGRADED] Tính dựa trên thể trọng thực tế và cường độ vận động
    const intensityFactor = activityLevel === 'athlete' ? 12 
                          : activityLevel === 'high'    ? 10 
                          : 8;
    exerciseAdj = Math.round((exerciseMinutes / 60) * weightKg * intensityFactor);
    notes.push(`Tập luyện ${exerciseMinutes} phút (thể trọng ${weightKg}kg): bù thêm ~${exerciseAdj}ml mồ hôi`);
  }

  // ─ 8.5. [NEW] Food-Water Offset (Chế độ nhịn ăn - Fasting)
  let foodWaterAdj = 0;
  if (isFasting) {
    // Cơ thể bình thường lấy ~15-20% nước từ thức ăn. Khi fasting, cần uống bù phần này.
    foodWaterAdj = Math.round(base * 0.15);
    notes.push(`Chế độ Nhịn ăn (Fasting): bù đắp ${foodWaterAdj}ml lượng nước thiếu hụt từ thực phẩm`);
  }

  // ─ 9. Tổng hợp
  // [UPGRADED] Cộng thêm foodWaterAdj vào tổng
  const rawTotal = base + ageAdj + genderAdj + activityAdj + climateAdj
                 + healthAdj + dietAdj + exerciseAdj + foodWaterAdj;

  // Áp dụng cap nếu có bệnh lý
  let goalMl: number;
  if (capOverride !== null) {
    goalMl = Math.min(rawTotal, capOverride);
  } else {
    goalMl = Math.max(MIN_GOAL_ML, Math.min(MAX_GOAL_ML, rawTotal));
  }

  // Làm tròn về bội số 50ml (dễ tracking hơn)
  goalMl = Math.round(goalMl / 50) * 50;

  // ─ 10. Confidence level
  const confidence: WaterIntakeResult['confidence'] =
    healthCondition === 'kidney_disease' || healthCondition === 'heart_failure' ? 'low'
    : heightCm && exerciseMinutes > 0 ? 'high'
    : 'medium';

  // ─ 11. Generate schedule
  const schedule = generateHydrationSchedule(goalMl, activityLevel, exerciseMinutes, wakeUpTime, bedTime);

  return {
    goalMl,
    goalL: `${(goalMl / 1000).toFixed(1)} lít`,
    glasses: Math.round(goalMl / 250),
    breakdown: {
      base,
      ageAdj,
      genderAdj,
      activityAdj,
      climateAdj,
      healthAdj,
      dietAdj,
      exerciseAdj,
      foodWaterAdj, // [NEW] Trả về biến này để UI có thể hiển thị nếu cần
    },
    adjustmentNote: notes,
    riskFlags: risks,
    schedule,
    confidence,
  };
}

// ── Schedule Generator ─────────────────────────────────────

function generateHydrationSchedule(
  goalMl: number,
  activity: ActivityLevel,
  exerciseMinutes: number,
  wakeUpTime: string,
  bedTime: string,
): HydrationSchedule[] {
  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  };

  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const wakeHour = parseTime(wakeUpTime);
  let bedHour = parseTime(bedTime);
  if (bedHour < wakeHour) bedHour += 24; // Handle overnight

  const wakingDuration = bedHour - wakeHour;
  const numIntervals = Math.max(5, Math.floor(wakingDuration / 1.5)); // Chia thành các khoảng, tối thiểu 5
  const intervalHours = wakingDuration / (numIntervals + 1);

  const schedule: HydrationSchedule[] = [];

  // 1. Ngay khi thức dậy
  schedule.push({ time: formatTime(wakeHour + 0.25), amount: 300, note: 'Uống ngay sau khi thức dậy — cơ thể mất nước qua hơi thở khi ngủ' });

  // 2. Phân bổ đều trong ngày
  for (let i = 1; i <= numIntervals; i++) {
    const time = wakeHour + i * intervalHours;
    schedule.push({ time: formatTime(time), amount: 250, note: 'Duy trì năng lượng và sự tập trung' });
  }

  // 3. Trước khi đi ngủ
  schedule.push({ time: formatTime(bedHour - 0.5), amount: 150, note: 'Uống một ít trước khi ngủ, không uống quá nhiều' });

  // Thêm slot trước/sau tập nếu có
  if (exerciseMinutes > 0) {
    schedule.push({
      time: '17:00',
      amount: Math.round(exerciseMinutes * 7), // ~7ml/phút tập
      note: `Trong và sau tập (${exerciseMinutes} phút) — uống từng ngụm nhỏ đều đặn`,
    });
  }

  // Điều chỉnh tỉ lệ để tổng ≈ goalMl
  const rawSum = schedule.reduce((s, x) => s + x.amount, 0);
  const ratio  = goalMl / rawSum;

  return schedule
    .sort((a, b) => a.time.localeCompare(b.time))
    .map(item => ({
      ...item,
      amount: Math.round((item.amount * ratio) / 25) * 25, // làm tròn 25ml
    }));
}

// ── Integration helper: update goal from weather ───────────

export function recalculateWithWeather(
  input: WaterIntakeInput,
  newTempC: number,
): WaterIntakeResult {
  return calculateWaterIntake({ ...input, currentTempC: newTempC });
}

export function quickEstimate(weightKg: number, gender: Gender = 'other'): number {
  const base = weightKg * 35;
  const genderBonus = gender === 'male' ? 300 : 0;
  return Math.round((base + genderBonus) / 50) * 50;
}