import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: { mentees: true, mentors: true },
        },
      },
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch departments.' });
  }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, description } = req.body;
    if (!code || !name) {
      res.status(400).json({ message: 'Code and name are required.' });
      return;
    }

    const existing = await prisma.department.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (existing) {
      res.status(400).json({ message: 'Department code already exists.' });
      return;
    }

    const dept = await prisma.department.create({
      data: {
        code: code.toUpperCase().trim(),
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });

    res.status(201).json(dept);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create department.' });
  }
};
