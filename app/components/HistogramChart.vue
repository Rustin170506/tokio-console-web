<!-- TODO: add test for this component -->
<template>
    <Bar :data="data" :options="chartOptions" />
</template>

<script setup>
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
} from "chart.js";

import { Bar } from "vue-chartjs";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
);

defineProps({
    data: {
        type: Object,
        required: true,
    },
    options: {
        type: Object,
        default: () => ({}),
    },
});

const colorMode = useColorMode();

// Computed property for dynamic chart options based on color mode.
const chartOptions = computed(() => {
    const isDarkMode = colorMode.value === "dark";
    const color = isDarkMode ? "white" : "black";
    const gridColor = isDarkMode ? "gray" : undefined;
    return {
        reactive: true,
        maintainAspectRatio: false,
        backgroundColor: isDarkMode ? "#F3F4F6" : "#4B5563",
        scales: {
            x: {
                ticks: {
                    color,
                },
                grid: {
                    display: false,
                },
            },
            y: {
                ticks: {
                    color,
                },
                grid: {
                    color: gridColor,
                },
            },
        },
        plugins: {
            legend: {
                labels: {
                    color,
                },
            },
        },
    };
});
</script>
