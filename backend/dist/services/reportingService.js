"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdfReport = exports.generateCsv = void 0;
const jspdf_1 = require("jspdf");
const jspdf_autotable_1 = __importDefault(require("jspdf-autotable"));
// CSV formatting helper
const generateCsv = (headers, rows) => {
    const escapeCsv = (val) => {
        if (val === null || val === undefined)
            return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
    };
    const headerRow = headers.map(escapeCsv).join(',');
    const dataRows = rows.map((row) => row.map(escapeCsv).join(','));
    return [headerRow, ...dataRows].join('\r\n');
};
exports.generateCsv = generateCsv;
const generatePdfReport = (params) => {
    const doc = new jspdf_1.jsPDF();
    // Header banner
    doc.setFillColor(11, 19, 43); // Navy #0B132B
    doc.rect(0, 0, 210, 28, 'F');
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MENTOR TREE - ACADEMIC MENTORING PORTAL', 14, 12);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(224, 231, 255);
    doc.text(params.title.toUpperCase(), 14, 20);
    // Generation timestamp
    const now = new Date().toLocaleString();
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated on: ${now}`, 14, 25);
    let startY = 36;
    // Metadata block
    if (params.meta && Object.keys(params.meta).length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'bold');
        doc.text('REPORT PARAMETERS & SUMMARY:', 14, startY);
        startY += 5;
        doc.setFont('helvetica', 'normal');
        const metaEntries = Object.entries(params.meta);
        let x = 14;
        let y = startY;
        metaEntries.forEach(([key, val], idx) => {
            doc.text(`${key}: ${val}`, x, y);
            x += 65;
            if ((idx + 1) % 3 === 0) {
                x = 14;
                y += 5;
            }
        });
        startY = y + 8;
    }
    // Table
    (0, jspdf_autotable_1.default)(doc, {
        startY: startY,
        head: [params.columns],
        body: params.rows,
        theme: 'grid',
        headStyles: {
            fillColor: [30, 41, 59], // Slate 800
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
        },
        styles: {
            fontSize: 8,
            cellPadding: 3,
            textColor: [30, 41, 59],
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Page ${data.pageNumber} of ${pageCount} | Confidential Institutional Mentoring Record`, 14, 290);
        },
    });
    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
};
exports.generatePdfReport = generatePdfReport;
