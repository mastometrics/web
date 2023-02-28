interface ImportMetaEnv {
  readonly SESSION_SECRET: string;
  readonly LOGSNAG_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
