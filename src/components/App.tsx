import React, {useCallback, useEffect, useState} from "react";

const ID_PROVIDER_URL = 'https://iqa-cf-arccosgolf.auth.us-west-2.amazoncognito.com'
const CLIENT_ID = '4rbgeqka60eh4ip2qc8td3spj0'
// const CLIENT_SECRET = 'jgps5k64p9811itseka6n5pnjveaa3bf1gn2c7a08sk8dcdfve0'
const REDIRECT_URI = 'http://localhost:8080'
const RESPONSE_TYPE = 'code'
const SCOPES = [
    'openid',
    // 'email',
    // 'profile',
    'arccos/read:rounds',
]

type TokenResponseBody = {
    access_token: string
    id_token?: string
    refresh_token?: string
}

type IdTokenPayload = {
    "sub": string
    "custom:arccosUserId": string
    "email": string
}

type RoundsResponseBody = {}

export const App: React.FC = () => {
    const [tokenResponseBody, setTokenResponseBody] = useState<TokenResponseBody>()
    const queryParams = new URLSearchParams(window.location.search)
    const accessCode = queryParams.get('code')
    const [error, setError] = useState<string>()
    const [roundsResponseBody, setRoundsResponseBody] = useState<RoundsResponseBody>()
    const idTokenPayload: IdTokenPayload | undefined = tokenResponseBody?.id_token ? parseJwt(tokenResponseBody.id_token) : undefined
    const arccosUserId = idTokenPayload ? idTokenPayload["custom:arccosUserId"] : undefined

    useEffect(() => {
        if (accessCode && !tokenResponseBody && !error) {
            window.fetch(
                `https://iqa-cf-arccosgolf.auth.us-west-2.amazoncognito.com/oauth2/token`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        grant_type: 'authorization_code',
                        client_id: CLIENT_ID,
                        code: accessCode,
                        redirect_uri: REDIRECT_URI,
                        // client_secret: CLIENT_SECRET,
                    })
                }
            )
                .then(res => {
                    if (!res.ok) {
                        throw new Error('invalid response')
                    }
                    return res.json()
                })
                .then(body => setTokenResponseBody(body))
                .catch(e => setError(e))
        }
    })

    const fetchRounds = useCallback(() => {
        window.fetch(
            `https://iqa.api.arccosgolf.com/protected/v1/users/${arccosUserId}/rounds`,
            {
                headers: {
                    Authorization: `Bearer ${tokenResponseBody?.access_token}`,
                },
            }
        )
            .then(res => res.json())
            .then(body => setRoundsResponseBody(body))
    }, [arccosUserId, tokenResponseBody?.access_token])

    useEffect(() => {
        if (tokenResponseBody?.access_token && arccosUserId && !roundsResponseBody) {
            fetchRounds()
        }
    })

    const doRefreshToken = useCallback(() => {
        if (tokenResponseBody?.refresh_token) {
            window.fetch(
                `https://iqa-cf-arccosgolf.auth.us-west-2.amazoncognito.com/oauth2/token`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        grant_type: 'refresh_token',
                        client_id: CLIENT_ID,
                        refresh_token: tokenResponseBody.refresh_token,
                        // client_secret: CLIENT_SECRET,
                    })
                }
            )
                .then(res => res.json())
                .then(body => setTokenResponseBody({
                    refresh_token: tokenResponseBody.refresh_token,
                    ...body
                }))
        }
    }, [tokenResponseBody?.refresh_token])

    const doRevokeToken = useCallback(() => {
        if (tokenResponseBody?.refresh_token) {
            window.fetch(
                `https://iqa-cf-arccosgolf.auth.us-west-2.amazoncognito.com/oauth2/revoke`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        client_id: CLIENT_ID,
                        token: tokenResponseBody.refresh_token,
                    })
                }
            )
                // .then(() => setTokenResponseBody(undefined))
        }
    }, [tokenResponseBody?.refresh_token])

    const signInUrl = `${ID_PROVIDER_URL}/login?client_id=${CLIENT_ID}&redirect_uri=${encodeURI(REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${SCOPES.join('+')}`
    return (
        <div>
            <div style={{whiteSpace: 'pre-wrap'}}>
                <h3>Authentication Information</h3>
                <div>
                    <a href={signInUrl}>Click Here to Sign In</a>
                </div>
                <br/>
                <div>
                    <button
                        onClick={doRefreshToken}
                        disabled={!tokenResponseBody}
                        type={'button'}
                    >
                        Refresh Token
                    </button>
                    <button
                        onClick={doRevokeToken}
                        disabled={!tokenResponseBody}
                        type={'button'}
                    >
                        Revoke Token
                    </button>
                    <button
                        onClick={fetchRounds}
                        type={'button'}
                    >
                        Fetch Rounds
                    </button>
                </div>
                <br/>
                <div>
                    <label>Has Access Code: </label>
                    <span>{accessCode ? 'Yes' : 'No'}</span>
                </div>
                <div>
                    <label>Has Token Response: </label>
                    <span>{tokenResponseBody?.access_token ? `Yes: ${tokenResponseBody.access_token.slice(0, 5)}...${tokenResponseBody.access_token.slice(-5)}` : 'No'}</span>
                </div>
                <br/>
                <div>
                    <label>ID Token Payload: </label>
                    <div>{idTokenPayload ? JSON.stringify(idTokenPayload, null, 4) : 'undefined'}</div>
                </div>
                <br/>
                <div>
                    <label>Rounds Response: </label>
                    <div>{roundsResponseBody ? JSON.stringify(roundsResponseBody, null, 4) : 'undefined'}</div>
                </div>
            </div>
        </div>
    )
}

const parseJwt = (token: string) => {
    const base64Url = token.split('.')[1]
    const base64 = base64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
        window.atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    )

    return JSON.parse(jsonPayload)
}
