/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
  OneToMany,
  ManyToOne,
  OneToOne,
  Check,
  BeforeInsert,
} from "typeorm";

export declare type Relation<T> = T;
declare var google: any;

export interface Config {
  stripe_public_key: string;
}

export interface Secret {
  stripe_api_key: string;
}

@Entity()
/** Not sure it makes sense to have this as a separate
 * entity. It will never be part of a dropwdown selection
 * and there will be a lot of hardcoded references to it.
 * Still, for compelteness sake, it's here.
 */
export class Gateway {
  @PrimaryColumn()
  id?: string;

  @Column({ nullable: true })
  @Index({ unique: true })
  /** Eg. "stripe" */
  slug?: string;

  @Column({ nullable: true })
  /** Eg. "Stripe" */
  name?: string;

  @OneToMany(() => Charge, (charge) => charge.gateway)
  charges?: Charge[];

  // could be a OneToOne?
  @OneToMany(() => Account, (account) => account.gateway)
  account?: Relation<Account>;

  @Column({ nullable: true })
  accountId?: string;
}

/** The stripe gateway account will always be negative.
 * Essentially, it's a liability account.
 * It
 */
export const gatewayStripe = new Gateway();
gatewayStripe.id = "hOtEmyglYVsgEyMB4qIEA";
gatewayStripe.slug = "stripe";
gatewayStripe.name = "Stripe";

export const gateways = [gatewayStripe];

@Entity()
/** Represents a credit or debit card charge */
@Check(`"amount" > 0`)
@Check(`"currency" <> '' and "currency" is not null`)
export class Charge {
  @BeforeInsert()
  uppercaseCurrency() {
    this.currency = this.currency.toUpperCase();
  }

  @PrimaryColumn()
  id?: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  amount: number;

  @Column()
  currency: string;

  @ManyToOne(() => Gateway, (gateway) => gateway.charges)
  gateway: Gateway;

  @Column()
  gatewayId: string;

  @Column()
  @Unique(["gatewayId", "gateway"])
  /** ID of the charge on the charge gateway */
  gatewayChargeId: string;

  @Column({
    type: "jsonb",
    array: false,
    nullable: false,
  })
  /** The original gateway response for the charge,
   * eg. the Stripe charge object
   */
  gatewayResponse: { [key: string]: any };

  @OneToOne(() => Transaction, (transaction) => transaction.charge)
  transaction?: Relation<Transaction>;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;
}

export enum AccountType {
  /** Internal accounts are ones which balance we can keep track of.
   * Essentially all money on internal accounts is ours, lives in once place,
   * the internal accounts are the way to keep track who owns how much money in that account.
   * Ie. both the company balance and the users balances are inside the internal accounts.
   */
  Internal = "internal",
  /** External accounts are ones which balance we can't keep track of,
   * eg: Stripe's bank account, where the fees go
   * or the user's credit card/bank account
   */
  External = "external",
}

@Entity()
/** An account can be owned by either a user or an organization or
 * a gateway. */
export class Account {
  @PrimaryColumn()
  id?: string;

  @ManyToOne(() => Gateway, (gateway) => gateway.account)
  gateway?: Gateway;

  @Column({ nullable: true })
  gatewayId?: string;

  @Column({ nullable: true })
  /** User that owns the account */
  userId?: string;

  @Column("text")
  /** External accounts are for example the user's card that is being charged.
   * Internal account is for example the user's balance.
   */
  type: AccountType;

  @Column({ nullable: true })
  /** Organization that owns the account */
  organizationId?: string;

  @OneToMany(
    () => TransactionEntry,
    (transactionEntry) => transactionEntry.account
  )
  transactionEntries?: TransactionEntry[];

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;
}

/** The internal account is where we accumulate company funds. */
export const accountCompanyStripe = new Account();
accountCompanyStripe.id = "5DnKkEhk1Hmn1K2KlmfER";
accountCompanyStripe.gateway = gatewayStripe;
accountCompanyStripe.gatewayId = gatewayStripe.id;
accountCompanyStripe.type = AccountType.Internal;

/** The stripe account is where our fees go, it is approximately Stripe's bank account.
 * Flow goes like this: user external account gets charged $10,
 * we get $9.5 (internal stripe account),
 * stripe gets $0.5 (external stripe account).
 */
export const accountStripe = new Account();
accountStripe.id = "y4agWwINzs3y7b6MytWt4";
accountStripe.gateway = gatewayStripe;
accountStripe.gatewayId = gatewayStripe.id;
accountStripe.type = AccountType.External;

export const accounts = [accountCompanyStripe, accountStripe];

@Entity()
export class Transaction {
  @PrimaryColumn()
  id?: string;

  @OneToOne(() => Charge, (charge) => charge.transaction)
  /** Not all transactions have a charge. Topups do but for example
   * purchases on the website don't.
   */
  charge?: Charge;

  @Column({ nullable: true })
  chargeId?: string;

  @Column({ nullable: true })
  /** The item that is being bought with the transaction.
   * Lives outside the payment service.
   * Other name for this could be "externalId".
   */
  itemId?: string;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;
}

@Entity()
@Check(`debit > 0 OR credit > 0`)
export class TransactionEntry {
  @PrimaryColumn()
  id?: string;

  @ManyToOne(() => Account, (account) => account.transactionEntries)
  account: Account;

  @Column()
  accountId?: string;

  @Column({ nullable: true })
  debit: number;

  @Column({ nullable: true })
  credit: number;
}

// potentially this should/could be linked to an account
// modeled after Stripe's card object
// https://stripe.com/docs/api/cards/object
@Entity()
@Check(`"userId" IS NOT NULL OR "organizationId" IS NOT NULL`)
export class Card {
  @PrimaryColumn()
  id?: string;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  organizationId?: string;

  @Column()
  gatewayId: string;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: string;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt?: string;

  @Column({ nullable: true })
  /** This field gets passed to the gateways to charge the user
   * In stripe's case this is the customer id.
   */
  gatewayChargableId?: string;

  // stripe inspired fields below

  @Column({ nullable: true })
  adressCountry?: string;

  @Column({ nullable: true })
  addressLine1?: string;

  @Column({ nullable: true })
  addressLine2?: string;

  @Column({ nullable: true })
  addressState?: string;

  @Column({ nullable: true })
  addressZip?: string;

  @Column({ nullable: true })
  brand?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  cvcCheck?: string;

  @Column({ nullable: true })
  expMonth?: number;

  @Column({ nullable: true })
  expYear?: number;

  @Column({ nullable: true })
  fingerprint?: string;

  @Column({ nullable: true })
  funding?: string;

  @Column({ nullable: true })
  last4?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  tokenizationMethod?: string;
}

export interface TopupRequest {
  token?: string;
  stripeToken: string;
  currency?: string;
  amount?: number; // in cents
  saveCard?: boolean;
}

export interface TopupResponse {}

export interface PublicKeyRequest {}

export interface PublicKeyResponse {
  stripePublicKey: string;
}

export interface BalanceRequest {
  token?: string;
}

export interface BalanceResponse {
  balance: number;
}

export interface ChargesRequest {
  token?: string;
}

export interface ChargesResponse {
  charges: Charge[];
}

export interface TransactionsRequest {
  token?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
}

export interface PayWithBalanceRequest {
  token: string;
  amount: number;
  currency: string;
  itemId: string;
}

export interface PayWithBalanceResponse {}

export interface SystemBalanceRequest {
  token: string;
  gatewayId: string;
  type: AccountType;
}

export interface SystemBalanceResponse {
  balance: number;
}
