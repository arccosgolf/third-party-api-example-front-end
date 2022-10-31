export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            ID_PROVIDER_URL: number
            CLIENT_ID: string
            REDIRECT_URI: string
            API_URL: string
        }
    }
}
