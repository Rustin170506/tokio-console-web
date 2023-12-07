<template>
    <header class="u-header">
        <div class="u-header__left">
            <slot name="left"></slot>
        </div>
        <div class="u-header__right">
            <slot name="right"></slot>
        </div>
    </header>
</template>

<style scoped>
.u-header {
    display: flex;
    justify-content: space-between;
    padding: 1em;
}

.u-header__left,
.u-header__right {
    display: flex;
    align-items: center;
}
</style>
