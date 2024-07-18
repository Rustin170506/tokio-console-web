<template>
    <USlideover>
        <div class="p-4 flex-1 space-y-4">
            <UAlert
                icon="i-heroicons-exclamation-triangle-20-solid"
                color="yellow"
                variant="outline"
                title="Never Yield"
                description="Tasks have never yielded (threshold 1000ms)"
            />
            <UAlert
                icon="i-heroicons-exclamation-triangle-20-solid"
                color="yellow"
                variant="outline"
                title="Lost Waker"
                description="Tasks have lost their waker"
            />
            <UAlert
                icon="i-heroicons-exclamation-triangle-20-solid"
                color="yellow"
                variant="outline"
                title="Self Wake"
                description="Tasks have woken themselves over 50% of the time"
            />
        </div>
    </USlideover>
</template>
