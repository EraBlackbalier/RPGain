<script setup lang="ts">
import { computed } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { XPLog } from "../../models/XP";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps<{
  logs: XPLog[];
}>();

const chartData = computed(() => {
  const days = new Map<string, number>();

  for (const log of [...props.logs].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const d = new Date(log.created_at);
    const key = d.toLocaleDateString("es", { day: "2-digit", month: "short" });
    days.set(key, (days.get(key) || 0) + log.xp_amount);
  }

  const labels = Array.from(days.keys());
  const data = Array.from(days.values());

  return {
    labels,
    datasets: [
      {
        label: "XP por día",
        data,
        borderColor: "#7c3aed",
        backgroundColor: "rgba(124, 58, 237, 0.15)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#7c3aed",
        pointBorderColor: "#16162a",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
});

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
    },
  },
  scales: {
    x: {
      ticks: { color: "#888", font: { size: 11 } },
      grid: { color: "#2a2a4a", drawBorder: false },
    },
    y: {
      ticks: { color: "#888", font: { size: 11 } },
      grid: { color: "#2a2a4a", drawBorder: false },
      beginAtZero: true,
    },
  },
};
</script>

<template>
  <div class="chart-wrap">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-wrap {
  position: relative;
  height: 220px;
}
</style>
