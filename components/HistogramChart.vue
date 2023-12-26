<!-- TODO: add test for this component -->
<template>
    <Bar :data="data" :options="chartOptions" />
</template>

<script>
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

export default {
    components: {
        Bar,
    },
    props: {
        data: {
            type: Object,
            required: true,
        },
        options: {
            type: Object,
            default: () => ({}),
        },
    },

    setup() {
        const colorMode = useColorMode();

        // Computed property for dynamic chart options based on color mode.
        const chartOptions = computed(() => {
            const isDarkMode = colorMode.value === "dark";
            return {
                reactive: true,
                maintainAspectRatio: false,
                backgroundColor: isDarkMode ? "#F3F4F6" : "#4B5563",
                scales: {
                    x: {
                        ticks: {
                            color: isDarkMode ? "white" : "black",
                        },
                        grid: {
                            display: false,
                        },
                    },
                    y: {
                        ticks: {
                            color: isDarkMode ? "white" : "black",
                        },
                        grid: {
                            color: isDarkMode ? "gray" : undefined,
                        },
                    },
                },
            };
        });

        return {
            chartOptions,
        };
    },
};
</script>
