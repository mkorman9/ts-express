export interface PaginationSettings {
    page: number | null;
    pageSize: number | null;
}

export interface SortingSettings {
    sortBy: string | null;
    sortReverse: boolean | null;
}

export interface ErrorCause {
    field: string;
    code: string;
}

export interface APICallError {
    causes: ErrorCause[];
}

export class ValidationError extends Error {
    public causes: ErrorCause[];

    constructor(causes: ErrorCause[]) {
        super('Validation error');
        this.causes = causes;
    }
}

export class UnauthorizedError extends Error {
    public causes: ErrorCause[];

    constructor(causes: ErrorCause[]) {
        super('Unauthorized error');
        this.causes = causes;
    }
}

export class AccessDeniedError extends Error {
    public causes: ErrorCause[];

    constructor(causes: ErrorCause[]) {
        super('Access denied error');
        this.causes = causes;
    }
}

export class RateLimitingError extends Error {
    public causes: ErrorCause[] = [];

    constructor() {
        super('Rate limit exceeded');
    }
}

export class InternalServerError extends Error {
    public causes: ErrorCause[] = [];

    constructor() {
        super('Internal server error');
    }
}

export class UnknownResponseError extends Error {
    public causes: ErrorCause[] = [];

    constructor() {
        super('Unknown response error');
    }
}

export class NetworkError extends Error {
    public causes: ErrorCause[] = [];

    constructor() {
        super('Network error');
    }
}
