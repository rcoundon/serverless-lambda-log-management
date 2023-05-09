declare namespace NodeJS {
  type StringNumber = `${number}`;
  type StringBoolean = 'true' | 'false';
  type StringCron = `rate(${string})` | `cron(${string})` | undefined;
  type StringDuration = `${number} ${'second' | 'seconds' | 'minute' | 'minutes' | 'hour' | 'hours' | 'day' | 'days'}`;
  type StringRetention =
    | '1'
    | '3'
    | '5'
    | '7'
    | '14'
    | '30'
    | '60'
    | '90'
    | '120'
    | '150'
    | '180'
    | '365'
    | '400'
    | '545'
    | '731'
    | '1096'
    | '1827'
    | '2192'
    | '2557'
    | '2922'
    | '3288'
    | '3653';

  export interface ProcessEnv {
    LOG_GROUP_RETENTION_DAYS: StringRetention;
    LOG_GROUP_MATCH_REGEX?: string;
    LOG_GROUP_RETENTION_CRON?: StringCron;
    LOG_GROUP_DELETE_CRON?: StringCron;
  }
}
