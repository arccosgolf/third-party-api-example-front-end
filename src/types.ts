export type TokenResponseBody = {
    access_token: string
    id_token?: string
    refresh_token?: string
}

export type IdTokenPayload = {
    "sub": string
    "custom:arccosUserId": string
    "email": string
}

export type RoundsResponseBody = {}
