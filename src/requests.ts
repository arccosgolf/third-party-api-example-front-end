import {RoundsResponseBody, TokenResponseBody} from "./types";
import {getUrlSearchParams, queryStringify} from "./utils";

type FetchAuthorizationCodeAccessTokenParams = {
    grant_type: 'authorization_code'
    client_id: string
    code: string
    redirect_uri: string
    client_secret?: string
}

const {
    ID_PROVIDER_URL,
    API_URL,
} = process.env

export const fetchAuthorizationCodeAccessToken = async (params: FetchAuthorizationCodeAccessTokenParams): Promise<TokenResponseBody> => {
    const res = await window.fetch(
        `${ID_PROVIDER_URL}/oauth2/token`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: getUrlSearchParams(params)
        }
    )
    if (!res.ok) {
        throw new Error('invalid response')
    }
    return await res.json()
}

// Note: if accessToken or arccosUserId aren't provided, the request will fail. Typing it this way so the example can be played with.
type FetchRoundsParams = {
    accessToken?: string
    arccosUserId?: string
    limit?: number
    offset?: number
}

export const fetchRounds = async (params: FetchRoundsParams): Promise<RoundsResponseBody> => {
    const {
        arccosUserId,
        accessToken,
        ...restParams
    } = params
    const res = await window.fetch(
        `${API_URL}/protected/v1/users/${arccosUserId}/rounds?${queryStringify(restParams)}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    )
    return await res.json()
}

type FetchRefreshTokenAccessTokenParams = {
    grant_type: 'refresh_token'
    client_id: string
    refresh_token: string
    client_secret?: string
}

export const fetchRefreshTokenAccessToken = async (params: FetchRefreshTokenAccessTokenParams): Promise<TokenResponseBody> => {
    const res = await window.fetch(
        `${ID_PROVIDER_URL}/oauth2/token`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: getUrlSearchParams(params)
        }
    )
    return await res.json()
}

type RevokeRefreshTokenParams = {
    client_id: string
    token: string
}

export const revokeRefreshToken = async (params: RevokeRefreshTokenParams): Promise<void> => {
    await window.fetch(
        `${ID_PROVIDER_URL}/oauth2/revoke`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: getUrlSearchParams(params)
        }
    )
}

