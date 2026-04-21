export type ActiveView = 'lab' | 'arena';
export type LabSectionKey = 'diagnostics' | 'led' | 'automation' | 'developer' | 'console';
export type LedPattern = 'breathe' | 'wave' | 'strobe' | 'heart-sync';
export type RuleTrigger = 'goal_time' | 'weather_temp' | 'low_battery';
export type RuleAction = 'red_strobe' | 'boost_reminders' | 'cyan_wave' | 'power_save';

export interface AutomationRule {
  id: string;
  trigger: RuleTrigger;
  action: RuleAction;
  active: boolean;
  time: string;
  threshold: number;
  description: string;
  status?: string;
}