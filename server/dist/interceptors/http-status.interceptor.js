"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpStatusInterceptor = void 0;
const common_1 = require("@nestjs/common");
let HttpStatusInterceptor = class HttpStatusInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        if (request.method === 'POST' && response.statusCode === 201) {
            response.status(200);
        }
        return next.handle();
    }
};
exports.HttpStatusInterceptor = HttpStatusInterceptor;
exports.HttpStatusInterceptor = HttpStatusInterceptor = __decorate([
    (0, common_1.Injectable)()
], HttpStatusInterceptor);
//# sourceMappingURL=http-status.interceptor.js.map