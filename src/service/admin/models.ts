/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */
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
