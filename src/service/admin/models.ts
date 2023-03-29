
import { Entity, PrimaryColumn } from "typeorm";

@Entity()
// A recurrence is a rule to make something recurring every X interval
export class Recurrence {
  @PrimaryColumn()
  id?: string;

  // cron expression
  // eg. "45 23 * * 6" 23:45 means (11:45 PM) every Saturday
  cron?: string;
}

export interface TeardownRequest {
  token: string;
  passphrase: string;
}

export interface TeardownResponse {}
