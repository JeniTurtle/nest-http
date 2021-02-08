import { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  Inject,
  Injectable,
  HttpService,
  LoggerService,
  Logger,
} from '@nestjs/common';
import { HttpRequestApiException } from './http.exception';
import { HttpHepler } from './http.helper';
import { HTTP_OPTION } from './http.constants';
import {
  RequestConfig,
  ParameterStyle,
  ResponseSchema,
} from './http.interface';

@Injectable()
export class HttpFetchService {
  private logger: Logger | LoggerService;

  constructor(
    @Inject(HttpService) private httpService: HttpService,
    @Inject(HTTP_OPTION) private httpOption: RequestConfig,
  ) {
    const { logger, requestInterceptors = [], responseInterceptors = [] } = this.httpOption;
    this.logger = logger || new Logger(HttpFetchService.name);
    requestInterceptors.forEach(
      ({ onFulfilled, onRejected }) => {
        this.httpService.axiosRef.interceptors.request.use(
          onFulfilled,
          onRejected,
        );
      },
    );
    this.httpService.axiosRef.interceptors.response.use(
      response => response,
      error => {
        const { response = {}, config = {} } = error;
        this.logger.error(
          `Api request failed -> status: ${response.status}; url: ${
            config.url
          }; params: ${JSON.stringify(
            config.params || {},
          )}; body: ${JSON.stringify(
            config.data || {},
          )}; response: ${JSON.stringify(response.data)}`,
        );
        throw error;
      },
    );
    responseInterceptors.forEach(
      ({ onFulfilled, onRejected }) => {
        this.httpService.axiosRef.interceptors.response.use(
          onFulfilled,
          onRejected,
        );
      },
    );
  }

  private async request<T = any>(url: string, config: AxiosRequestConfig = {}) {
    config = config || {};
    const protocol = this.httpOption.protocol || 'http';
    if (url.indexOf(protocol) !== 0) {
      url = `${protocol}://${url}`;
    }
    switch (this.httpOption.parameterStyle) {
      case ParameterStyle.CAMEL_TO_SNAKE:
        if (config.data) {
          config.data = HttpHepler.humpToSnake<T>(config.data);
        }
        if (config.params) {
          config.params = HttpHepler.humpToSnake<T>(config.params);
        }
        break;
      case ParameterStyle.SNAKE_TO_CAMEL:
        if (config.data) {
          config.data = HttpHepler.snakeToHump<T>(config.data);
        }
        if (config.params) {
          config.params = HttpHepler.snakeToHump<T>(config.params);
        }
        break;
      default:
        break;
    }
    let response: ResponseSchema<T>, resp: AxiosResponse<T>;
    const stringParams = JSON.stringify(config.params || {});
    const stringBody = JSON.stringify(config.data || {});
    const start: number = new Date().getTime();
    try {
      resp = await this.httpService.axiosRef.request<T>({
        ...this.httpOption,
        ...config,
        url,
      });
      url = resp.config.url;
      this.logger.log(
        `Api request -> (${new Date().getTime() -
          start}ms) url: ${url}; params: ${stringParams}; body: ${stringBody}`,
      );
      const data = resp.data as any;
      let content = data.data;
      if (this.httpOption.parameterStyle === ParameterStyle.CAMEL_TO_SNAKE) {
        content = HttpHepler.snakeToHump<T>(data.data || {});
      } else if (
        this.httpOption.parameterStyle === ParameterStyle.SNAKE_TO_CAMEL
      ) {
        content = HttpHepler.humpToSnake<T>(data.data || {});
      }
      response = {
        code: data.code || 0,
        msg: data.msg || '',
        data: content,
        status: resp.status,
      } as ResponseSchema<T>;
    } catch (err) {
      this.logger.error(err.message);
      if (!err.response.data) {
        err.response.data = {}
      }
      if (!err.response.data.code && !err.response.data.data) {
        throw new HttpRequestApiException({
          msg: err.message,
        });
      }
      response = {
        code: err.response.data.code || 0,
        msg: err.response.data.msg || err.message,
        data: err.response.data.data,
        status: resp.status,
      } as ResponseSchema<T>;
    }
    return response;
  }

  async post<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>(url, {
      ...config,
      method: 'post',
    });
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>(url, {
      ...config,
      method: 'get',
    });
  }

  async put<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>(url, {
      ...config,
      method: 'put',
    });
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>(url, {
      ...config,
      method: 'delete',
    });
  }

  async patch<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>(url, {
      ...config,
      method: 'patch',
    });
  }

  async head<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>(url, {
      ...config,
      method: 'head',
    });
  }
}
