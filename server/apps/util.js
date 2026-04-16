/**
 * Base class for MCP App tool parameter objects.
 *
 * Subclasses define two static getters — fields and defaults.
 * Types and descriptions are declared together in fields.
 *
 * Example subclass:
 *
 *   class MyParams extends McpAppParams {
 *       static get fields() {
 *           return {
 *               name:  { type: "string",  description: "User name" },
 *               count: { type: "integer", description: "Number of items" },
 *           };
 *       }
 *       static get defaults() { return { name: null, count: 10 }; }
 *   }
 *
 * Usage:
 *
 *   // Generate inputSchema.properties for ListTools:
 *   MyParams.properties()
 *   // => { name: { type: "string", description: "User name" },
 *   //      count: { type: "integer", description: "Number of items" } }
 *
 *   // Construct with validation + defaults:
 *   const p = new MyParams({ name: "Alice" })
 *   // => { name: "Alice", count: 10 }
 *
 *   // Bad input throws before construction:
 *   new MyParams({ count: "not a number" })
 *   // => Error: Invalid params: count: expected integer, got "not a number"
 */
export class McpAppParams {
    /**
     * Field definitions — each key maps to { type, description }.
     * Drives schema generation (properties()), validation, and construction.
     */
    static get fields() { return {}; }

    /**
     * Field names → default values.
     * Applied in the constructor when a param is not provided.
     */
    static get defaults() { return {}; }

    /**
     * List of field names that must be provided.
     * validate() throws if any are missing from params.
     */
    static get required() { return []; }

    /**
     * Validates params, then sets each field from params falling back to defaults.
     */
    constructor(params = {}) {
        new.target.validate(params);
        const defaults = new.target.defaults;
        for (const key of Object.keys(new.target.fields)) {
            this[key] = params[key] !== undefined ? params[key] : defaults[key];
        }
    }

    /**
     * Returns fields as an inputSchema-compatible properties object.
     * Each field's { type, description } is already in the right shape.
     *
     * Output example:
     *   {
     *       name:  { type: "string",  description: "User name" },
     *       count: { type: "integer", description: "Number of items" }
     *   }
     */
    static properties() {
        const props = {};
        for (const [key, { type, description }] of Object.entries(this.fields)) {
            props[key] = { type, description };
        }
        return props;
    }

    /**
     * Checks each param value against the expected type from fields.
     * Throws a single error listing all mismatches.
     *
     * Only validates keys that exist in both params and fields — unknown
     * keys are ignored (the constructor simply won't set them).
     */
    static validate(params = {}) {
        const errors = [];
        const fields = this.fields;
        for (const key of this.required) {
            if (params[key] === undefined || params[key] === null) {
                errors.push(`${key}: required but missing`);
            }
        }
        for (const [key, value] of Object.entries(params)) {
            if (value === undefined || value === null) continue;
            const field = fields[key];
            if (!field) continue;
            const expected = field.type;
            const actual = typeof value;
            if (expected === "string" && actual !== "string")
                errors.push(`${key}: expected string, got ${actual}`);
            if (expected === "integer" && !Number.isInteger(value))
                errors.push(`${key}: expected integer, got ${JSON.stringify(value)}`);
            if (expected === "number" && actual !== "number")
                errors.push(`${key}: expected number, got ${actual}`);
            if (expected === "boolean" && actual !== "boolean")
                errors.push(`${key}: expected boolean, got ${actual}`);
        }
        if (errors.length) {
            throw new Error(`Invalid params: ${errors.join("; ")}`);
        }
    }
}
