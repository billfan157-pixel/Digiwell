import React from 'react';
import { BatteryFull, BatteryMedium, BatteryLow } from 'lucide-react';
import type { RuleTrigger, RuleAction, AutomationRule } from './types';

export const CAPACITY = 750;
export const FIRMWARE_VERSION = 'FW 2.7.14-LAB';
export const LAB_BUILD = 'BLE Core 5.4 | Sensor DSP r18';

export const ledColors = [
  { name: 'Cyan Pulse', value: '#22d3ee' },
  { name: 'Volt Lime', value: '#84cc16' },
  { name: 'Infra Red', value: '#fb7185' },
  { name: 'Amber Fog', value: '#f59e0b' },
];

export const getBatteryIcon = (level: number) => {
  if (level > 70) return <BatteryFull size={18} className="text-emerald-400" />;
  if (level > 30) return <BatteryMedium size={18} className="text-amber-400" />;
  return <BatteryLow size={18} className="text-rose-400" />;
};

export const ruleTriggerLabel: Record<RuleTrigger, string> = {
  goal_time: 'Qua một mốc giờ mà chưa đạt mục tiêu',
  weather_temp: 'Nhiệt độ ngoài trời vượt ngưỡng',
  low_battery: 'Pin bình chạm ngưỡng tiết kiệm',
};

export const ruleActionLabel: Record<RuleAction, string> = {
  red_strobe: 'Nháy đỏ liên tục',
  boost_reminders: 'Tăng nhắc nhở mỗi 30 phút',
  cyan_wave: 'Chạy sóng cyan dịu',
  power_save: 'Hạ sáng LED và giảm sync',
};

export const buildRuleDescription = (trigger: RuleTrigger, action: RuleAction, time: string, threshold: number) => {
  if (trigger === 'goal_time') {
    return `Nếu qua ${time} mà chưa đạt ${threshold}% mục tiêu thì ${ruleActionLabel[action].toLowerCase()}.`;
  }
  if (trigger === 'weather_temp') {
    return `Nếu ngoài trời vượt ${threshold}°C thì ${ruleActionLabel[action].toLowerCase()}.`;
  }
  return `Nếu pin xuống dưới ${threshold}% thì ${ruleActionLabel[action].toLowerCase()}.`;
};

export const createPresetRules = (): AutomationRule[] => [
  {
    id: 'preset-1', trigger: 'goal_time', action: 'red_strobe',
    active: true, time: '14:00', threshold: 50,
    description: buildRuleDescription('goal_time', 'red_strobe', '14:00', 50),
  },
  {
    id: 'preset-2', trigger: 'weather_temp', action: 'boost_reminders',
    active: true, time: '12:00', threshold: 35,
    description: buildRuleDescription('weather_temp', 'boost_reminders', '12:00', 35),
  },
];