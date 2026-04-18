import Groq from 'groq-sdk';

// Lấy API Key từ biến môi trường (Sử dụng chung Groq API Key của dự án)
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY ?? '';

/**
 * AI Contextual Brain
 * Phân tích dữ liệu người dùng và trả về lời khuyên Y tế/Hydration ngắn gọn.
 */
export async function generateHydrationInsight(
  userContext: any,
  weeklyData: any[],
  activeWorkout: string | null
): Promise<string> {
  if (!groqApiKey.trim()) {
    throw new Error('Chưa cấu hình API Key cho AI (VITE_GROQ_API_KEY).');
  }

  const groq = new Groq({
    apiKey: groqApiKey,
    dangerouslyAllowBrowser: true, // Cho phép gọi trực tiếp từ Frontend
  });

  // 1. Xác định buổi trong ngày
  const hour = new Date().getHours();
  let current_time = 'Morning';
  if (hour >= 12 && hour < 18) current_time = 'Afternoon';
  else if (hour >= 18) current_time = 'Evening';

  // 2. Định dạng lại lịch sử 7 ngày (lọc bỏ các ô trống nếu có)
  const history = weeklyData
    .filter(d => !d.isEmptySlot)
    .map(d => ({
      day: d.d,
      ml: d.ml,
      target: userContext?.water_goal || 2000
    }));

  // 3. Xây dựng Context Builder JSON
  const promptData = {
    biometrics: {
      age: userContext?.age || 20,
      gender: userContext?.gender || 'Nam',
      weight: userContext?.weight || 60,
      activity: userContext?.activity || 'active'
    },
    current_time,
    active_workout: activeWorkout,
    "7_day_history": history
  };

  const systemPrompt = "Bạn là một Chuyên gia Y tế & Dinh dưỡng thể thao khắt khe. Dựa vào cục dữ liệu JSON tôi cung cấp, hãy phân tích tình trạng hydrat hóa của người dùng. Trả về câu trả lời RẤT NGẮN GỌN (dưới 40 chữ), chia làm 2 phần: [Chẩn đoán nhanh] và [Hành động ngay]. Nếu họ đang tập nặng, phải nhắc đến điện giải. Giọng điệu dứt khoát, chuyên nghiệp.";

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Sử dụng model mạnh nhất của hệ thống
      max_tokens: 150,
      temperature: 0.4, // Giữ temperature thấp để AI trả lời dứt khoát, mang tính phân tích cao
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(promptData) }
      ]
    });

    return response.choices[0]?.message?.content?.trim() || "Dữ liệu không đủ để phân tích lúc này.";
  } catch (error: any) {
    console.error('[AI Engine Error]', error);
    if (error.status === 429 || error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit')) {
      throw new Error('Hệ thống AI đang quá tải. Vui lòng thử lại sau ít phút.');
    }
    throw new Error('Lỗi kết nối đến máy chủ AI. Không thể lấy dữ liệu.');
  }
}