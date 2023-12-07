<template>
    <div class="logo-container">
        <img class="logo" src="~/assets/tokio.svg" alt="Tokio Logo" />
        <h1 class="title">Tokio Console</h1>
    </div>
</template>

<script>
export default {
    name: "TokioLogo",
};
</script>

<style scoped>
.logo-container {
    display: flex;
    align-items: center;
}

.logo {
    width: 40px;
    height: auto;
    margin-right: 10px;
}

.title {
    font-size: 24px;
    font-weight: bold;
    color: #333;
}
</style>
