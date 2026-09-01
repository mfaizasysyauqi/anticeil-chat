declare module '@univerjs/*/lib/locale/*.js' {
  const locale: Record<string, any>;
  export default locale;
}

declare module '@univerjs/*/facade' {
  const value: any;
  export = value;
}
