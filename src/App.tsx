import React, {useCallback, useEffect, useState} from "react";
import {IdTokenPayload, RoundsResponseBody, TokenResponseBody} from "./types";
import {
    fetchAuthorizationCodeAccessToken,
    fetchRefreshTokenAccessToken,
    fetchRounds,
    revokeRefreshToken
} from "./requests";
import {getAccessCode, parseJwt} from "./utils";

const {
    ID_PROVIDER_URL,
    CLIENT_ID,
    REDIRECT_URI,
    CLIENT_SECRET,
} = process.env

const SCOPES = [
    'openid',
    'arccos/read:rounds',
]

export const App: React.FC = () => {
    const [tokenResponseBody, setTokenResponseBody] = useState<TokenResponseBody>()
    const accessCode = getAccessCode()
    const [error, setError] = useState<string>()
    const [roundsResponseBody, setRoundsResponseBody] = useState<RoundsResponseBody>()
    const idTokenPayload: IdTokenPayload | undefined = tokenResponseBody?.id_token ? parseJwt(tokenResponseBody.id_token) : undefined
    const arccosUserId = idTokenPayload ? idTokenPayload["custom:arccosUserId"] : undefined

    useEffect(() => {
        if (accessCode && !tokenResponseBody && !error) {
            fetchAuthorizationCodeAccessToken({
                grant_type: 'authorization_code',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: accessCode,
                redirect_uri: REDIRECT_URI,
            })
                .then(body => setTokenResponseBody(body))
                .catch(e => setError(e))
        }
    })

    const doFetchRounds = useCallback(() => {
        fetchRounds({
            accessToken: tokenResponseBody?.access_token,
            arccosUserId,
        })
            .then(body => setRoundsResponseBody(body))
    }, [arccosUserId, tokenResponseBody?.access_token])

    useEffect(() => {
        if (tokenResponseBody?.access_token && arccosUserId && !roundsResponseBody) {
            doFetchRounds()
        }
    })

    const doRefreshToken = useCallback(() => {
        if (tokenResponseBody?.refresh_token) {
            fetchRefreshTokenAccessToken({
                grant_type: 'refresh_token',
                client_id: CLIENT_ID,
                refresh_token: tokenResponseBody.refresh_token,
                client_secret: CLIENT_SECRET,
            })
                .then(body => setTokenResponseBody({
                    refresh_token: tokenResponseBody.refresh_token,
                    ...body
                }))
        }
    }, [tokenResponseBody?.refresh_token])

    const doRevokeToken = useCallback(() => {
        if (tokenResponseBody?.refresh_token) {
            // noinspection JSIgnoredPromiseFromCall
            revokeRefreshToken({
                client_id: CLIENT_ID,
                token: tokenResponseBody.refresh_token,
            })
        }
    }, [tokenResponseBody?.refresh_token])

    const signInUrl = `${ID_PROVIDER_URL}/login?client_id=${CLIENT_ID}&redirect_uri=${encodeURI(REDIRECT_URI)}&response_type=code&scope=${SCOPES.join('+')}`
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
                        onClick={doFetchRounds}
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
                    <span>{tokenResponseBody?.access_token ? `Yes - ${tokenResponseBody.access_token.slice(0, 5)}...${tokenResponseBody.access_token.slice(-5)}` : 'No'}</span>
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
