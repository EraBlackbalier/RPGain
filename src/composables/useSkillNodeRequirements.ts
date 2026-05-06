// ═══════════════════════════════════════════════════════════════
//  COMPOSABLE: useSkillNodeRequirements
// ═══════════════════════════════════════════════════════════════
// Validación reactiva de requisitos de nodos de habilidades.
// Sincroniza automáticamente cuando atributos o nodos cambian.
// ═══════════════════════════════════════════════════════════════

import { computed, ref, watch } from "vue";
import type { SkillNode, SkillNodeRequirement } from "../models/Skill";
import type { Attribute } from "../models/Attribute";
import * as tauriService from "../services/tauriService";

export interface RequirementStatus {
  met: boolean;
  description: string;
  icon: string;
}

export interface NodeRequirementsStatus {
  nodeId: number;
  canUnlock: boolean;
  requirementsMet: RequirementStatus[];
  blockedBy: string[];
}

export function useSkillNodeRequirements(
  node: SkillNode,
  sessionId: number,
  attributes: Attribute[],
  unlockedNodesCount: number,
  bossesDefeatedCount: number,
  playerLevel: number
) {
  const validating = ref(false);
  const requirementStatus = ref<NodeRequirementsStatus | null>(null);

  // ── Validación local de requisitos ──
  const localRequirementsMet = computed<RequirementStatus[]>(() => {
    return node.requirements.map((req) => {
      const status = checkRequirement(req, attributes, unlockedNodesCount, bossesDefeatedCount, playerLevel);
      return status;
    });
  });

  // ── Validación en el backend ──
  async function validateWithBackend(): Promise<boolean> {
    validating.value = true;
    try {
      const isValid = await tauriService.checkSkillNodeRequirements(node.id, sessionId);
      validating.value = false;
      return isValid;
    } catch (e) {
      console.error("Error validating node requirements:", e);
      validating.value = false;
      return false;
    }
  }

  // ── Chequeo local de un requisito individual ──
  function checkRequirement(
    req: SkillNodeRequirement,
    attrs: Attribute[],
    unlockedCount: number,
    bossesCount: number,
    level: number
  ): RequirementStatus {
    switch (req.requirement_type) {
      case "attribute_equipped": {
        if (req.reference_id === null) {
          return {
            met: false,
            description: "Atributo no especificado",
            icon: "error",
          };
        }
        const equippedAttr = attrs.find(
          (a) => a.id === req.reference_id && a.equipped && a.unlocked
        );
        return {
          met: !!equippedAttr,
          description: equippedAttr
            ? `✓ ${equippedAttr.name} equipado`
            : `✗ Requiere: ${req.description}`,
          icon: equippedAttr ? "check" : "gem",
        };
      }

      case "nodes_unlocked": {
        const met = unlockedCount >= req.target_value;
        return {
          met,
          description: met
            ? `✓ ${unlockedCount}/${req.target_value} nodos desbloqueados`
            : `✗ ${unlockedCount}/${req.target_value} nodos desbloqueados`,
          icon: met ? "check" : "star",
        };
      }

      case "bosses_defeated": {
        const met = bossesCount >= req.target_value;
        return {
          met,
          description: met
            ? `✓ ${bossesCount}/${req.target_value} jefes derrotados`
            : `✗ ${bossesCount}/${req.target_value} jefes derrotados`,
          icon: met ? "check" : "skull",
        };
      }

      case "level_reached": {
        const met = level >= req.target_value;
        return {
          met,
          description: met
            ? `✓ Nivel ${level} (requerido: ${req.target_value})`
            : `✗ Nivel ${level} (requerido: ${req.target_value})`,
          icon: met ? "check" : "xp",
        };
      }

      default:
        return {
          met: true,
          description: req.description,
          icon: "star",
        };
    }
  }

  // ── Calcular cuáles requisitos no se cumplen ──
  const blockedBy = computed<string[]>(() => {
    return localRequirementsMet.value
      .filter((s) => !s.met)
      .map((s) => s.description);
  });

  // ── Revalidar cuando cambian las dependencias ──
  watch(
    [() => attributes, () => unlockedNodesCount, () => bossesDefeatedCount, () => playerLevel],
    () => {
      validateWithBackend();
    },
    { deep: true }
  );

  return {
    validating,
    requirementStatus,
    localRequirementsMet,
    blockedBy,
    validateWithBackend,
    checkRequirement,
  };
}
