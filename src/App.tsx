import React, {useEffect, useState} from "react";
import {IdTokenPayload, RoundsResponseBody, TokenResponseBody} from "./types";
import {
    fetchAuthorizationCodeAccessToken,
    fetchRefreshTokenAccessToken,
    fetchRounds,
    revokeRefreshToken
} from "./requests";
import {getAuthorizationCode, parseJwt, queryStringify} from "./utils";

const {
    // this is our publicly hosted authentication endpoint. currently it points at an awscognito domain. Ideally we'll
    // change that in the future.
    ID_PROVIDER_URL,
    // client id that you would have been issued
    CLIENT_ID,
    // uri where you would like to receive the user after they have authorized your application with us. This must be
    // configured in advance. We can support multiple redirect uris.
    REDIRECT_URI,
    // if you were issued a client secret, it would be used here. client secrets aren't strictly required and only offer
    // additional security in specific situations
    CLIENT_SECRET,
} = process.env

// scopes describe different levels of access, which allow us to limit access to specific endpoints. For example, we
// will likely allow all clients to request `arccos/read:rounds` for any user that lets them. We will likely not allow
// clients to request `arccos/update:user-password`.
const SCOPES = [
    // the `openid` scope is required to get an id token in the response when you hit the "tokens" endpoint. an
    // id token is required if you need a users arccos id (which you do for most endpoints), as well as a user's
    // email address. The data is in the id token payload under `email` and `custom:arccosUserId`.
    'openid',
    // all scopes will live under our resource server `arccos`. `arccos/read:rounds` will allow you to call the
    // GET rounds endpoint.
    'arccos/read:rounds',
]

// if you don't know react this may be sort of confusing, but `App` is a functional component which is a function that
// returns JSX which is then transpiled into html. There's a few functions we use here to manage state within the
// component:
// * `const [myState, setMyState] = useState(initialState)` - allows us to store local state that's persistent on
// re-renders. This is similar to `this.state` and `this.setState(...)` if you're familiar with older React code.
//
// * `useEffect(myCallback)` - allows us to call a callback function once on component initialization, and then again
// whenever any of the callback's dependencies change. A dependency is a variable that is read from the broader
// scope of the component (outside the callback). For instance `tokenResponseBody` is a dependency in the second
// `useEffect` because it's defined at the top level of the function (with a `useState` call) and referenced within
// the callback.
//
// For more information on React and functional components, look here: https://reactjs.org/docs/hooks-intro.html
export const App: React.FC = () => {
    // authorization codes will be returned to clients via a query param in the redirect after a user grants access.
    const authorizationCode = getAuthorizationCode()

    // state variables for two of the responses from requests made in this component
    const [tokenResponseBody, setTokenResponseBody] = useState<TokenResponseBody>()
    const [roundsResponseBody, setRoundsResponseBody] = useState<RoundsResponseBody>()

    // if an error occurs anywhere, it will go in this variable
    const [error, setError] = useState<string>()

    // if we were able to retrieve an id token, get the arccos user id out of its payload. Both the `id_token` and
    // `access_token` are JWTs that contain different information in their payloads. *They are not interchangeable.*
    // the id token's only purpose is to send verifiably signed information.
    const idTokenPayload: IdTokenPayload | undefined = tokenResponseBody?.id_token ? parseJwt(tokenResponseBody.id_token) : undefined
    const arccosUserId = idTokenPayload ? idTokenPayload["custom:arccosUserId"] : undefined

    // function that allows us to make a request for a user's rounds.
    const doFetchRounds = () =>
        fetchRounds({
            accessToken: tokenResponseBody?.access_token,
            arccosUserId,
            limit: 5,
            offset: 0,
        })
            .then(body => setRoundsResponseBody(body))

    // function that allows us to refresh our access token as well as our (less importantly) id token.
    const doRefreshToken = () => {
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
    }

    // function that allows us to revoke a users access, id, and refresh token (all within the same session). You
    // likely won't use this endpoint in production.
    const doRevokeToken = () => {
        if (tokenResponseBody?.refresh_token) {
            // noinspection JSIgnoredPromiseFromCall
            revokeRefreshToken({
                client_id: CLIENT_ID,
                token: tokenResponseBody.refresh_token,
            })
        }
    }

    // if we have an authorization code in the query params, haven't requested a token, and haven't received an error, attempt
    // to fetch tokens for a user using the authorization code
    useEffect(() => {
        if (authorizationCode && !tokenResponseBody && !error) {
            fetchAuthorizationCodeAccessToken({
                grant_type: 'authorization_code',
                client_id: CLIENT_ID,
                // if you are set up with us as a client who has a secret, `client_secret` is required. Otherwise, it
                // should be `undefined`.
                client_secret: CLIENT_SECRET,
                code: authorizationCode,
                redirect_uri: REDIRECT_URI,
            })
                .then(body => {
                    console.log(`access token response body:`, body)
                    setTokenResponseBody(body)
                })
                .catch(e => setError(e))
        }
    })

    // if we have an access token and haven't fetched rounds yet, fetch rounds.
    useEffect(() => {
        if (tokenResponseBody?.access_token && arccosUserId && !roundsResponseBody) {
            // noinspection JSIgnoredPromiseFromCall
            doFetchRounds()
        }
    })

    const signInUrl = `${ID_PROVIDER_URL}/login?${queryStringify({
        client_id: CLIENT_ID,
        // again, if you are set up with us as a client who has a secret, `client_secret` is required. Otherwise, it
        // should be `undefined`.
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        // all scopes you plan to use must be authorized up-front. If you request more scopes later using the refresh
        // token, you will get errors.
        scope: SCOPES.length ? SCOPES.join('+') : undefined,
    }, {
        shouldEncodeUriComponent: false,
    })}`
    return (
        <div>
            <div style={{whiteSpace: 'pre-wrap'}}>
                <h3>Authentication Demo</h3>
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
                    <span>{authorizationCode ? 'Yes' : 'No'}</span>
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
