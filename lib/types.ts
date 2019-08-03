import { IncomingMessage, ServerResponse } from 'http';
import config from './config';

export type Directives = {
  [D in keyof typeof config.directives]?:
  | (string | ((req: IncomingMessage, res: ServerResponse) => string))[]
  | ((req: IncomingMessage, res: ServerResponse) => string)
  | string
  | boolean
}

export type ParsedDirectives = {
  [D in keyof typeof config.directives]?: string[] | string | boolean
}

export interface CSPOptions {
  browserSniff?: boolean;
  directives?: Directives;
  disableAndroid?: boolean;
  loose?: boolean;
  reportOnly?: boolean | ((req: IncomingMessage, res: ServerResponse) => boolean);
  setAllHeaders?: boolean;
}
