"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHelper = void 0;
class ResponseHelper {
    static success(data, msg = 'success') {
        return {
            code: 200,
            msg,
            data
        };
    }
    static fail(code = 500, msg = '操作失败', data) {
        return {
            code,
            msg,
            data
        };
    }
    static badRequest(msg = '参数错误', data) {
        return this.fail(400, msg, data);
    }
    static unauthorized(msg = '未授权', data) {
        return this.fail(401, msg, data);
    }
    static forbidden(msg = '禁止访问', data) {
        return this.fail(403, msg, data);
    }
    static notFound(msg = '资源不存在', data) {
        return this.fail(404, msg, data);
    }
    static serverError(msg = '服务器错误', data) {
        return this.fail(500, msg, data);
    }
    static serviceUnavailable(msg = '服务不可用', data) {
        return this.fail(503, msg, data);
    }
}
exports.ResponseHelper = ResponseHelper;
//# sourceMappingURL=response.helper.js.map