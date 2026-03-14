"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
let UploadService = class UploadService {
    constructor() {
        console.log('[UploadService] 初始化上传目录...');
        const envUploadDir = process.env.UPLOAD_DIR;
        if (envUploadDir) {
            this.uploadDir = envUploadDir;
            console.log('[UploadService] 使用环境变量配置的上传目录:', this.uploadDir);
        }
        else {
            const cwd = process.cwd();
            if (cwd.includes('bytefaas') || cwd.includes('dist')) {
                this.uploadDir = '/tmp/uploads';
                console.log('[UploadService] 检测到部署环境，使用 /tmp/uploads');
            }
            else {
                this.uploadDir = path.join(cwd, 'uploads');
                console.log('[UploadService] 检测到开发环境，使用', this.uploadDir);
            }
        }
        console.log('[UploadService] 工作目录:', process.cwd());
        console.log('[UploadService] 上传目录:', this.uploadDir);
        try {
            if (!fs.existsSync(this.uploadDir)) {
                console.log('[UploadService] 创建上传目录:', this.uploadDir);
                const parentDir = path.dirname(this.uploadDir);
                if (!fs.existsSync(parentDir)) {
                    console.log('[UploadService] 创建父目录:', parentDir);
                    fs.mkdirSync(parentDir, { recursive: true });
                }
                fs.mkdirSync(this.uploadDir, { recursive: true });
                console.log('[UploadService] 上传目录创建成功');
            }
            else {
                console.log('[UploadService] 上传目录已存在');
            }
        }
        catch (error) {
            console.error('[UploadService] 创建上传目录失败:', error.message);
            console.error('[UploadService] 错误堆栈:', error.stack);
            const fallbackDir = '/tmp/uploads';
            console.log('[UploadService] 尝试使用备用目录:', fallbackDir);
            try {
                if (!fs.existsSync(fallbackDir)) {
                    fs.mkdirSync(fallbackDir, { recursive: true });
                }
                this.uploadDir = fallbackDir;
                console.log('[UploadService] 成功切换到备用目录:', this.uploadDir);
            }
            catch (fallbackError) {
                console.error('[UploadService] 备用目录创建也失败:', fallbackError.message);
                throw new Error(`无法创建上传目录: ${this.uploadDir} 和 ${fallbackDir} 均失败`);
            }
        }
    }
    async upload(file) {
        try {
            if (!file || !file.buffer) {
                throw new Error('文件为空');
            }
            console.log('[UploadService] 开始保存文件...');
            const timestamp = Date.now();
            const ext = path.extname(file.originalname);
            const filename = `${timestamp}${ext}`;
            const filepath = path.join(this.uploadDir, filename);
            fs.writeFileSync(filepath, file.buffer);
            console.log('[UploadService] 文件保存成功:', filename);
            console.log('[UploadService] 文件路径:', filepath);
            const publicUrl = `/api/uploads/${filename}`;
            console.log('[UploadService] 生成的URL:', publicUrl);
            return {
                url: publicUrl,
                fileKey: filename,
                filename: filename,
                size: file.size,
                mimetype: file.mimetype
            };
        }
        catch (error) {
            console.error('[UploadService] 保存文件失败:', error);
            throw error;
        }
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UploadService);
//# sourceMappingURL=upload.service.js.map