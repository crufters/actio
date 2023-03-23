import { Service, Unexposed } from "../../sys";
import { Servicelike } from "../../sys";
import { DataSource } from "typeorm";

import departmentList from "./department/departmentList";
import verificationCodeSend from "./user/verificationCodeSend";
import verificationCodeVerify from "./user/verificationCodeVerify";
import passwordSendReset from "./user/passwordSendReset";
import passwordChange from "./user/passwordChange";
import passwordChangeWithOld from "./user/passwordChangeWithOld";
import userSlugCheck from "./user/userSlugCheck";
import platformList from "./platform/platformList";
import tokenRead from "./token/tokenRead";
import userLogin from "./user/userLogin";
import userList from "./user/userList";
import userSave from "./user/userSave";
import userRegister from "./user/userRegister";
import userBrandRegister from "./user/userBrandRegister";
import userDepartmentRegister from "./user/userDepartmentRegister";
import userUnGhost from "./user/userUnGhost";
import roleList from "./role/roleList";
import tokenAdminGet from "./user/tokenAdminGet";
import oauthInfo from "./oauth/oauthInfo";
import facebookLogin from "./oauth/facebookLogin";
import registerOrLoginWithProvenIdentity from "./oauth/registerOrLoginWithProvenIdentity";
import { Geometry } from "geojson";

import {
  Role,
  User,
  Platform,
  Contact,
  Token,
  Organization,
  Department,
  Password,
  SecretCode,
  Language,
  DepartmentListRequest,
  VerificationCodeSendRequest,
  VerificationCodeVerifyRequest,
  PasswordSendResetRequest,
  PasswordChangeRequest,
  PasswordChangeWithOldRequest,
  UserSlugCheckRequest,
  PlatformListRequest,
  TokenReadRequest,
  UserLoginRequest,
  UserListRequest,
  UserSaveRequest,
  UserRegisterRequest,
  UserBrandRegisterRequest,
  UserDepartmentRegisterRequest,
  RoleListRequest,
  roles,
  languages,
  platforms,
  UserUnGhostRequest,
  TokenAdminGetRequest,
  Config,
  OauthInfoRequest,
  FacebookLoginRequest,
  RegisterOrLoginWithProvenIdentityRequest,
} from "./models";
import { ConfigService } from "../config";

function toGeometry(lat: number, lng: number): Geometry {
  return {
    type: "Point",
    coordinates: [lat, lng],
  };
}

@Service()
export class AuthenticationService implements Servicelike {
  meta = {
    name: "authentication",
    typeorm: {
      entities: [
        Role,
        User,
        Platform,
        Contact,
        Token,
        Organization,
        Department,
        Password,
        SecretCode,
        Language,
      ],
    },
  };

  private connection: DataSource;
  private config: ConfigService;
  private facebookAppID: string;
  private facebookAppSecret: string;
  private facebookAppRedirectURL: string;

  defaultConfig: Config = {
    adminEmail: "example@example.com",
    adminPassword: "admin",
    adminOrganization: "Admin Org",
    fullName: "The Admin",
  };

  constructor(connection?: DataSource, config?: ConfigService) {
    this.connection = connection;
    this.config = config;
  }

  async _onInit(): Promise<void> {
    await Promise.all(
      platforms.map(async (p) => {
        return await this.connection.getRepository(Platform).save(p);
      })
    );
    await Promise.all(
      roles.map(async (r) => {
        return await this.connection.getRepository(Role).save(r);
      })
    );
    await Promise.all(
      languages.map(async (p) => {
        return await this.connection.getRepository(Language).save(p);
      })
    );

    let cf = await this.config.configRead({});
    let config: Config = cf.config.data?.AuthenticationService;
    let adminEmail = config?.adminEmail;
    let adminPassword = config?.adminPassword;
    let adminOrganization = config?.adminOrganization;
    let fullName = config?.fullName;

    // facebook related config
    if (config?.facebookAppID) {
      this.facebookAppID = config.facebookAppID;
    } else {
      this.facebookAppID = process.env["AUTHENTICATION_FACEBOOK_APP_ID"];
    }
    if (config?.facebookAppSecret) {
      this.facebookAppSecret = config.facebookAppSecret;
    } else {
      this.facebookAppSecret =
        process.env["AUTHENTICATION_FACEBOOK_APP_SECRET"];
    }
    if (config?.facebookAppRedirectURL) {
      this.facebookAppRedirectURL = config.facebookAppRedirectURL;
    } else {
      this.facebookAppRedirectURL =
        process.env["AUTHENTICATION_FACEBOOK_APP_REDIRECT_URL"];
    }

    if (!adminEmail) {
      adminEmail = this.defaultConfig.adminEmail;
    }
    if (!adminPassword) {
      adminPassword = this.defaultConfig.adminPassword;
    }
    if (!adminOrganization) {
      adminOrganization = this.defaultConfig.adminOrganization;
    }
    if (!fullName) {
      fullName = this.defaultConfig.fullName;
    }

    console.log("Registering admin");
    let ubreq: UserBrandRegisterRequest = {
      user: {
        fullName: fullName,
        location: toGeometry(47.5316, 21.6273),
        contacts: [
          {
            url: adminEmail,
          },
        ],
      },
      password: adminPassword,
      organization: {
        name: adminOrganization,
      },
    };

    await this.userBrandRegister(ubreq);
    return;
  }

  departmentList(req: DepartmentListRequest) {
    return departmentList(this.connection, req);
  }

  verificationCodeSend(req: VerificationCodeSendRequest) {
    return verificationCodeSend(this.connection, this.config, req);
  }

  verificationCodeVerify(req: VerificationCodeVerifyRequest) {
    return verificationCodeVerify(this.connection, req);
  }

  passwordSendReset(req: PasswordSendResetRequest) {
    return passwordSendReset(this.connection, req);
  }

  passwordChange(req: PasswordChangeRequest) {
    return passwordChange(this.connection, req);
  }

  passwordChangeWithOld(req: PasswordChangeWithOldRequest) {
    return passwordChangeWithOld(this.connection, req);
  }

  userSlugCheck(req: UserSlugCheckRequest) {
    return userSlugCheck(this.connection, req);
  }

  platformListRequest(req: PlatformListRequest) {
    return platformList(this.connection, req);
  }

  /** Read token */
  tokenRead(req: TokenReadRequest) {
    return tokenRead(this.connection, req);
  }

  /**
   * Returns the token but not the user object.
   * For that use 'tokenRead'
   */
  userLogin(req: UserLoginRequest) {
    return userLogin(this.connection, req);
  }

  userList(req: UserListRequest) {
    return userList(this.connection, req);
  }

  userSave(req: UserSaveRequest) {
    return userSave(this.connection, req);
  }

  /**
   * Returns the token but not the user object.
   * For that use 'tokenRead'
   */
  userRegister(req: UserRegisterRequest) {
    return userRegister(this.connection, this.config, req);
  }

  /**
   * Returns the token but not the user object.
   * For that use 'tokenRead'
   */
  userBrandRegister(req: UserBrandRegisterRequest) {
    return userBrandRegister(
      this.connection,
      this.config,
      req,
      this.defaultConfig
    );
  }

  userDepartmentRegister(req: UserDepartmentRegisterRequest) {
    return userDepartmentRegister(this.connection, req);
  }

  roleList(req: RoleListRequest) {
    return roleList(this.connection, req);
  }

  /**
   * Unghost a user that was registered with 'userRegister' and
   * and the ghostRegister: true flag.
   * Ghost users are anonymous users that are registered without
   * providing either email or password. They are used for example
   * for ordering a product without registration.
   *
   * userUnGhost upgrades such registrations so they will have an email
   * and password to log in again in case their cookies get deleted.
   * (Ghost registrations are lost once the session token id cookie is deleted).
   *
   * Flow:
   * 1. User registers with userRegister with ghostRegister: true
   * 2. User gets a token
   * 3. Update the user with any properties eg. userSave({token: t, user: {fullName: "John Doe", contacts: [{url: "user@user.com"}]})
   * 4. Optionally update with more user data (can call userSave many times)
   * 5. Call userUnGhost({token: t, password: "password"})
   */
  userUnGhost(req: UserUnGhostRequest) {
    return userUnGhost(this.connection, req);
  }

  /**
   * Returns an admin token for seeding or any other service to service
   * communication purposes.
   *
   * This method should be unexposed and only used for seeding.
   * Very dangerous if we expose this.
   */
  @Unexposed()
  tokenAdminGet(req: TokenAdminGetRequest) {
    return tokenAdminGet(this.connection, req);
  }

  oauthInfo(req: OauthInfoRequest) {
    return oauthInfo(this.connection, req, this.facebookAppID);
  }

  facebookLogin(req: FacebookLoginRequest) {
    return facebookLogin(
      this.connection,
      req,
      this.facebookAppID,
      this.facebookAppSecret,
      this.facebookAppRedirectURL
    );
  }

  /** Only here for testing purposes.
   * Make sure this is an unexposed method as it enables anyone to produce a token
   * for an existing user.
   *
   * After an oauth login, once we know the email and other info about
   * the user, this method can be used to log in or register the user.
   * Flow goes like this:
   *  - User logs in with oauth
   *  - With oauth access token we read ther users info
   *  - Use this method to log them in or register them
   */
  @Unexposed()
  registerOrLoginWithProvenIdentity(
    req: RegisterOrLoginWithProvenIdentityRequest
  ) {
    return registerOrLoginWithProvenIdentity(this.connection, req);
  }
}
