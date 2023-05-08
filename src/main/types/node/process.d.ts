declare namespace NodeJS {
  type StringNumber = `${number}`;
  type StringBoolean = 'true' | 'false';
  type StringCron = `rate(${string})` | `cron(${string})` | undefined;
  type StringDuration = `${number} ${'second' | 'seconds' | 'minute' | 'minutes' | 'hour' | 'hours' | 'day' | 'days'}`;

  export interface ProcessEnv {
    LOG_GROUP_RETENTION_DAYS: StringNumber;
    LOG_GROUP_MATCH_REGEX?: string;
    LOG_GROUP_RETENTION_CRON?: StringCron;
    LOG_GROUP_DELETE_CRON?: StringCron;
  }
}
