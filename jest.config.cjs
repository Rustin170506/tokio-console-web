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
    moduleNameMapper: {
        "(.+)\\.js": "$1",
    },
    testEnvironment: "node",
};
