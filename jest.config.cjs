module.exports = {
    moduleFileExtensions: ["js", "json", "ts"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: {
                    verbatimModuleSyntax: false,
                },
            },
        ],
    },
    testEnvironment: "node",
};
