import * as _ from 'lodash';

export class HttpHepler {
  static snakeToHump<T = any>(target: T, depth = 10) {
    const temp = _.cloneDeep(target);
    return HttpHepler._snakeToHump<T>(temp, depth);
  }

  private static _snakeToHump<T = any>(target: T, depth = 10) {
    if (--depth < 0) {
      return;
    }
    if (_.isArray(target)) {
      // @ts-ignore
      target.forEach(item => HttpHepler._snakeToHump(item));
    } else {
      for (const key in target) {
        const newKey = _.camelCase(key);
        if (key !== newKey) {
          target[newKey] = target[key];
          delete target[key];
        }
        if (typeof target[newKey] === 'object') {
          HttpHepler._snakeToHump(target[newKey], depth);
        }
      }
    }
    return target;
  }

  static humpToSnake<T = any>(target: T, depth = 10) {
    const temp = _.cloneDeep(target);
    return HttpHepler._humpToSnake<T>(temp, depth);
  }

  private static _humpToSnake<T = any>(target: T, depth = 10) {
    if (--depth < 0) {
      return;
    }
    if (_.isArray(target)) {
      // @ts-ignore
      target.forEach(item => HttpHepler._humpToSnake(item));
    } else {
      for (const key in target) {
        const newKey = _.snakeCase(key);
        if (key !== newKey) {
          target[newKey] = target[key];
          delete target[key];
        }
        if (typeof target[newKey] === 'object') {
          HttpHepler._humpToSnake(target[newKey], depth);
        }
      }
    }
    return target;
  }
}
