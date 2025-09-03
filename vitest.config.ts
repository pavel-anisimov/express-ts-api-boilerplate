import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./vitest.setup.ts'],
        include: ['tests/**/*.test.ts'],
        coverage: { reporter: ['text', 'html'] },
    },
});
