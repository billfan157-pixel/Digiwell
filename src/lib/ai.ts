// ============================================================
// DigiWell AI Service — Powered by Groq + Llama 3.3 70B
// Thay thế toàn bộ Google Gemini bằng Groq SDK
// Cài đặt: npm install groq-sdk
// ============================================================

import Groq from 'groq-sdk';

console.log("[DEBUG] Vite Env Check:", import.meta.env.VITE_GROQ_API_KEY ? "Found" : "Missing");

// ── Types ──────────────────────────────────────────────────

export type AiChatMessage = {
  role: 'user' | 'model';
  content: string;
};

export type DigiwellAiContext = {
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

// ── Constants ──────────────────────────────────────────────

const FRIENDLY_FALLBACK_ADVICE =
  'Hệ thống AI đang bận một chút. Tạm thời hãy uống thêm vài ngụm nước nhỏ và nghỉ 1-2 phút nhé!';

// Model mặc định
const TEXT_MODEL   = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// Hardcode hoặc đọc từ .env
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY ?? '';

if (groqApiKey) {
  console.log(
    `[DEBUG] Groq API Key (masked): ${groqApiKey.substring(0, 5)}...${groqApiKey.slice(-5)}`
  );
}

// ── Client factory ─────────────────────────────────────────

function createGroqClient(): Groq {
  if (!groqApiKey.trim()) {
    console.error('[DigiWell AI] Lỗi: VITE_GROQ_API_KEY chưa được thiết lập trong file .env');
    throw new Error('Chưa cấu hình VITE_GROQ_API_KEY');
  }
  return new Groq({
    apiKey: groqApiKey,
    dangerouslyAllowBrowser: true, // Bắt buộc khi gọi từ browser/Vite
  });
}

// ── Error helper ───────────────────────────────────────────

function getGroqErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  console.error('[DEBUG] [DigiWell AI Error]', error);

  if (raw.includes('401') || raw.toLowerCase().includes('invalid api key')) {
    return 'Groq API key không hợp lệ. Kiểm tra lại VITE_GROQ_API_KEY.';
  }
  if (raw.includes('429') || raw.toLowerCase().includes('rate limit')) {
    return 'Groq API đang bị giới hạn tốc độ (rate limit). Thử lại sau ít giây.';
  }
  if (raw.includes('503') || raw.toLowerCase().includes('unavailable')) {
    return 'Groq service tạm thời không khả dụng. Thử lại sau.';
  }
  if (raw.includes('Chưa cấu hình VITE_GROQ_API_KEY')) {
    return 'Bạn chưa cấu hình VITE_GROQ_API_KEY cho DigiWell.';
  }
  return raw;
}

// ── Context builder ────────────────────────────────────────

function buildContextSummary(context: DigiwellAiContext): string {
  const now = new Date(context.nowIso);
  const timeText = Number.isNaN(now.getTime())
    ? context.nowIso
    : new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit', minute: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric',
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
    context.profile?.nickname  ? `- Tên người dùng: ${context.profile.nickname}` : null,
    context.profile?.goal      ? `- Mục tiêu sức khỏe: ${context.profile.goal}` : null,
    context.profile?.activity  ? `- Mức vận động: ${context.profile.activity}` : null,
    context.profile?.climate   ? `- Môi trường/khí hậu: ${context.profile.climate}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

// ── Drink helpers ──────────────────────────────────────────

function normalizeDrinkFactor(name: string): number {
  const n = name.toLowerCase();
  if (/(bia|rượu|cocktail|whisky|vodka|cồn|alcohol|wine|beer)/.test(n))         return -0.5;
  if (/(cà phê|coffee|espresso|trà|tea|bò húc|nước tăng lực|energy drink)/.test(n)) return 0.8;
  if (/(sữa|milk|bù khoáng|điện giải|orezôn|revive|pocari)/.test(n))            return 1.1;
  return 1.0;
}

function clampWaterAction(action: Partial<WaterAction>): WaterAction | undefined {
  const amount = Math.round(Number(action.amount));
  const factor = Number(action.factor);
  const name   = typeof action.name === 'string' ? action.name.trim() : '';

  if (!Number.isFinite(amount) || amount <= 0) {
    console.warn('[DigiWell AI] Amount không hợp lệ:', action.amount);
    return undefined;
  }
  if (!Number.isFinite(factor)) {
    console.warn('[DigiWell AI] Factor không hợp lệ:', action.factor);
    return undefined;
  }
  if (!name) {
    console.warn('[DigiWell AI] Name trống');
    return undefined;
  }

  return {
    amount: Math.min(Math.max(amount, 30), 2000),
    factor: Math.min(Math.max(factor, -1), 1.5),
    name:   name.slice(0, 80),
  };
}

// ── Rate-limit + Retry queue ───────────────────────────────

let   apiQueue       = Promise.resolve();
let   lastApiCallTime = 0;

async function executeWithThrottleAndRetry<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    apiQueue = apiQueue
      .then(async () => {
        // Groq free tier: đảm bảo ít nhất 3s giữa các lần gọi
        const elapsed = Date.now() - lastApiCallTime;
        if (elapsed < 3000 && lastApiCallTime > 0) {
          await new Promise(r => setTimeout(r, 3000 - elapsed));
        }

        let attempt = 0;
        const maxRetries = 3;

        while (true) {
          try {
            lastApiCallTime = Date.now();
            resolve(await fn());
            return;
          } catch (err: any) {
            const isRateLimit =
              err.message?.includes('429') ||
              err.message?.toLowerCase().includes('rate limit') ||
              err.status === 429;

            if (isRateLimit && attempt < maxRetries) {
              attempt++;
              const delay = 5000 * Math.pow(2, attempt - 1); // 5s, 10s, 20s
              console.warn(
                `[DigiWell AI] Rate limit hit. Thử lại lần ${attempt}/${maxRetries} sau ${delay / 1000}s...`
              );
              await new Promise(r => setTimeout(r, delay));
            } else {
              reject(err);
              return;
            }
          }
        }
      })
      .catch(reject);
  });
}

// ── Tool definition (OpenAI-compatible format) ─────────────

const recordWaterIntakeTool: Groq.Chat.Completions.ChatCompletionTool = {
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

// ── Public helpers ─────────────────────────────────────────

export function isAiConfigured(): boolean {
  return Boolean(groqApiKey.trim());
}

// ── generateHydrationAdvice ────────────────────────────────

export async function generateHydrationAdvice(context: DigiwellAiContext): Promise<string> {
  try {
    const response = await executeWithThrottleAndRetry(async () => {
      const groq = createGroqClient();
      return groq.chat.completions.create({
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
    });

    const text = response.choices[0]?.message?.content?.replace(/\*/g, '').trim();
    return text || FRIENDLY_FALLBACK_ADVICE;
  } catch (error) {
    const msg = getGroqErrorMessage(error);
    if (msg.toLowerCase().includes('rate limit')) {
      return 'Groq API đang bận, tạm thời hãy uống thêm nước đều trong ngày nhé!';
    }
    return FRIENDLY_FALLBACK_ADVICE;
  }
}

// ── sendAiChatMessage ──────────────────────────────────────

export async function sendAiChatMessage(
  input: string,
  context: DigiwellAiContext,
): Promise<{ reply: string; waterAction?: { amount: number; factor: number; name: string } }> {
  try {
    const response = await executeWithThrottleAndRetry(async () => {
      const groq = createGroqClient();
      return groq.chat.completions.create({
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
            content:
              `Bối cảnh người dùng:\n${buildContextSummary(context)}\n\nTin nhắn: "${input}"`,
          },
        ],
      });
    });

    const choice = response.choices[0];

    // Groq trả về tool_calls nếu AI muốn gọi function
    const toolCalls = choice?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      const call = toolCalls[0];
      if (call.function.name === 'recordWaterIntake') {
        let args: any = {};
        try {
          args = JSON.parse(call.function.arguments);
        } catch {
          console.warn('[DigiWell AI] Không parse được tool arguments:', call.function.arguments);
        }

        const validAction = clampWaterAction({
          amount: args.amount,
          factor: args.factor,
          name:   args.name,
        });

        if (validAction) {
          return {
            reply: `Đã ghi nhận bạn uống ${validAction.amount}ml ${validAction.name}.`,
            waterAction: validAction,
          };
        }
      }
    }

    // Trả về text bình thường
    const text = choice?.message?.content?.replace(/\*/g, '').trim();
    return { reply: text || 'Mình chưa hiểu ý bạn, bạn thử hỏi lại nhé.' };
  } catch (error) {
    console.error('[DigiWell AI] sendAiChatMessage error:', error);
    return { reply: 'Hệ thống AI đang bận một chút, bạn thử lại sau nhé.' };
  }
}

// ── scanDrinkFromImage ─────────────────────────────────────
// Dùng Llama 4 Scout (multimodal) trên Groq để nhận diện đồ uống từ ảnh

export async function scanDrinkFromImage(
  file: File,
): Promise<{ name: string; amount: number; factor: number }> {
  try {
    // Đọc ảnh thành base64 Data URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
      reader.readAsDataURL(file);
    });

    const mimeType = file.type || 'image/jpeg';

    const response = await executeWithThrottleAndRetry(async () => {
      const groq = createGroqClient();
      return groq.chat.completions.create({
        model: VISION_MODEL,
        max_tokens: 80,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  // Groq vision nhận URL hoặc base64 Data URL
                  url: dataUrl,
                },
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
    });

    const responseText = response.choices[0]?.message?.content?.trim() ?? '';

    if (!responseText) {
      throw new Error('AI không trả về kết quả.');
    }
    if (responseText.includes('Lỗi')) {
      console.warn('[DigiWell AI] AI báo lỗi nhận diện:', responseText);
      throw new Error('Không nhận ra đồ uống trong ảnh!');
    }

    const match = responseText.match(/(.*)\s*-\s*(\d+)\s*ml/i);
    if (!match) {
      console.warn('[DigiWell AI] Không đúng format:', responseText);
      throw new Error('Không thể dự đoán dung tích!');
    }

    const name   = match[1].trim();
    const amount = parseInt(match[2], 10);

    if (!name || !Number.isFinite(amount) || amount <= 0) {
      throw new Error('Kết quả AI không hợp lệ.');
    }

    return { name, amount, factor: normalizeDrinkFactor(name) };
  } catch (error) {
    throw new Error(getGroqErrorMessage(error) || 'Lỗi xử lý ảnh từ AI');
  }
}