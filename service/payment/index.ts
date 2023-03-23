import { Service } from "../../sys";
import { Servicelike } from "../../sys";
import { DataSource } from "typeorm";

import {
  Config,
  Secret,
  TopupRequest,
  PublicKeyRequest,
  BalanceRequest,
  ChargesRequest,
  Charge,
  Gateway,
  gateways,
  Account,
  accounts,
  Transaction,
  TransactionEntry,
  PayWithBalanceRequest,
  SystemBalanceRequest,
} from "./models";
import { ConfigService } from "../config";
import topup from "./topup";
import balance from "./balance";
import payments from "./charges";
import payWithBalance from "./payWithBalance";
import systemBalance from "./systemBalance";
import { AuthenticationService } from "../authentication";

@Service()
export class PaymentService implements Servicelike {
  meta = {
    name: "payment",
    typeorm: {
      entities: [Charge, Gateway, Account, Transaction, TransactionEntry],
    },
  };

  private connection: DataSource;
  private config: ConfigService;
  private auth: AuthenticationService;
  private stripeApiKey: string;
  private stripePublicKey: string;

  // if set to true, stripe calls will be skipped
  // useful for testing
  public skipStripe = false;

  constructor(
    connection: DataSource,
    config: ConfigService,
    auth: AuthenticationService
  ) {
    this.connection = connection;
    this.config = config;
    this.auth = auth;
  }

  async _onInit(): Promise<void> {
    await Promise.all(
      gateways.map(async (p) => {
        return await this.connection.getRepository(Gateway).save(p);
      })
    );
    await Promise.all(
      accounts.map(async (p) => {
        return await this.connection.getRepository(Account).save(p);
      })
    );

    let cf = await this.config.configRead({});
    let config: Config = cf.config.data?.PaymentService;
    this.stripePublicKey = config?.stripe_public_key;
    let secr = await this.config.secretRead({});
    let secret: Secret = secr.secret.data?.PaymentService;
    this.stripeApiKey = secret?.stripe_api_key;
    if (!this.stripeApiKey) {
      this.stripeApiKey = process.env.PAYMENT_STRIPE_SECRET_KEY;
    }
    if (!this.stripePublicKey) {
      this.stripePublicKey = process.env.PAYMENT_STRIPE_PUBLIC_KEY;
    }
  }

  /** Charge a credit or debit card to pop up the user's balance */
  topup(req: TopupRequest) {
    return topup(
      this.connection,
      this.auth,
      req,
      this.stripeApiKey,
      this.skipStripe
    );
  }

  /** Payment provider public keys to be used on the frontend */
  publicKey(req: PublicKeyRequest) {
    return {
      publicKey: this.stripePublicKey,
    };
  }

  /** Returns the caller user's balance */
  balance(req: BalanceRequest) {
    return balance(this.connection, this.auth, req);
  }

  /** Returns charges that happened to the caller user's card */
  charges(req: ChargesRequest) {
    return payments(this.connection, this.auth, req);
  }

  payWithBalance(req: PayWithBalanceRequest) {
    return payWithBalance(this.connection, this.auth, req);
  }

  systemBalance(req: SystemBalanceRequest) {
    return systemBalance(this.connection, this.auth, req);
  }
}
