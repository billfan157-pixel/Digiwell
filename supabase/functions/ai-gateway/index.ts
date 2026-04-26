import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TEXT_MODEL = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const groqApiKey = Deno.env.get('GROQ_API_KEY') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

type AiGatewayAction = 'advice' | 'chat' | 'scan' | 'insight' | 'report-analysis';

type DigiwellAiContext = {
  nowIso: string;
  waterIntake: number;
  waterGoal: number;
  weather?: { temp: number; status: string; location: string };
  watch?: { heartRate: number; steps: number };
  calendar?: { synced: boolean; nextEventTitle?: string };
  profile?: { nickname?: string; goal?: string; activity?: string; climate?: string };
};

type WaterAction = {
  amount: number;
  factor: number;
  name: string;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function groqChat(body: Record<string, unknown>) {
  if (!groqApiKey.trim()) {
    throw new Error('AI server chưa được cấu hình.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? `Groq request failed (${response.status})`);
  }

  return data;
}

function buildContextSummary(context: DigiwellAiContext): string {
  const now = new Date(context.nowIso);
  const timeText = Number.isNaN(now.getTime())
    ? context.nowIso
    : new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false,
      }).format(now);

  return [
    `- Thời gian hiện tại: ${timeText}`,
    `- Lượng nước đã uống: ${context.waterIntake}/${context.waterGoal} ml`,
    context.weather
      ? `- Thời tiết: ${context.weather.temp}°C, ${context.weather.status}, tại ${context.weather.location}`
      : '- Thời tiết: chưa đồng bộ',
    context.watch
      ? `- Đồng hồ sức khỏe: ${context.watch.heartRate} BPM, ${context.watch.steps} bước`
      : '- Đồng hồ sức khỏe: chưa đồng bộ',
    context.calendar
      ? `- Lịch: ${
          context.calendar.synced
            ? `đã đồng bộ${context.calendar.nextEventTitle ? `, sự kiện gần nhất: ${context.calendar.nextEventTitle}` : ''}`
            : 'chưa đồng bộ'
        }`
      : '- Lịch: chưa đồng bộ',
    context.profile?.nickname ? `- Tên người dùng: ${context.profile.nickname}` : null,
    context.profile?.goal ? `- Mục tiêu sức khỏe: ${context.profile.goal}` : null,
    context.profile?.activity ? `- Mức vận động: ${context.profile.activity}` : null,
    context.profile?.climate ? `- Môi trường/khí hậu: ${context.profile.climate}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function normalizeDrinkFactor(name: string): number {
  const normalized = name.toLowerCase();
  if (/(bia|rượu|cocktail|whisky|vodka|cồn|alcohol|wine|beer)/.test(normalized)) return -0.5;
  if (/(cà phê|coffee|espresso|trà|tea|bò húc|nước tăng lực|energy drink)/.test(normalized)) return 0.8;
  if (/(sữa|milk|bù khoáng|điện giải|orezôn|revive|pocari)/.test(normalized)) return 1.1;
  return 1.0;
}

function clampWaterAction(action: Partial<WaterAction>): WaterAction | undefined {
  const amount = Math.round(Number(action.amount));
  const factor = Number(action.factor);
  const name = typeof action.name === 'string' ? action.name.trim() : '';

  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  if (!Number.isFinite(factor) || !name) return undefined;

  return {
    amount: Math.min(Math.max(amount, 30), 2000),
    factor: Math.min(Math.max(factor, -1), 1.5),
    name: name.slice(0, 80),
  };
}

const recordWaterIntakeTool = {
  type: 'function',
  function: {
    name: 'recordWaterIntake',
    description:
      'Gọi hàm này bất cứ khi nào người dùng nói họ vừa uống nước, trà, cà phê, sữa, bia, rượu hoặc muốn ghi nhận lượng uống.',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'integer',
          description: 'Dung tích đồ uống tính bằng ml, ví dụ 200, 300, 500.',
        },
        factor: {
          type: 'number',
          description:
            'Hệ số hydration: nước/nước trái cây=1.0, cà phê/trà đậm=0.8, sữa/bù khoáng=1.1, bia/rượu/cồn=-0.5.',
        },
        name: {
          type: 'string',
          description: 'Tên loại đồ uống, ví dụ Nước lọc, Cà phê sữa, Trà đào, Bia.',
        },
      },
      required: ['amount', 'factor', 'name'],
    },
  },
};

function getErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (raw.includes('401') || raw.toLowerCase().includes('invalid api key')) {
    return 'AI server key không hợp lệ.';
  }
  if (raw.includes('429') || raw.toLowerCase().includes('rate limit')) {
    return 'AI đang bị giới hạn tốc độ. Thử lại sau ít giây.';
  }
  if (raw.includes('503') || raw.toLowerCase().includes('unavailable')) {
    return 'AI tạm thời không khả dụng. Thử lại sau.';
  }
  if (raw.includes('AI server chưa được cấu hình')) {
    return 'AI server chưa được cấu hình.';
  }

  return raw;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Thiếu cấu hình Supabase server.' }, 500);
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action as AiGatewayAction;

    if (!action) {
      return json({ error: 'Missing action.' }, 400);
    }

    if (action === 'advice') {
      const context = body.context as DigiwellAiContext;
      const response = await groqChat({
        model: TEXT_MODEL,
        max_tokens: 100,
        messages: [
          {
            role: 'system',
            content:
              'Bạn là trợ lý sức khỏe AI của app DigiWell, chuyên huấn luyện uống nước thông minh. ' +
              'Trả lời bằng tiếng Việt, ngắn gọn tối đa 35 chữ, thân thiện. Không dùng markdown.',
          },
          {
            role: 'user',
            content:
              `Bối cảnh hiện tại:\n${buildContextSummary(context)}\n\n` +
              'Đưa ra 1 lời khuyên ngắn gọn về uống nước/nghỉ ngơi. ' +
              'Nếu thiếu nhiều nước thì nhắc uống sớm. Nếu gần đạt mục tiêu thì động viên nhẹ. ' +
              'Chỉ trả về duy nhất câu khuyên, không chào hỏi.',
          },
        ],
      });

      const text = String(response.choices?.[0]?.message?.content ?? '').replace(/\*/g, '').trim();
      return json({ text });
    }

    if (action === 'chat') {
      const input = String(body.input ?? '');
      const context = body.context as DigiwellAiContext;
      const response = await groqChat({
        model: TEXT_MODEL,
        max_tokens: 150,
        tools: [recordWaterIntakeTool],
        tool_choice: 'auto',
        messages: [
          {
            role: 'system',
            content:
              'Bạn là trợ lý ảo AI của DigiWell. ' +
              'Trả lời bằng tiếng Việt, ngắn gọn tối đa 50 từ, thân thiện, hữu ích. ' +
              'Ưu tiên chủ đề uống nước, nghỉ ngơi, thói quen sinh hoạt, hydration coaching. ' +
              'Nếu người dùng nói vừa uống hoặc muốn ghi nhận đồ uống, BẮT BUỘC gọi function recordWaterIntake. ' +
              'Không dùng markdown phức tạp.',
          },
          {
            role: 'user',
            content: `Bối cảnh người dùng:\n${buildContextSummary(context)}\n\nTin nhắn: "${input}"`,
          },
        ],
      });

      const choice = response.choices?.[0];
      const toolCalls = choice?.message?.tool_calls;

      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        const call = toolCalls[0];
        if (call.function?.name === 'recordWaterIntake') {
          let parsedArgs: Partial<WaterAction> = {};
          try {
            parsedArgs = JSON.parse(call.function.arguments ?? '{}');
          } catch {
            parsedArgs = {};
          }

          const waterAction = clampWaterAction(parsedArgs);
          if (waterAction) {
            return json({
              reply: `Đã ghi nhận bạn uống ${waterAction.amount}ml ${waterAction.name}.`,
              waterAction,
            });
          }
        }
      }

      const reply = String(choice?.message?.content ?? '').replace(/\*/g, '').trim();
      return json({ reply: reply || 'Mình chưa hiểu ý bạn, bạn thử hỏi lại nhé.' });
    }

    if (action === 'scan') {
      const imageDataUrl = String(body.imageDataUrl ?? '');
      if (!imageDataUrl.startsWith('data:image/')) {
        return json({ error: 'Ảnh gửi lên không hợp lệ.' }, 400);
      }

      const response = await groqChat({
        model: VISION_MODEL,
        max_tokens: 80,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageDataUrl },
              },
              {
                type: 'text',
                text:
                  'Đây là hình ảnh một loại đồ uống. ' +
                  'Hãy ước lượng tên đồ uống và dung tích gần đúng. ' +
                  'Trả về đúng 1 dòng theo định dạng: [Tên đồ uống] - [Dung tích bằng số]ml. ' +
                  'Ví dụ: Cà phê đen - 200ml. ' +
                  'Nếu trong ảnh không có đồ uống hoặc không chắc chắn, hãy trả về: Lỗi - Không nhận diện được.',
              },
            ],
          },
        ],
      });

      const responseText = String(response.choices?.[0]?.message?.content ?? '').trim();
      if (!responseText || responseText.includes('Lỗi')) {
        return json({ error: 'Không nhận ra đồ uống trong ảnh.' }, 422);
      }

      const match = responseText.match(/(.*)\s*-\s*(\d+)\s*ml/i);
      if (!match) {
        return json({ error: 'Không thể dự đoán dung tích.' }, 422);
      }

      const name = match[1].trim();
      const amount = parseInt(match[2], 10);
      if (!name || !Number.isFinite(amount) || amount <= 0) {
        return json({ error: 'Kết quả AI không hợp lệ.' }, 422);
      }

      return json({ name, amount, factor: normalizeDrinkFactor(name) });
    }

    if (action === 'insight') {
      const userContext = body.userContext as Record<string, unknown>;
      const weeklyData = Array.isArray(body.weeklyData) ? body.weeklyData : [];
      const activeWorkout = body.activeWorkout ? String(body.activeWorkout) : null;

      const hour = new Date().getHours();
      let currentTime = 'Morning';
      if (hour >= 12 && hour < 18) currentTime = 'Afternoon';
      else if (hour >= 18) currentTime = 'Evening';

      const history = weeklyData
        .filter((entry) => entry && typeof entry === 'object' && !(entry as Record<string, unknown>).isEmptySlot)
        .map((entry) => {
          const row = entry as Record<string, unknown>;
          return {
            day: row.d,
            ml: row.ml,
            target: userContext?.water_goal || 2000,
          };
        });

      const promptData = {
        biometrics: {
          age: userContext?.age || 20,
          gender: userContext?.gender || 'Nam',
          weight: userContext?.weight || 60,
          activity: userContext?.activity || 'active',
        },
        current_time: currentTime,
        active_workout: activeWorkout,
        '7_day_history': history,
      };

      const response = await groqChat({
        model: TEXT_MODEL,
        max_tokens: 150,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'Bạn là một Chuyên gia Y tế & Dinh dưỡng thể thao khắt khe. ' +
              'Dựa vào cục dữ liệu JSON tôi cung cấp, hãy phân tích tình trạng hydrat hóa của người dùng. ' +
              'Trả về câu trả lời RẤT NGẮN GỌN (dưới 40 chữ), chia làm 2 phần: [Chẩn đoán nhanh] và [Hành động ngay]. ' +
              'Nếu họ đang tập nặng, phải nhắc đến điện giải. Giọng điệu dứt khoát, chuyên nghiệp.',
          },
          { role: 'user', content: JSON.stringify(promptData) },
        ],
      });

      return json({
        insight: String(response.choices?.[0]?.message?.content ?? '').trim() || 'Dữ liệu không đủ để phân tích lúc này.',
      });
    }

    if (action === 'report-analysis') {
      const stats = body.stats as Record<string, unknown>;
      const entries = Array.isArray(body.entries) ? body.entries : [];
      const periodLabel = String(body.periodLabel ?? '');
      const profile = (body.profile ?? {}) as Record<string, unknown>;
      const savings = Number(body.savings ?? 0);
      const units = String(body.units ?? '0');

      const entryText = entries
        .map((entry) => {
          const row = entry as Record<string, unknown>;
          return `${row.date}: ${row.waterIntake}ml/${row.waterGoal}ml (${row.achieved ? '✓' : '✗'})`;
        })
        .join('\n');

      const prompt = `Bạn là Chuyên gia Sức khỏe và Cố vấn Tài chính AI của DigiWell.
Hãy phân tích báo cáo cho người dùng ${profile.nickname ?? 'bạn'}.

Thông tin:
- Kỳ báo cáo: ${periodLabel}
- Thành tích: ${stats.goalsAchieved}/${stats.totalDays} ngày đạt mục tiêu (${stats.achievementRate}%).
- Nhịp tim trung bình: ${profile.avgHeartRate ?? 'N/A'} BPM (Dành cho dân đạp xe/vận động).
- Tiết kiệm: ${savings.toLocaleString('vi-VN')} VND (Tương đương ${units} đơn vị quỹ VESAF/DCDS).
- Nhật ký:
${entryText || '- Không có dữ liệu'}

Yêu cầu:
1. "analysis": Nhận xét sâu sắc, thân thiện về sự kỷ luật, mối liên hệ giữa nước, nhịp tim và tích lũy tài chính.
2. "recommendations": 3 gợi ý thực tế về Hydration, Vận động và Kỷ luật đầu tư.

Trả về JSON thuần:
{
  "analysis": "...",
  "recommendations": ["...", "...", "..."]
}`;

      const response = await groqChat({
        model: TEXT_MODEL,
        max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      });

      const parsed = JSON.parse(String(response.choices?.[0]?.message?.content ?? '{}'));
      return json({
        analysis: parsed.analysis || '',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      });
    }

    return json({ error: `Unsupported action "${action}".` }, 400);
  } catch (error) {
    return json({ error: getErrorMessage(error) }, 500);
  }
});
