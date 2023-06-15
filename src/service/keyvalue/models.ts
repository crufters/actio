import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { copy } from "../file/models.js";
import { nanoid } from "nanoid";

@Entity()
export class Value {
  constructor(json?: any) {
    if (!json) return;
    copy(json, this);
    if (!this.id) {
      this.id = nanoid();
    }
  }

  @PrimaryColumn()
  id?: string;

  @Column({
    type: "jsonb",
    array: false,
    nullable: true,
  })
  value?: { [key: string]: any };

  /**
   * eg. "home", "apps", "notification"
   */
  @Column({ nullable: true })
  namespace?: string;

  @Column({ nullable: true })
  key?: string;

  /**
   * Should this be readable by users who are not part
   * of the department?
   */
  @Column({ nullable: true })
  public?: boolean;

  /**
   * Should this be writable by users who are not part
   * of the department?
   */
  @Column({ nullable: true })
  publicWrite?: boolean;

  /**
   * Should this be writable only by the user who created it
   * or by anyone in the department?
   */
  @Column({ nullable: true })
  ownedByUser?: boolean;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  departmentId?: string;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;
}

export class GetRequest {
  token?: string;
  namespace?: string;
  key?: string;
}

export class GetResponse {
  value?: Value;
}

export class SetRequest {
  token?: string;
  value?: Value;
}

export class SetResponse {
  value?: Value;
}
