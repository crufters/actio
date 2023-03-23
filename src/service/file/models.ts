/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */
import { Column, Entity, PrimaryColumn } from "typeorm";
import { Model, Field } from "../../framework/form/field";
import { nanoid } from "nanoid";

export function copy(from, to) {
  if (!from || !to) {
    return;
  }
  for (const [key, value] of Object.entries(from)) {
    to[key] = value;
  }
}
@Entity()
@Model({ class: "File" })
export class File {
  constructor(json?: any) {
    copy(json, this);
    if (!this.id) {
      this.id = nanoid();
    }
  }
  @PrimaryColumn()
  id?: string;

  @Column()
  @Field({ class: "File" })
  url?: string;

  @Column()
  @Field({ class: "File" })
  originalName?: string;

  @Column()
  @Field({ class: "File" })
  size?: number;

  //@CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  //createdAt?: string;
  //
  //@UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  //updatedAt?: string;
}

export interface FileUploadResponse {
  files: File[];
}
