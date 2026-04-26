import { isSupabaseConfigured, supabase } from './supabase';

type AiGatewayAction =
  | 'advice'
  | 'chat'
  | 'scan'
  | 'insight'
  | 'report-analysis';

type AiGatewayError = {
  error?: string;
};

export async function invokeAiGateway<T>(
  action: AiGatewayAction,
  payload: Record<string, unknown>,
): Promise<T> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Cloud AI chưa được cấu hình.');
  }

  const { data, error } = await supabase.functions.invoke('ai-gateway', {
    body: { action, ...payload },
  });

  if (error) {
    throw new Error(error.message || 'Không thể kết nối AI gateway.');
  }

  const response = data as AiGatewayError | null;
  if (response?.error) {
    throw new Error(response.error);
  }

  return data as T;
}
