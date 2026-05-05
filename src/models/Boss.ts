// ═══════════════════════════════════════════════════════════════
//  MODELO BOSS (Jefe / Reto Complejo)
// ═══════════════════════════════════════════════════════════════
// Un Boss es un reto complejo con requisitos múltiples y
// recompensas significativas. Se desbloquea cumpliendo todos
// sus requisitos y otorga rewards al ser derrotado.
// ═══════════════════════════════════════════════════════════════

export type BossStatus = "locked" | "available" | "in_progress" | "defeated";
export type RequirementType = "tasks_completed" | "xp_earned" | "skill_unlocked" | "level_reached" | "specific_task";
export type RewardType = "xp" | "title" | "badge";

export interface Boss {
  id: number;
  session_id: number;
  name: string;
  description: string;
  icon: string;
  difficulty: number;          // 1-5
  status: BossStatus;
  xp_reward: number;
  created_at: string;
  defeated_at: string | null;
  requirements: BossRequirement[];
  rewards: BossReward[];
}

export interface BossRequirement {
  id: number;
  boss_id: number;
  requirement_type: RequirementType;
  description: string;
  target_value: number;
  current_value: number;
  completed: boolean;
}

export interface BossReward {
  id: number;
  boss_id: number;
  reward_type: RewardType;
  value: string;
  description: string;
  claimed: boolean;
}

export interface CreateBossPayload {
  session_id: number;
  name: string;
  description?: string;
  icon?: string;
  difficulty?: number;
  xp_reward?: number;
  requirements: CreateRequirementPayload[];
  rewards: CreateRewardPayload[];
}

export interface CreateRequirementPayload {
  requirement_type: RequirementType;
  description: string;
  target_value: number;
}

export interface CreateRewardPayload {
  reward_type: RewardType;
  value: string;
  description: string;
}
