"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const serve_static_1 = require("@nestjs/serve-static");
const path = require("path");
const fs = require("fs");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const upload_module_1 = require("./upload/upload.module");
const video_module_1 = require("./video/video.module");
const chat_module_1 = require("./chat/chat.module");
const vip_module_1 = require("./vip/vip.module");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./auth/auth.module");
function getUploadDir() {
    const envUploadDir = process.env.UPLOAD_DIR;
    if (envUploadDir) {
        return envUploadDir;
    }
    const cwd = process.cwd();
    if (cwd.includes('bytefaas') || cwd.includes('dist')) {
        return '/tmp/uploads';
    }
    return path.join(cwd, 'uploads');
}
const uploadDir = getUploadDir();
if (!fs.existsSync(uploadDir)) {
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    catch (error) {
        console.warn('[AppModule] 无法创建上传目录:', error.message);
    }
}
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: path.join(process.cwd(), '..', '.env.local'),
            }),
            ...(fs.existsSync(uploadDir)
                ? [
                    serve_static_1.ServeStaticModule.forRoot({
                        rootPath: uploadDir,
                        serveRoot: '/api/uploads',
                    }),
                ]
                : []),
            upload_module_1.UploadModule,
            video_module_1.VideoModule,
            chat_module_1.ChatModule,
            vip_module_1.VIPModule,
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map