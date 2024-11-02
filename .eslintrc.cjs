module.exports = {
    extends: ["@nuxtjs/eslint-config-typescript", "prettier"],
    rules: {
        // Disables eslint throwing an error on script setup vue files
        "import/first": "off",
    },
};
