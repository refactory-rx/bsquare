"use strict";

class BaseError extends Error {
    constructor(status, data = null) {
        let message = data ? data.message : null;
        super(message);
        this.message = message;
        this.status = status;
        this.data = data;
    }
}

export class Forbidden extends BaseError {
    constructor(status, data) {
        status = status || "forbidden";
        super(status, data);
        this.statusCode = 403;
    }
}

export class BadRequest extends BaseError {
    constructor(status, data) {
        status = status || "bad_request";
        super(status, data);
        this.statusCode = 400;
    }
}

export class NotFound extends BaseError {
    constructor(status, data) {
        status = status || "not_found";
        super(status, data);
        this.statusCode = 404;
    }
}

export class UnprocessableEntity extends BaseError {
    constructor(status, data) {
        status = status || "unprocessable_entity";
        super(status, data);
        this.statusCode = 422;
    }
}

export class Unauthorized extends BaseError {
    constructor(status, data) {
        status = status || "unauthorized";
        super(status, data);
        this.statusCode = 401;
    }
}

export class InternalServerError extends BaseError {
    constructor(status, data) {
        status = status || "internal_server_error";
        super(status, data);
        this.statusCode = 500;
    }
}
