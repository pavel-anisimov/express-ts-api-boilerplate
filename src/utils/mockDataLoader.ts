import fs from "node:fs";
import path from "node:path";

const MOCK_DATA_ROOT = path.join(process.cwd(), "mock-data");
const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

/**
 * Envelope shape used by mock files that return collection metadata.
 */
export type MockDataEnvelope<T> = Record<string, unknown> & {
    items: T[];
};

/**
 * Options shared by mock-data loading helpers.
 */
export type LoadMockDataOptions<T> = {
    enabled?: boolean;
    fallback?: T;
};

/**
 * Parses boolean-like environment flags.
 *
 * Unknown or empty values return `null` so callers can continue through their
 * fallback chain.
 */
function envFlag(name: string): boolean | null {
    const raw = process.env[name]?.trim().toLowerCase();
    if (!raw) {
        return null;
    }

    if (TRUE_VALUES.has(raw)) {
        return true;
    }

    if (FALSE_VALUES.has(raw)) {
        return false;
    }

    return null;
}

/**
 * Returns whether local mock data should be loaded.
 *
 * `MOCK_DATA_ENABLED` is the preferred flag. `MOCK_DATA` remains supported for
 * older local environments. Tests default to mock mode so they do not require
 * downstream Python services.
 */
export function isMockDataEnabled(): boolean {
    return (
        envFlag("MOCK_DATA_ENABLED") ??
        envFlag("MOCK_DATA") ??
        process.env.NODE_ENV === "test"
    );
}

/**
 * Resolves a mock-data path and prevents traversal outside `/mock-data`.
 */
export function resolveMockDataPath(relativeFilePath: string): string {
    const fullPath = path.resolve(MOCK_DATA_ROOT, relativeFilePath);
    const relativeToRoot = path.relative(MOCK_DATA_ROOT, fullPath);

    if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
        throw new Error(`Mock data path must stay inside ${MOCK_DATA_ROOT}`);
    }

    return fullPath;
}

/**
 * Narrows unknown JSON values to plain object records.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Detects comment-only records embedded in mock JSON arrays/objects.
 */
function isMockCommentRecord(value: unknown): boolean {
    return isRecord(value) && Object.hasOwn(value, "__mock_comment");
}

/**
 * Recursively removes mock-only comment metadata from parsed JSON.
 *
 * Mock files may include records or fields marked with `__mock_comment` so the
 * fixture can explain Python API response shapes. Runtime repositories should
 * never see those comment markers.
 */
function withoutMockComments(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value
            .filter((item) => !isMockCommentRecord(item))
            .map((item) => withoutMockComments(item));
    }

    if (!isRecord(value)) {
        return value;
    }

    const cleaned: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
        if (key === "__mock_comment") {
            continue;
        }

        cleaned[key] = withoutMockComments(item);
    }

    return cleaned;
}

/**
 * Returns an explicit fallback value, otherwise null.
 */
function fallbackOrNull<T>(options: LoadMockDataOptions<T>): T | null {
    return Object.hasOwn(options, "fallback") ? options.fallback as T : null;
}

/**
 * Loads and parses a mock JSON file when mock data is enabled.
 *
 * Missing files and disabled mock mode return the provided fallback or `null`.
 * Parsed data is cleaned of `__mock_comment` markers before it leaves the
 * loader.
 */
export function loadMockJson<T = unknown>(
    relativeFilePath: string,
    options: LoadMockDataOptions<T> = {},
): T | null {
    if (!(options.enabled ?? isMockDataEnabled())) {
        return fallbackOrNull(options);
    }

    const filePath = resolveMockDataPath(relativeFilePath);
    if (!fs.existsSync(filePath)) {
        return fallbackOrNull(options);
    }

    const raw = fs.readFileSync(filePath, "utf8");
    return withoutMockComments(JSON.parse(raw)) as T;
}

/**
 * Loads a mock collection from either a raw array or an `{ items }` envelope.
 */
export function loadMockItems<T = Record<string, unknown>>(
    relativeFilePath: string,
    options: LoadMockDataOptions<T[]> = {},
): T[] {
    const data = loadMockJson<unknown>(relativeFilePath, options);

    if (Array.isArray(data)) {
        return data as T[];
    }

    if (isRecord(data) && Array.isArray(data.items)) {
        return data.items as T[];
    }

    return fallbackOrNull(options) ?? [];
}

/**
 * Loads mock records that look like user-like objects.
 *
 * This helper is intentionally stricter than `loadMockItems`: it filters out
 * non-object rows and rows without string `id`/`email` fields.
 */
export function loadMockRecords(
    relativeFilePath: string,
    options: LoadMockDataOptions<Record<string, unknown>[]> = {},
): Record<string, unknown>[] {
    return loadMockItems<Record<string, unknown>>(relativeFilePath, options).filter((item): item is Record<string, unknown> => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            return false;
        }

        return typeof item.id === "string" && typeof item.email === "string";
    });
}

/**
 * Loads a mock collection envelope while accepting raw arrays for convenience.
 */
export function loadMockEnvelope<T = Record<string, unknown>>(
    relativeFilePath: string,
    options: LoadMockDataOptions<MockDataEnvelope<T>> = {},
): MockDataEnvelope<T> | null {
    const data = loadMockJson<unknown>(relativeFilePath, options);

    if (Array.isArray(data)) {
        return { items: data as T[] };
    }

    if (isRecord(data)) {
        return {
            ...data,
            items: Array.isArray(data.items) ? data.items as T[] : [],
        };
    }

    return fallbackOrNull(options);
}

/**
 * Finds the first matching item in a mock collection.
 */
export function findMockItem<T = Record<string, unknown>>(
    relativeFilePath: string,
    predicate: (item: T) => boolean,
    options: LoadMockDataOptions<T[]> = {},
): T | null {
    return loadMockItems<T>(relativeFilePath, options).find(predicate) ?? null;
}
