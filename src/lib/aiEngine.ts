import { invokeAiGateway } from './aiGateway';

export async function generateHydrationInsight(
  userContext: any,
  weeklyData: any[],
  activeWorkout: string | null,
): Promise<string> {
  try {
    const response = await invokeAiGateway<{ insight?: string }>('insight', {
      userContext,
      weeklyData,
      activeWorkout,
    });

    return response.insight?.trim() || 'Dữ liệu không đủ để phân tích lúc này.';
  } catch (error: any) {
    if (error.message?.includes('rate limit')) {
      throw new Error('Hệ thống AI đang quá tải. Vui lòng thử lại sau ít phút.');
    }
    throw new Error('Lỗi kết nối đến máy chủ AI. Không thể lấy dữ liệu.');
  }
}
