

import { DataSource } from "typeorm";
import { error } from "../../util.js";
import {
  TopupRequest,
  TopupResponse,
  Charge,
  gatewayStripe,
  Account,
  AccountType,
  Transaction,
  TransactionEntry,
  Card,
} from "./models.js";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import { AuthenticationService } from "../authentication/index.js";
import { platformEmail } from "../authentication/models.js";

export default async (
  connection: DataSource,
  auth: AuthenticationService,
  req: TopupRequest,
  apiKey: string,
  skipStripe: boolean
): Promise<TopupResponse> => {
  if (!skipStripe && !apiKey) {
    throw error("payment provider api key missing", 400);
  }

  let token = await auth.tokenRead({
    token: req.token,
  });

  if (!req.amount || req.amount <= 0) {
    throw error("amount missing", 400);
  }
  if (!req.token) {
    throw error("token missing", 400);
  }
  if (!req.currency) {
    throw error("currency missing", 400);
  }

  let internalUserAccount;
  let externalUserAccount;
  await connection.transaction(async (tran) => {
    let userAccounts = await connection
      .createQueryBuilder(Account, "account")
      .where(`account."userId" = :userId`, { userId: token.token.userId })
      .getMany();

    if (!userAccounts.find((a) => a.type === AccountType.Internal)) {
      let newAccount = new Account();
      newAccount.id = nanoid();
      newAccount.userId = token.token.userId;
      newAccount.type = AccountType.Internal;
      newAccount.gatewayId = gatewayStripe.id;
      await tran.save(newAccount);
      internalUserAccount = newAccount;
    } else {
      internalUserAccount = userAccounts.find(
        (a) => a.type === AccountType.Internal
      );
    }
    if (!userAccounts.find((a) => a.type === AccountType.External)) {
      let newAccount = new Account();
      newAccount.id = nanoid();
      newAccount.userId = token.token.userId;
      newAccount.type = AccountType.External;
      await tran.save(newAccount);
      externalUserAccount = newAccount;
    } else {
      externalUserAccount = userAccounts.find(
        (a) => a.type === AccountType.External
      );
    }
  });
  if (!externalUserAccount) {
    throw error("external user account not found", 500);
  }
  if (!internalUserAccount) {
    throw error("internal user account not found", 500);
  }

  let charge: Stripe.Response<Stripe.Charge>;
  if (req.saveCard) {
    throw error("not implemented", 500);
    let stripe = new Stripe(apiKey, { apiVersion: "2022-11-15" });
    let customer = await stripe.customers.create({
      source: req.stripeToken,
      email: token.token.user.contacts.find(
        (c) => c.platformId == platformEmail.id
      ).url,
      name: token.token.user.fullName,
    });
    let stripeCard = await stripe.customers.retrieveSource(
      customer.id,
      customer.default_source as string
    );
    let card: Card = new Card();
    card.id = nanoid();
    card.userId = token.token.userId;
    card.gatewayId = gatewayStripe.id;
    card.gatewayChargableId = customer.id;
    console.log(stripeCard);
    // @todo crufter: finish
  } else {
    if (!skipStripe) {
      try {
        var stripe = new Stripe(apiKey, { apiVersion: "2022-11-15" });

        charge = await stripe.charges.create({
          source: req.stripeToken,
          currency: req.currency,
          amount: req.amount,
          capture: true,
        });
      } catch (err) {
        if (err) {
          console.log("Problem charging customer: ", err);
          throw error(JSON.stringify(err), 500);
        }
      }
    } else {
      charge = {
        id: nanoid(),
      } as Stripe.Response<Stripe.Charge>;
    }
  }

  const newCharge: Charge = new Charge();
  newCharge.id = nanoid();
  newCharge.userId = token.token.userId;
  newCharge.amount = req.amount;
  newCharge.currency = req.currency;
  newCharge.description = "Top up";
  newCharge.gatewayChargeId = charge.id;
  newCharge.gatewayResponse = charge;
  newCharge.gatewayId = gatewayStripe.id;

  let transaction = new Transaction();
  transaction.id = nanoid();
  transaction.chargeId = newCharge.id;

  let externalUserTransactionEntry = new TransactionEntry();
  externalUserTransactionEntry.id = nanoid();
  externalUserTransactionEntry.accountId = externalUserAccount.id;
  externalUserTransactionEntry.debit = req.amount;
  externalUserTransactionEntry.credit = 0;

  let internalUserTransactionEntry = new TransactionEntry();
  internalUserTransactionEntry.id = nanoid();
  internalUserTransactionEntry.accountId = internalUserAccount.id;
  internalUserTransactionEntry.debit = 0;
  internalUserTransactionEntry.credit = req.amount;

  // @todo add transaction for stripe account where the
  // fees go. not sure how to get the fees yet

  await connection.transaction(async (tran) => {
    await tran.save(newCharge);
    await tran.save(transaction);
    await tran.save(externalUserTransactionEntry);
    await tran.save(internalUserTransactionEntry);
  });

  return {};
};
