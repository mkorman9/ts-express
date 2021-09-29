import axios from 'axios';
import type { AxiosResponse, AxiosRequestConfig } from 'axios';

import {
    ValidationError,
    UnauthorizedError,
    AccessDeniedError,
    RateLimitingError,
    InternalServerError,
    UnknownResponseError,
    NetworkError
} from './API.d';
import type {
    APICallError
} from './API.d';

export {
    ValidationError,
    UnauthorizedError,
    AccessDeniedError,
    RateLimitingError,
    InternalServerError,
    UnknownResponseError,
    NetworkError
} from './API.d';
export type {
    PaginationSettings,
    SortingSettings,
    ErrorCause,
    APICallError
} from './API.d';

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
    response => response,
    err => {
        if (!err.response) {
            return Promise.reject(new NetworkError());
        }

        if (err.response.status === 400) {
            return Promise.reject(new ValidationError((err.response.data as APICallError).causes || []));
        } else if (err.response.status === 401) {
            return Promise.reject(new UnauthorizedError((err.response.data as APICallError).causes || []));
        } else if (err.response.status === 403) {
            return Promise.reject(new AccessDeniedError((err.response.data as APICallError).causes || []));
        } else if (err.response.status === 429) {
            return Promise.reject(new RateLimitingError());
        } else if (err.response.status === 500) {
            return Promise.reject(new InternalServerError());
        } else {
            return Promise.reject(new UnknownResponseError());
        }
    }
);

export function callGet<T>(url: string, options?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return axiosInstance.request<T>({
        ...options,
        ...{
            url,
            method: 'GET'
        }
    });
}

export function callPost<T>(url: string, options?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return axiosInstance.request<T>({
        ...options,
        ...{
            url,
            method: 'POST'
        }
    });
}

export function callPut<T>(url: string, options?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return axiosInstance.request<T>({
        ...options,
        ...{
            url,
            method: 'PUT'
        }
    });
}

export function callDelete<T>(url: string, options?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return axiosInstance.request<T>({
        ...options,
        ...{
            url,
            method: 'DELETE'
        }
    });
}
