import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import queryString from 'query-string';

export interface ParsedQuery {
  [key: string]: string;
}

export function parseQueryString(qs: string): ParsedQuery {
  const parsingResult = queryString.parse(qs);
  const ret = Object.create(null);

  Object.keys(parsingResult).forEach(k => {
    const v = parsingResult[k];
    if (!v) {
      ret[k] = "";
      return;
    }

    if (Array.isArray(v)) {
      ret[k] = v[0];
      return;
    }

    ret[k] = v;
  });
    
  return ret;
}

export function usePrevious<Type>(value: Type): MutableRefObject<Type | undefined>['current'] {
  const ref = useRef<Type>();

  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}
