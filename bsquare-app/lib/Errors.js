"user strict";

let BaseError = exports.BaseError = class BaseError extends Error {
    constructor(status, data = null) {
        let message = data ? data.message : null;
        super(message);
        this.status = status;
        this.data = data;
    }
};

exports.Forbidden = class Forbidden extends BaseError {
    constructor(status, data) {
        super(status, data);
        status = status || "forbidden";
        this.statusCode = 403;
    }
};

exports.BadRequest = class BadRequest extends BaseError {
    constructor(status, data) {
        super(status, data);
        status = status || "bad_request";
        this.statusCode = 400;
    }
};

exports.NotFound = class NotFound extends BaseError {
    constructor(status, data) {
        super(status, data);
        status = status || "not_found";
        this.statusCode = 404;
    }
};

exports.UnprocessableEntity = class UnprocessableEntity extends BaseError {
    constructor(status, data) {
        super(status, data);
        status = status || "unprocessable_entity";
        this.statusCode = 422;
    }
};

exports.Unauthorized = class Unauthorized extends BaseError {
    constructor(status, data) {
        super(status, data);
        status = status || "unauthorized";
        this.statusCode = 401;
    }
};

exports.InternalServerError = class InternalServerError extends BaseError {
    constructor(status, data) {
        super(status, data);
        status = status || "internal_server_error";
        this.statusCode = 500;
    }
};
