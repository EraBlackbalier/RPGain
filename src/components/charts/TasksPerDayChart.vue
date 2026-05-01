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
import type { Task } from "../../models/Task";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  tasks: Task[];
}>();

const chartData = computed(() => {
  const created = new Map<string, { count: number; label: string }>();
  const completed = new Map<string, { count: number; label: string }>();

  for (const task of props.tasks) {
    const d = new Date(task.created_at);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("es", { day: "2-digit", month: "short" });
    const prev = created.get(iso);
    created.set(iso, { count: (prev?.count || 0) + 1, label: prev?.label || label });

    if (task.completed_at) {
      const dc = new Date(task.completed_at);
      const isoc = dc.toISOString().slice(0, 10);
      const lc = dc.toLocaleDateString("es", { day: "2-digit", month: "short" });
      const prevc = completed.get(isoc);
      completed.set(isoc, { count: (prevc?.count || 0) + 1, label: prevc?.label || lc });
    }
  }

  const allKeys = Array.from(new Set([...created.keys(), ...completed.keys()])).sort();

  return {
    labels: allKeys.map((k) => created.get(k)?.label || completed.get(k)?.label || k),
    datasets: [
      {
        label: "Creadas",
        data: allKeys.map((k) => created.get(k)?.count || 0),
        backgroundColor: "#3b82f6",
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: "Completadas",
        data: allKeys.map((k) => completed.get(k)?.count || 0),
        backgroundColor: "#22c55e",
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: "#888", font: { size: 11 }, boxWidth: 12 },
    },
    tooltip: {
      backgroundColor: "#1a1a2e",
      titleColor: "#e0e0e0",
      bodyColor: "#e0e0e0",
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
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-wrap {
  position: relative;
  height: 220px;
}
</style>
