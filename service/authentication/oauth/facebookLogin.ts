/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import { FacebookLoginRequest, FacebookLoginResponse } from "../models";
import registerOrLoginWithProvenIdentity from "./registerOrLoginWithProvenIdentity";
import axios from "axios";

interface MeResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

async function getFacebookUserData(access_token): Promise<MeResponse> {
  const { data } = await axios({
    url: "https://graph.facebook.com/me",
    method: "get",
    params: {
      // @todo make this configurable?
      // test response https://developers.facebook.com/tools/explorer/
      fields: ["id", "email", "first_name", "last_name"].join(","),
      access_token: access_token,
    },
  });
  return data;
}

// https://medium.com/@jackrobertscott/facebook-auth-with-node-js-c4bb90d03fc0
async function getAccessTokenFromCode(code, appId, appSecret, appRedirect) {
  const { data } = await axios({
    url: "https://graph.facebook.com/v15.0/oauth/access_token",
    method: "get",
    params: {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: appRedirect,
      code,
    },
  });
  // data example: { access_token, token_type, expires_in }
  // {
  //    access_token: 'EAAItvar5EZA...GAI1XOujNby9yVL7iyYEG4jEwzw1bJQZDZD',
  //    token_type: 'bearer',
  //    expires_in: 5178870
  // }

  return data.access_token;
}

export default async (
  connection: DataSource,
  request: FacebookLoginRequest,
  facebookAppID: string,
  facebookAppSecret: string,
  facebookAppRedirectURL: string
): Promise<FacebookLoginResponse> => {
  let accessToken = await getAccessTokenFromCode(
    request.accessToken,
    facebookAppID,
    facebookAppSecret,
    facebookAppRedirectURL
  );
  let rsp = await getFacebookUserData(accessToken);
  // @todo we could save the facebook access token but
  // we don't really need it apart from login or register
  return await registerOrLoginWithProvenIdentity(connection, {
    firstName: rsp.first_name,
    lastName: rsp.last_name,
    email: rsp.email,
  });
};
