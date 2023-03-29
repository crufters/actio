
import { Column, Entity, PrimaryColumn } from "typeorm";
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
  url?: string;

  @Column()
  originalName?: string;

  @Column()
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
