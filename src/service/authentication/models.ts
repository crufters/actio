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
import { File } from "../file/models.js";
import { Geometry } from "geojson";
import { nanoid } from "nanoid";
import { Field } from "../../reflect.field.js";

export function copy(from, to) {
  if (!from || !to) {
    return;
  }
  for (const [key, value] of Object.entries(from)) {
    to[key] = value;
  }
}

export declare type Relation<T> = T;

export class Secret {
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

export const defaultSecret: Secret = {
  adminEmail: "example@example.com",
  adminPassword: "admin",
  adminOrganization: "Admin Org",
  fullName: "The Admin",
};

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
  @Field()
  @PrimaryColumn()
  id?: string;

  @Field()
  @Column({ nullable: true })
  @Index({ unique: true })
  key?: string;

  @Field()
  @ManyToMany(() => User, (user) => user.roles)
  users?: User[];
}

export const roleAdmin = new Role();
roleAdmin.id = "ylKNo1UgrS9f94ED6VGWp";
roleAdmin.key = "admin";

export const roles = [roleAdmin];

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

  @Field()
  @PrimaryColumn()
  id?: string;

  @Field()
  @Column()
  @Index({ unique: true })
  slug?: string;

  @Field()
  @Column({ nullable: true })
  fullName?: string;

  @Field()
  @Column({ nullable: true })
  active?: boolean;

  @Field()
  @Column({ nullable: true })
  // "male", "female", "other"
  gender?: string;

  @Field()
  thumbnail?: File;

  @Field()
  @Column({ nullable: true })
  thumbnailId?: string;

  @Field()
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

  @Field()
  @Column({
    type: "jsonb",
    array: false,
    nullable: true,
  })
  // Ideally should contain the full google places search result,
  // but at least the key 'formatted_address'.
  address?: any; // google.maps.places.PlaceResult;

  @Field()
  @Column({
    type: "jsonb",
    array: false,
    nullable: true,
  })
  meta?: { [key: string]: any };

  @Field()
  @Column({ nullable: true, type: "timestamptz" })
  birthDay?: string;

  @Field()
  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @Field()
  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;

  @Field()
  @Column({ type: "timestamptz", nullable: true })
  lastLogin?: string;

  @Field({ hint: () => Role })
  @ManyToMany(() => Role, (role) => role.users, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  roles?: Role[];

  @Field({ hint: () => Contact })
  @OneToMany(() => Contact, (contact) => contact.user, {
    cascade: ["insert", "update"],
  })
  contacts?: Contact[];

  @Field()
  @Column({ nullable: true })
  ghost?: boolean;

  @Field({ hint: () => Password })
  @OneToMany(() => Password, (password) => password.user)
  passwords?: Password[];

  @Field({ hint: () => Department })
  @ManyToMany(() => Department, (department) => department.users, {
    cascade: ["insert", "update"],
  })
  // departments a user belongs to
  departments?: Department[];

  @Field({ hint: () => Token })
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
  @Field()
  @PrimaryColumn()
  id?: string;

  @Field()
  @ManyToOne(() => User, (user) => user.tokens)
  user?: User;

  @Field()
  @Column()
  userId?: string;

  @Field()
  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  // the token value itself
  @Field()
  @Column()
  token?: string;

  @Field()
  @Column({ nullable: true })
  description?: string;

  @Field()
  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;
}

/** Used for things like email verification, password reset or OTPs */
@Entity()
export class SecretCode {
  @Field()
  @PrimaryColumn()
  id?: string;

  @Field()
  @ManyToOne(() => User, (user) => user.tokens)
  user?: User;

  @Field()
  @Column()
  userId?: string;

  @Field()
  @Column({ nullable: true })
  used?: boolean;

  @Field()
  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @Field()
  @Column({ nullable: true, type: "timestamptz" })
  expires?: string;

  // the code itself
  @Field()
  @Column()
  code?: string;

  @Field()
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

  @Field()
  @PrimaryColumn()
  id?: string;

  @Field()
  @Column()
  @Index({ unique: true })
  slug?: string;

  @Field()
  @Column()
  name?: string;

  /** Main website URL of the organization */
  @Field()
  @Column({ nullable: true })
  website?: string;

  @Field()
  thumbnail?: File;

  @Field()
  @Column({ nullable: true })
  thumbnailId?: string;

  @Field({ hint: () => Department })
  @OneToMany(() => Department, (department) => department.organization, {
    cascade: ["insert", "update"],
  })
  departments?: Department[];

  @Field()
  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @Field()
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

  @Field()
  @PrimaryColumn()
  id?: string;

  @Field()
  @Column()
  slug?: string;

  @Field()
  @Column()
  name?: string;

  @Field()
  @Column()
  balance?: number;

  @Field()
  @ManyToOne(() => Organization, (organization) => organization.departments, {
    cascade: ["insert", "update"],
  })
  organization?: Organization;

  @Field()
  @Column()
  organizationId?: string;

  @Field({ hint: () => User })
  @ManyToMany(() => User, (user) => user.departments, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  users?: User[];

  @Field()
  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @Field()
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

  @Field()
  @PrimaryColumn()
  id?: string;

  /**
   * Examples:
   *
   * https://facebook.com/rapperkid123
   * rapperkid123@gmail.com
   * +44270111222
   */
  @Field()
  @Column()
  url?: string;

  @Field()
  /** Youtube channel or Facebook account name */
  @Column({ nullable: true })
  name?: string;

  @Field()
  @Column({ nullable: true })
  verified?: boolean;

  @Field()
  @ManyToOne(() => Platform, (platform) => platform.contacts)
  platform?: Relation<Platform>;

  @Field()
  @Column()
  platformId?: string;

  @Field()
  @ManyToOne(() => User, (user) => user.contacts)
  user?: User;

  @Field()
  @Column()
  userId?: string;

  @Field()
  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @Field()
  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;
}

/**
 * A platform is a space where a user can have a unique identifier.
 * Phone, email, Facebook etc.
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

  @Field()
  @PrimaryColumn()
  id?: string;

  @Field()
  @Column({ nullable: true })
  @Index({ unique: true })
  slug?: string;

  // Represents either an abstract platform ("email", "phone")
  // or an actual website url ("facebook.com")
  // eg. "facebook.com", "Reddit.com", "email", "phone"
  @Field()
  @Column({ nullable: true })
  @Index({ unique: true })
  name?: string;

  // Is platform still selectable for new missions? (see Mission class)
  // Can users still log in with the platform contact? (see Contact class)
  @Field()
  @Column("boolean", { default: true })
  active?: boolean;

  @Field({ hint: () => Contact })
  @OneToMany(() => Contact, (contact) => contact.platform)
  contacts?: Contact[];

  @Field()
  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @Field()
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
  @Field()
  @PrimaryColumn()
  id?: string;

  @Field()
  @Column()
  userId?: string;

  @Field()
  @ManyToOne(() => User, (user) => user.passwords)
  user?: User;
}

export class VerificationCodeSendRequest {
  @Field()
  token?: string;
}

export class VerificationCodeSendResponse {}

export class VerificationCodeVerifyRequest {
  @Field()
  code?: string;
}

export class VerificationCodeVerifyResponse {}

export class PasswordSendResetRequest {
  @Field()
  contactUrl?: string;
}

export class PasswordSendResetResponse {}

/** Password change by supplying an code got through email/sms etc. */
export class PasswordChangeRequest {
  @Field()
  code?: string;
  @Field()
  newPassword?: string;
}

export class PasswordChangeResponse {
  @Field()
  token: Token;
}

/** Change password by supplying the old password. */
export class PasswordChangeWithOldRequest {
  @Field()
  contactUrl: string;

  @Field()
  oldPassword: string;

  @Field()
  newPassword: string;
}

export class PasswordChangeWithOldResponse {}

export class UserRegisterRequest {
  @Field()
  user?: User;

  @Field()
  password?: string;

  /**
   * Ghost registration means register without contact details.
   * Useful for example when we want to enable people to order
   * without actual full registration.
   */
  @Field()
  ghostRegister?: boolean;
}

export class UserRegisterResponse {
  @Field()
  token: Token;
}

export class TokenReadRequest {
  @Field()
  token: string;
}

export class TokenReadResponse {
  @Field()
  token: Token;
}

export class UserLoginRequest {
  @Field()
  contactUrl: string;

  @Field()
  password: string;
}

export class UserLoginResponse {
  @Field()
  token: Omit<Token, "user">;
}

export class UserListRequest {
  @Field()
  token: string;

  @Field()
  departmentId?: string;
  /** Defaults to created at */

  @Field()
  orderByField?: string;

  @Field()
  asc?: boolean;

  @Field()
  skip?: number;

  @Field()
  limit?: number;
}

export class UserListResponse {
  @Field({ hint: User })
  users: User[];
}

export class UserSaveRequest {
  @Field()
  token: string;

  @Field()
  user: User;
}

export class UserSaveResponse {
  @Field()
  user: User;
}

export class UserSaveAddressRequest {
  @Field()
  token: string;

  @Field()
  user: User;
}

export class UserSaveAddressResponse {
  @Field()
  user: User;
}

export class UserSlugCheckRequest {
  @Field()
  slug: string;
}

export class UserSlugCheckResponse {
  @Field()
  taken: boolean;
}

export class RoleListRequest {}

export class RoleListResponse {
  @Field({ hint: Role })
  roles: Role[];
}

export class DepartmentListRequest {
  @Field()
  token: string;

  // optional code fragment to full text search on
  @Field()
  code?: string;
}

export class DepartmentListResponse {
  @Field({ hint: Department })
  departments: Department[];
}

export class UserUnGhostRequest {
  @Field()
  token: string;

  @Field()
  password: string;

  @Field()
  contact: Contact;
}

export class UserUnGhostResponse {}

export class TokenAdminGetRequest {}

export class TokenAdminGetResponse {
  @Field()
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

export class PlatformListRequest {}

export class PlatformListResponse {
  @Field({ hint: Platform })
  platforms: Platform[];
}

export class OauthInfoRequest {}

export class OauthInfoResponse {
  @Field()
  facebookAppID?: string;
}

export class FacebookLoginRequest {
  @Field()
  accessToken: string;
}

export class FacebookLoginResponse {
  @Field()
  token: Omit<Token, "user">;
}

export class RegisterOrLoginWithProvenIdentityRequest {
  @Field()
  email: string;

  @Field()
  firstName?: string;

  @Field()
  lastName?: string;
}

export class RegisterOrLoginWithProvenIdentityResponse {
  @Field()
  token: Omit<Token, "user">;
}

export class UserCreateOrganizationRequest {
  @Field()
  token: string;

  @Field()
  organization: Organization;
}

export class UserCreateOrganizationResponse {
  @Field()
  organization: Organization;
}
