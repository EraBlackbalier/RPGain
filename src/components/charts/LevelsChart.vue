<script setup lang="ts">
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { XPByType } from "../../models/XP";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  xpByType: XPByType[];
}>();

const XP_PER_LEVEL = 100;

const levels = computed(() =>
  props.xpByType.map((e) => ({
    type: e.task_type,
    level: Math.floor(e.total_xp / XP_PER_LEVEL) + 1,
    xp: e.total_xp,
    progress: e.total_xp % XP_PER_LEVEL,
  }))
);

const COLORS = [
  "#7c3aed", "#22c55e", "#eab308", "#ef4444",
  "#3b82f6", "#f97316", "#06b6d4", "#ec4899",
];

const chartData = computed(() => ({
  labels: levels.value.map((l) => l.type),
  datasets: [
    {
      label: "Nivel",
      data: levels.value.map((l) => l.level),
      backgroundColor: levels.value.map((_, i) => COLORS[i % COLORS.length]),
      borderRadius: 6,
      barPercentage: 0.45,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#1a1a2e",
      titleColor: "#e0e0e0",
      bodyColor: "#a78bfa",
      borderColor: "#2a2a4a",
      borderWidth: 1,
      padding: 10,
      cornerRadius: 6,
      callbacks: {
        label: (ctx: any) => {
          const l = levels.value[ctx.dataIndex];
          return `Nivel ${l.level} (${l.xp} XP)`;
        },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: "#888", font: { size: 11 } },
      grid: { color: "#2a2a4a", drawBorder: false },
      beginAtZero: true,
    },
    y: {
      ticks: { color: "#e0e0e0", font: { size: 12 } },
      grid: { display: false },
    },
  },
};
</script>

<template>
  <div class="chart-wrap">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-wrap {
  position: relative;
  height: 220px;
}
</style>
