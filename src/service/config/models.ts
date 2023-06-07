// (like default missions, admin accounts etc.) should come from `contets.ts`
import { Entity, PrimaryColumn, Column } from "typeorm";

export declare type Relation<T> = T;

/** Public site wide config. */
@Entity()
export class Config {
  @PrimaryColumn()
  id?: string;

  @Column({ nullable: true })
  domain?: string;

  @Column({ nullable: true })
  isProduction?: boolean;

  @Column({ nullable: true })
  template?: string;

  @Column({ nullable: true })
  slogan?: string;

  @Column({ type: "jsonb", nullable: true })
  contact?: Relation<ContactConfig>;

  @Column({ type: "jsonb", nullable: true })
  favicon?: Relation<FaviconConfig>;

  @Column({ type: "jsonb", nullable: true })
  og?: Relation<OgConfig>;

  @Column({ type: "jsonb", nullable: true })
  /** Any unstructured data comes here */
  data?: { [key: string]: any };
}

export class FaviconConfig {
  url16?: string;
  url32?: string;
  url48?: string;
}

export class OgConfig {
  title?: string;
  description?: string;
  siteName?: string;
  type?: string;
  image?: string;
}

export class ContactConfig {
  /** Used for display on website and for emails sent from site. */
  email?: string;
  phone?: string;
}

/**
 * Sercret. Can only be saved through HTTP but not read.
 * It is only read by other services.
 */
@Entity()
export class Secret {
  @PrimaryColumn()
  id?: string;

  @Column({ type: "jsonb", nullable: true })
  /** Any unstructured data comes here */
  data?: { [key: string]: any };
}

export interface ConfigReadRequest {}

export interface ConfigReadResponse {
  config: Config;
}

export interface ConfigSaveRequest {
  token: string;
  config: Config;
}

export interface ConfigSaveResponse {
  config: Config;
}

// No token here as this is not exposed.
export interface SecretReadRequest {}

export interface SecretReadResponse {
  secret: Secret;
}

export interface SecretSaveRequest {
  token: string;
  secret: Secret;
}

export interface SecretSaveResponse {
  secret: Secret;
}
