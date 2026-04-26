import { invokeAiGateway } from './aiGateway';
import { isSupabaseConfigured } from './supabase';

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

const FRIENDLY_FALLBACK_ADVICE =
  'Hệ thống AI đang bận một chút. Tạm thời hãy uống thêm vài ngụm nước nhỏ và nghỉ 1-2 phút nhé!';

function getAiErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (raw.toLowerCase().includes('rate limit')) {
    return 'AI đang bị giới hạn tốc độ. Thử lại sau ít giây.';
  }
  if (raw.toLowerCase().includes('unauthorized')) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }
  if (raw.includes('AI server chưa được cấu hình')) {
    return 'AI server chưa được cấu hình.';
  }

  return raw;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
    reader.readAsDataURL(file);
  });
}

export function isAiConfigured(): boolean {
  return isSupabaseConfigured;
}

export async function generateHydrationAdvice(context: DigiwellAiContext): Promise<string> {
  try {
    const response = await invokeAiGateway<{ text?: string }>('advice', { context });
    return response.text?.trim() || FRIENDLY_FALLBACK_ADVICE;
  } catch (error) {
    const message = getAiErrorMessage(error);
    if (message.toLowerCase().includes('rate limit')) {
      return 'AI đang bận, tạm thời hãy uống thêm nước đều trong ngày nhé!';
    }
    return FRIENDLY_FALLBACK_ADVICE;
  }
}

export async function sendAiChatMessage(
  input: string,
  context: DigiwellAiContext,
): Promise<{ reply: string; waterAction?: WaterAction }> {
  try {
    const response = await invokeAiGateway<{ reply?: string; waterAction?: WaterAction }>('chat', {
      input,
      context,
    });

    return {
      reply: response.reply?.trim() || 'Mình chưa hiểu ý bạn, bạn thử hỏi lại nhé.',
      waterAction: response.waterAction,
    };
  } catch {
    return { reply: 'Hệ thống AI đang bận một chút, bạn thử lại sau nhé.' };
  }
}

export async function scanDrinkFromImage(
  file: File,
): Promise<{ name: string; amount: number; factor: number }> {
  try {
    const imageDataUrl = await fileToDataUrl(file);
    const response = await invokeAiGateway<{ name: string; amount: number; factor: number }>('scan', {
      imageDataUrl,
    });
    return response;
  } catch (error) {
    throw new Error(getAiErrorMessage(error) || 'Lỗi xử lý ảnh từ AI');
  }
}
