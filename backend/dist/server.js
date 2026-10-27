"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = require("./config");
const errorHandler_1 = require("./middlewares/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const mentee_routes_1 = __importDefault(require("./routes/mentee.routes"));
const mentor_routes_1 = __importDefault(require("./routes/mentor.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const meeting_routes_1 = __importDefault(require("./routes/meeting.routes"));
const alert_routes_1 = __importDefault(require("./routes/alert.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
exports.app = (0, express_1.default)();
// Security and utility middlewares
exports.app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Permissive for local API usage
}));
exports.app.use((0, cors_1.default)({
    origin: '*',
    credentials: true,
}));
exports.app.use(express_1.default.json({ limit: '10mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (config_1.config.nodeEnv !== 'test') {
    exports.app.use((0, morgan_1.default)('dev'));
}
// Health check endpoint
exports.app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'MentorTree API',
        timestamp: new Date().toISOString(),
        environment: config_1.config.nodeEnv,
    });
});
// Mount Routes
exports.app.use('/api/auth', auth_routes_1.default);
exports.app.use('/api/mentee', mentee_routes_1.default);
exports.app.use('/api/mentor', mentor_routes_1.default);
exports.app.use('/api/admin', admin_routes_1.default);
exports.app.use('/api/meetings', meeting_routes_1.default);
exports.app.use('/api/alerts', alert_routes_1.default);
exports.app.use('/api/notifications', notification_routes_1.default);
exports.app.use('/api/reports', report_routes_1.default);
exports.app.use('/api/departments', department_routes_1.default);
// Error Handling Middleware
exports.app.use(errorHandler_1.errorHandler);
if (process.env.NODE_ENV !== 'test') {
    exports.app.listen(config_1.config.port, () => {
        console.log(`=========================================`);
        console.log(`🚀 MentorTree Backend Server running on: http://localhost:${config_1.config.port}`);
        console.log(`📋 Health check available at: http://localhost:${config_1.config.port}/api/health`);
        console.log(`=========================================`);
    });
}
