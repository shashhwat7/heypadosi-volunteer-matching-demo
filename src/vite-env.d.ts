/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_API_GATEWAY_ENDPOINT?: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
