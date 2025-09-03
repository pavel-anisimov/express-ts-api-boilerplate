// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";

export default [
    {
        ignores: ["dist", "node_modules"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            import: importPlugin,
        },
        rules: {
            "@typescript-eslint/consistent-type-imports": "warn",

            "import/order": [
                "warn",
                { "newlines-between": "always" }
            ],

            // ⬇️ this will remove complaints about variables/arguments starting with "_"
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
            ],
        },
    },
    prettier,
];
