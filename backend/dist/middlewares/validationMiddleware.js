"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorMessages = error.errors.map((err) => ({
                    field: err.path.slice(1).join('.'),
                    message: err.message,
                }));
                res.status(400).json({
                    message: 'Validation failed',
                    errors: errorMessages,
                });
                return;
            }
            res.status(500).json({ message: 'Internal server error during validation.' });
        }
    };
};
exports.validateRequest = validateRequest;
