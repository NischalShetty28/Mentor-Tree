"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const departmentController_1 = require("../controllers/departmentController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const types_1 = require("../types");
const router = (0, express_1.Router)();
// Publicly readable so signup pages can populate department dropdowns!
router.get('/', departmentController_1.getDepartments);
router.post('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(types_1.Role.ADMIN, types_1.Role.HOD), departmentController_1.createDepartment);
exports.default = router;
