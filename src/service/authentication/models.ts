/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import {
  Entity,
  JoinTable,
  OneToMany,
  ManyToMany,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from "typeorm";
import { File } from "../file/models";
import { Geometry } from "geojson";
import { nanoid } from "nanoid";

export function copy(from, to) {
  if (!from || !to) {
    return;
  }
  for (const [key, value] of Object.entries(from)) {
    to[key] = value;
  }
}

export declare type Relation<T> = T;
declare var google: any;

export interface Config {
  /** Admin user fullname */
  fullName?: string;
  /** Admin user email */
  adminEmail?: string;
  /** Admin user password */
  adminPassword?: string;
  /** Admin user organization name */
  adminOrganization?: string;

  sendgrid?: {
    key?: string;
  };
  email?: {
    from?: string;
    register?: {
      /**
       * Subject of
       */
      subject?: string;
      text?: string;
    };
  };

  // https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow#login
  facebookAppID?: string;
  facebookAppSecret?: string;
  facebookAppRedirectURL?: string;
}

// User roles
@Entity()
export class Role {
  constructor(json?: Partial<Role>) {
    if (!json) {
      return;
    }
    copy(json, this);
    if (!this.id) {
      this.id = nanoid();
    }
    this.users = json?.users?.map((u: any) => {
      return new User(u);
    });
  }

  // eg. "user", "business", "admin"
  @PrimaryColumn()
  id?: string;

  @Column({ nullable: true })
  @Index({ unique: true })
  slug?: string;

  @Column({ nullable: true })
  name?: string;

  @ManyToMany(() => User, (user) => user.roles)
  users?: User[];
}

export const roleUser = new Role();
roleUser.id = "AUszZarrfepp3rUnRcKju";
roleUser.slug = "user";
roleUser.name = "User";

export const roleBusiness = new Role();
roleBusiness.id = "rebHRXRbW5RLMRiua4LGk";
roleBusiness.slug = "business";
roleBusiness.name = "Business";

export const roleAdmin = new Role();
roleAdmin.id = "ylKNo1UgrS9f94ED6VGWp";
roleAdmin.slug = "admin";
roleAdmin.name = "Admin";

export const roles = [roleUser, roleBusiness, roleAdmin];

@Entity()
export class User {
  constructor(json?: Partial<User>) {
    if (!json) {
      return;
    }
    copy(json, this);
    if (!this.id) {
      this.id = nanoid();
    }
    this.thumbnail = new File(json?.thumbnail);
    this.roles = json?.roles?.map((r: any) => {
      return new Role(r);
    });
    this.contacts = json?.contacts?.map((c: any) => {
      return new Contact(c);
    });
    this.departments = json?.departments?.map((d: any) => {
      return new Department(d);
    });
    this.contacts = json?.contacts?.map((c: any) => {
      return new Contact(c);
    });
  }

  @PrimaryColumn()
  id?: string;

  @Column()
  @Index({ unique: true })
  slug?: string;

  @Column({ nullable: true })
  fullName?: string;

  @Column({ nullable: true })
  active?: boolean;

  @Column({ nullable: true })
  // "male", "female", "other"
  gender?: string;

  thumbnail?: File;

  @Column({ nullable: true })
  thumbnailId?: string;

  @Column({
    type: "geography",
    spatialFeatureType: "Point",
    // https://gis.stackexchange.com/questions/131363/choosing-srid-and-what-is-its-meaning
    srid: 4326,
    nullable: true,
  })
  @Index({ spatial: true })
  // Is one location enough?
  location?: Geometry;

  @Column({
    type: "jsonb",
    array: false,
    nullable: true,
  })
  // Ideally should contain the full google places search result,
  // but at least the key 'formatted_address'.
  address?: google.maps.places.PlaceResult;

  @Column({
    type: "jsonb",
    array: false,
    nullable: true,
  })
  meta?: { [key: string]: any };

  @Column({ nullable: true, type: "timestamptz" })
  birthDay?: string;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;

  @Column({ type: "timestamptz", nullable: true })
  lastLogin?: string;

  @ManyToMany(() => Role, (role) => role.users, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  roles?: Role[];

  @OneToMany(() => Contact, (contact) => contact.user, {
    cascade: ["insert", "update"],
  })
  contacts?: Contact[];

  @Column({ nullable: true })
  ghost?: boolean;

  @OneToMany(() => Password, (password) => password.user)
  passwords?: Password[];

  @ManyToMany(() => Department, (department) => department.users, {
    cascade: ["insert", "update"],
  })
  // departments a user belongs to
  departments?: Department[];

  @OneToMany(() => Token, (token) => token.user)
  tokens?: Token[];

  //@OneToMany(() => Comment, (comment) => comment.user)
  //comments?: Comment[];
}

@Entity()
// token/token
// Our system is relatively "special" in that way
// even API keys are passwords, ie. go through a hashing mechanism.
// See https://stackoverflow.com/questions/43173877/should-api-secrets-be-hashed
// tokens can be used to acquire new tokens
export class Token {
  constructor(json?: Partial<Token>) {
    if (!json) {
      return;
    }
    copy(json, this);
    if (!this.id) {
      this.id = nanoid();
    }
  }

  // id to help CRUD ops on the token
  @PrimaryColumn()
  id?: string;

  @ManyToOne(() => User, (user) => user.tokens)
  user?: User;

  @Column()
  userId?: string;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  // the token value itself
  @Column()
  token?: string;

  @Column({ nullable: true })
  description?: string;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;
}

/** Used for things like email verification, password reset or OTPs */
@Entity()
export class SecretCode {
  @PrimaryColumn()
  id?: string;

  @ManyToOne(() => User, (user) => user.tokens)
  user?: User;

  @Column()
  userId?: string;

  @Column({ nullable: true })
  used?: boolean;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @Column({ nullable: true, type: "timestamptz" })
  expires?: string;

  // the code itself
  @Column()
  code?: string;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;
}

@Entity()
export class Organization {
  constructor(json?: Partial<Organization>) {
    if (!json) {
      return;
    }
    copy(json, this);
    if (!this.id) {
      this.id = nanoid();
    }
    this.thumbnail = new File(json?.thumbnail);
    this.departments = json?.departments?.map((d) => new Department(d));
  }

  @PrimaryColumn()
  id?: string;

  @Column()
  @Index({ unique: true })
  slug?: string;

  @Column()
  name?: string;

  /** Main website URL of the organization */
  @Column({ nullable: true })
  website?: string;

  thumbnail?: File;

  @Column({ nullable: true })
  thumbnailId?: string;

  @OneToMany(() => Department, (department) => department.organization, {
    cascade: ["insert", "update"],
  })
  departments?: Department[];

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;
}

@Entity()
@Unique("organization_department_slug", ["slug", "organizationId"])
export class Department {
  constructor(json?: Department) {
    if (!json) {
      return;
    }
    copy(json, this);
    if (!this.id) {
      this.id = nanoid();
    }
    this.organization = new Organization(json?.organization);
    this.users = json?.users?.map((user) => new User(user));
  }
  @PrimaryColumn()
  id?: string;

  @Column()
  slug?: string;

  @Column()
  name?: string;

  @Column()
  balance?: number;

  @ManyToOne(() => Organization, (organization) => organization.departments, {
    cascade: ["insert", "update"],
  })
  organization?: Organization;

  @Column()
  organizationId?: string;

  @ManyToMany(() => User, (user) => user.departments, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  users?: User[];

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;
}

// A contact
@Entity()
@Unique("user_contact", ["url", "userId"])
export class Contact {
  constructor(json?: Partial<Contact>) {
    if (!json) {
      return;
    }
    copy(json, this);
    if (!this.id) {
      this.id = nanoid();
    }
    this.platform = new Platform(json?.platform);
    this.user = new User(json?.user);
  }

  @PrimaryColumn()
  id?: string;

  /**
   * Examples:
   *
   * https://facebook.com/rapperkid123
   * rapperkid123@gmail.com
   * +44270111222
   */
  @Column()
  url?: string;

  /** Youtube channel or Facebook account name */
  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  verified?: boolean;

  @ManyToOne(() => Platform, (platform) => platform.contacts)
  platform?: Relation<Platform>;

  @Column()
  platformId?: string;

  @ManyToOne(() => User, (user) => user.contacts)
  user?: User;

  @Column()
  userId?: string;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;
}

/** A platform is a space where a user can do advertising/spread the word.
 * Phone, email, Facebook etc. It is also used for proving
 */
@Entity()
export class Platform {
  constructor(json?: Partial<Platform>) {
    if (!json) {
      return;
    }
    copy(json, this);
    if (!this.id) {
      this.id = nanoid();
    }
    this.contacts = json?.contacts?.map((c: any) => new Contact(c));
  }

  @PrimaryColumn()
  id?: string;

  @Column({ nullable: true })
  @Index({ unique: true })
  slug?: string;

  // Represents either an abstract platform ("email", "phone")
  // or an actual website url ("facebook.com")
  // eg. "facebook.com", "Reddit.com", "email", "phone"
  @Column({ nullable: true })
  @Index({ unique: true })
  name?: string;

  // Is platform still selectable for new missions? (see Mission class)
  // Can users still log in with the platform contact? (see Contact class)
  @Column("boolean", { default: true })
  active?: boolean;

  @OneToMany(() => Contact, (contact) => contact.platform)
  contacts?: Contact[];

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;
}

export const platformEmail = new Platform();
platformEmail.id = "h4HZYn7FPpbdgVHBk1byc";
platformEmail.slug = "email";
platformEmail.name = "Email";

export const platformFacebook = new Platform();
platformFacebook.id = "wy_upG9BnzHvRg2WcSNgC";
platformFacebook.slug = "facebook";
platformFacebook.name = "Facebook";

export const platformTwitter = new Platform();
platformTwitter.id = "KONTiDgz3F1Z67z_DKMWw";
platformTwitter.slug = "twitter";
platformTwitter.name = "Twitter";

export const platformReddit = new Platform();
platformReddit.id = "cGRHunKxGaf1Tqc7tH10A";
platformReddit.slug = "reddit";
platformReddit.name = "Reddit";

export const platforms = [
  platformEmail,
  platformFacebook,
  platformReddit,
  platformTwitter,
];

// Passwords can be used to acquire tokens.
@Entity()
export class Password {
  constructor(json?: Partial<Password>) {
    if (!json) {
      return;
    }
    copy(json, this);
    if (!this.id) {
      this.id = nanoid();
    }
    this.user = new User(json?.user);
  }

  // password hash itsef
  @PrimaryColumn()
  id?: string;

  @Column()
  userId?: string;

  @ManyToOne(() => User, (user) => user.passwords)
  user?: User;
}

export interface VerificationCodeSendRequest {
  token?: string;
}

export interface VerificationCodeSendResponse {}

export interface VerificationCodeVerifyRequest {
  code?: string;
}

export interface VerificationCodeVerifyResponse {}

export interface PasswordSendResetRequest {
  contactUrl?: string;
}

export interface PasswordSendResetResponse {}

/** Password change by supplying an code got through email/sms etc. */
export interface PasswordChangeRequest {
  code?: string;
  newPassword?: string;
}

export interface PasswordChangeResponse {
  token: Token;
}

/** Change password by supplying the old password. */
export interface PasswordChangeWithOldRequest {
  contactUrl: string;
  oldPassword: string;
  newPassword: string;
}

export interface PasswordChangeWithOldResponse {}

export interface UserRegisterRequest {
  user?: User;
  password?: string;
  /**
   * Ghost registration means register without contact details.
   * Useful for example when we want to enable people to order
   * without actual full registration.
   */
  ghostRegister?: boolean;
}

export interface UserRegisterResponse {
  token: Token;
}

export interface UserBrandRegisterRequest {
  user: User;
  password: string;
  organization: Organization;
}

export interface UserBrandRegisterResponse {
  token: Token;
}

export interface UserDepartmentRegisterRequest {
  user: User;
  password: string;
  departmentId: string;
}

export interface UserDepartmentRegisterResponse {}

export interface TokenReadRequest {
  token: string;
}

export interface TokenReadResponse {
  token: Token;
}

export interface UserLoginRequest {
  contactUrl: string;
  password: string;
}

export interface UserLoginResponse {
  token: Omit<Token, "user">;
}

export interface UserListRequest {
  token: string;
  departmentId?: string;
  /** Defaults to created at */
  orderByField?: string;
  asc?: boolean;
  skip?: number;
  limit?: number;
}

export interface UserListResponse {
  users: User[];
}

export interface UserSaveRequest {
  token: string;
  user: User;
}

export interface UserSaveResponse {
  user: User;
}

export interface UserSaveAddressRequest {
  token: string;
  user: User;
}

export interface UserSaveAddressResponse {
  user: User;
}

export interface UserSlugCheckRequest {
  slug: string;
}

export interface UserSlugCheckResponse {
  taken: boolean;
}

export interface RoleListRequest {}

export interface RoleListResponse {
  roles: Role[];
}

export interface DepartmentListRequest {
  token: string;
  // optional code fragment to full text search on
  code?: string;
}

export interface DepartmentListResponse {
  departments: Department[];
}

export interface UserUnGhostRequest {
  token: string;
  password: string;
  contact: Contact;
}

export interface UserUnGhostResponse {}

export interface TokenAdminGetRequest {}

export interface TokenAdminGetResponse {
  token: Token;
}

@Entity()
// Language/Dialect supported
export class Language {
  @PrimaryColumn()
  id?: string;

  @Column()
  // eg "hu", "en" etc
  code?: string;

  @Column()
  name?: string;
}

export const languageHu = new Language();
languageHu.id = "Gn5KSnUiBzsDBGEBFRRR9";
languageHu.code = "hu";
languageHu.name = "Hungarian";

export const languageEn = new Language();
languageEn.id = "xVmn_nOTAtr6r50iRXf8Y";
languageEn.code = "en";
languageEn.name = "English";

export const languages = [languageHu, languageEn];

export interface PlatformListRequest {}

export interface PlatformListResponse {
  platforms: Platform[];
}

export interface OauthInfoRequest {}

export interface OauthInfoResponse {
  facebookAppID?: string;
}

export interface FacebookLoginRequest {
  accessToken: string;
}

export interface FacebookLoginResponse {
  token: Omit<Token, "user">;
}

export interface RegisterOrLoginWithProvenIdentityRequest {
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface RegisterOrLoginWithProvenIdentityResponse {
  token: Omit<Token, "user">;
}
