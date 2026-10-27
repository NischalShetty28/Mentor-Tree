"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDepartment = exports.getDepartments = void 0;
const prisma_1 = require("../prisma");
const getDepartments = async (req, res) => {
    try {
        const departments = await prisma_1.prisma.department.findMany({
            orderBy: { code: 'asc' },
            include: {
                _count: {
                    select: { mentees: true, mentors: true },
                },
            },
        });
        res.json(departments);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch departments.' });
    }
};
exports.getDepartments = getDepartments;
const createDepartment = async (req, res) => {
    try {
        const { code, name, description } = req.body;
        if (!code || !name) {
            res.status(400).json({ message: 'Code and name are required.' });
            return;
        }
        const existing = await prisma_1.prisma.department.findUnique({
            where: { code: code.toUpperCase().trim() },
        });
        if (existing) {
            res.status(400).json({ message: 'Department code already exists.' });
            return;
        }
        const dept = await prisma_1.prisma.department.create({
            data: {
                code: code.toUpperCase().trim(),
                name: name.trim(),
                description: description ? description.trim() : null,
            },
        });
        res.status(201).json(dept);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create department.' });
    }
};
exports.createDepartment = createDepartment;
