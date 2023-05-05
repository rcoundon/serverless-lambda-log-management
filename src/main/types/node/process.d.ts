declare namespace NodeJS {
  type StringNumber = `${number}`;
  type StringBoolean = 'true' | 'false';
  type StringCron = `rate(${string})` | `cron(${string})` | undefined;
  type StringDuration = `${number} ${'second' | 'seconds' | 'minute' | 'minutes' | 'hour' | 'hours' | 'day' | 'days'}`;

  export interface ProcessEnv {
    RETENTION_DAYS: StringNumber;
  }
}
